require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { google } = require('googleapis');
const { runQuery, getQuery, getSingle } = require('./db');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    req.user_id = decoded.user_id;
    next();
  });
};

// ---------------- AUTH ROUTES ----------------

app.post('/api/auth/request-link', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  
  try {
    let user = await getSingle('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      const result = await runQuery('INSERT INTO users (email) VALUES (?)', [email]);
      user = { id: result.id, email };
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
    
    await runQuery('INSERT INTO magic_links (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expiresAt]);
    
    const CLIENT_URL = process.env.CLIENT_URL || 'https://wudid.netlify.app';
    const magicLink = `${CLIENT_URL}/verify?token=${token}`;
    
    // DEVELOPMENT: Print to console
    console.log('\n======================================================');
    console.log('MAGIC LINK GENERATED:');
    console.log(magicLink);
    console.log('======================================================\n');
    
    // Send email via Gmail HTTPS REST API
    try {
      const subject = 'Your Wudid Login Link';
      const htmlBody = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #0f172a;">Wudid</h1>
                <p>You requested a magic link to sign in to your Wudid account.</p>
                <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; margin: 20px 0;">Sign In</a>
                <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this URL into your browser:</p>
                <p style="color: #3b82f6; font-size: 12px; word-break: break-all; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${magicLink}</p>
                <p style="color: #64748b; font-size: 14px; margin-top: 24px;">This link will expire in 15 minutes.</p>
              </div>`;

      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: Wudid <${process.env.GMAIL_USER}>`,
        `To: ${email}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        htmlBody,
      ];
      
      const encodedMessage = Buffer.from(messageParts.join('\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage }
      });
      
    } catch (emailErr) {
      console.error('GMAIL API ERROR:', emailErr);
      return res.status(500).json({ error: 'Failed to send email via Gmail API. Check backend terminal for link.' });
    }
    
    res.json({ success: true, message: 'Magic link generated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  try {
    const link = await getSingle('SELECT * FROM magic_links WHERE token = ? AND used = 0', [token]);
    if (!link) return res.status(400).json({ error: 'Invalid or used token' });
    
    if (new Date(link.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token expired' });
    }
    
    await runQuery('UPDATE magic_links SET used = 1 WHERE id = ?', [link.id]);
    
    const jwtToken = jwt.sign({ user_id: link.user_id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PROTECTED ROUTES ----------------

app.get('/api/status', authenticateToken, async (req, res) => {
  try {
    const minChecklist = await getSingle('SELECT MIN(date) as minDate FROM checklist_items WHERE user_id = ?', [req.user_id]);
    const minTask = await getSingle('SELECT MIN(date) as minDate FROM task_entries WHERE user_id = ?', [req.user_id]);
    
    let d1 = minChecklist?.minDate;
    let d2 = minTask?.minDate;
    
    let startDate = new Date().toISOString().split('T')[0];
    if (d1 && d2) {
      startDate = d1 < d2 ? d1 : d2;
    } else if (d1) {
      startDate = d1;
    } else if (d2) {
      startDate = d2;
    }

    res.json({ startDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/day/:date', authenticateToken, async (req, res) => {
  const { date } = req.params;
  try {
    const checklist = await getQuery('SELECT * FROM checklist_items WHERE date = ? AND user_id = ? ORDER BY is_completed ASC, order_idx ASC, id ASC', [date, req.user_id]);
    
    const tasks = await getQuery(`
      SELECT t.*, l.name as label_name, l.color as label_color 
      FROM task_entries t 
      LEFT JOIN labels l ON t.label_id = l.id 
      WHERE t.date = ? AND t.user_id = ?
      ORDER BY t.id ASC
    `, [date, req.user_id]);
    
    const event = await getSingle('SELECT * FROM events WHERE date = ? AND user_id = ?', [date, req.user_id]);

    res.json({ checklist, tasks, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/month/:year/:month', authenticateToken, async (req, res) => {
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}%`;
  
  try {
    const checklistItems = await getQuery('SELECT date, text, is_completed FROM checklist_items WHERE date LIKE ? AND user_id = ? ORDER BY id ASC', [prefix, req.user_id]);
    const tasks = await getQuery(`
      SELECT t.date, t.text, l.name as label_name, l.color as label_color 
      FROM task_entries t 
      LEFT JOIN labels l ON t.label_id = l.id 
      WHERE t.date LIKE ? AND t.user_id = ?
      ORDER BY t.id ASC
    `, [prefix, req.user_id]);
    const events = await getQuery('SELECT date, name FROM events WHERE date LIKE ? AND user_id = ?', [prefix, req.user_id]);
    
    const days = {};
    for (const item of checklistItems) {
      if (!days[item.date]) days[item.date] = { checklist: [], tasks: [], event: null };
      days[item.date].checklist.push({ text: item.text, is_completed: item.is_completed });
    }
    for (const task of tasks) {
      if (!days[task.date]) days[task.date] = { checklist: [], tasks: [], event: null };
      days[task.date].tasks.push({ text: task.text, label_color: task.label_color, label_name: task.label_name });
    }
    for (const evt of events) {
      if (!days[evt.date]) days[evt.date] = { checklist: [], tasks: [], event: null };
      days[evt.date].event = evt.name;
    }
    
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checklist', authenticateToken, async (req, res) => {
  const { date, text } = req.body;
  if (!text || text.length > 300) return res.status(400).json({ error: 'Text must be between 1 and 300 characters' });
  try {
    const countRes = await getSingle('SELECT COUNT(*) as count FROM checklist_items WHERE date = ? AND user_id = ?', [date, req.user_id]);
    if (countRes.count >= 100) return res.status(400).json({ error: 'Max checklist items (100) reached for this day' });
    const result = await runQuery('INSERT INTO checklist_items (user_id, date, text, is_completed, order_idx) VALUES (?, ?, ?, 0, 0)', [req.user_id, date, text]);
    res.json({ id: result.id, date, text, is_completed: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/checklist/:id', authenticateToken, async (req, res) => {
  const { is_completed } = req.body;
  try {
    await runQuery('UPDATE checklist_items SET is_completed = ? WHERE id = ? AND user_id = ?', [is_completed ? 1 : 0, req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/checklist/:id', authenticateToken, async (req, res) => {
  try {
    await runQuery('DELETE FROM checklist_items WHERE id = ? AND user_id = ?', [req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { date, text, label_id } = req.body;
  if (!text || text.length > 300) return res.status(400).json({ error: 'Text must be between 1 and 300 characters' });
  try {
    const countRes = await getSingle('SELECT COUNT(*) as count FROM task_entries WHERE date = ? AND user_id = ?', [date, req.user_id]);
    if (countRes.count >= 100) return res.status(400).json({ error: 'Max tasks (100) reached for this day' });
    const result = await runQuery('INSERT INTO task_entries (user_id, date, text, label_id) VALUES (?, ?, ?, ?)', [req.user_id, date, text, label_id || null]);
    res.json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { label_id } = req.body;
  try {
    await runQuery('UPDATE task_entries SET label_id = ? WHERE id = ? AND user_id = ?', [label_id || null, req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await runQuery('DELETE FROM task_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/streak', authenticateToken, async (req, res) => {
  try {
    const datesRes = await getQuery(`
      SELECT DISTINCT date FROM (
        SELECT date FROM checklist_items WHERE user_id = ? AND is_completed = 1
        UNION
        SELECT date FROM task_entries WHERE user_id = ?
      ) ORDER BY date DESC
    `, [req.user_id, req.user_id]);
    
    let streak = 0;
    const todayObj = new Date();
    const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;
    
    let currentDateObj = new Date(todayObj);
    let checkDateStr = todayStr;
    const dates = datesRes.map(d => d.date);
    
    if (!dates.includes(todayStr)) {
      let yesterdayObj = new Date(todayObj);
      yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
      if (dates.includes(yesterdayStr)) {
        currentDateObj = yesterdayObj;
        checkDateStr = yesterdayStr;
      } else {
        return res.json({ streak: 0 });
      }
    }
    
    while (true) {
      if (dates.includes(checkDateStr)) {
        streak++;
        currentDateObj.setDate(currentDateObj.getDate() - 1);
        checkDateStr = `${currentDateObj.getFullYear()}-${String(currentDateObj.getMonth() + 1).padStart(2, '0')}-${String(currentDateObj.getDate()).padStart(2, '0')}`;
      } else {
        break;
      }
    }
    
    res.json({ streak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/monthly/:year/:month', authenticateToken, async (req, res) => {
  const { year, month } = req.params;
  const prefix = `${year}-${month.padStart(2, '0')}%`;
  
  try {
    const checklistItems = await getQuery('SELECT date, is_completed FROM checklist_items WHERE date LIKE ? AND user_id = ?', [prefix, req.user_id]);
    const tasks = await getQuery(`
      SELECT t.date, l.name as label_name, l.color as label_color 
      FROM task_entries t 
      LEFT JOIN labels l ON t.label_id = l.id 
      WHERE t.date LIKE ? AND t.user_id = ?
    `, [prefix, req.user_id]);
    
    let totalCompletedChecklist = 0;
    let totalTasks = tasks.length;
    const dailyData = {};
    const labelData = {};
    
    for (const item of checklistItems) {
      if (item.is_completed) totalCompletedChecklist++;
      if (!dailyData[item.date]) dailyData[item.date] = { date: item.date, tasksCount: 0, checklistCount: 0 };
      if (item.is_completed) dailyData[item.date].checklistCount++;
    }
    
    for (const task of tasks) {
      if (!dailyData[task.date]) dailyData[task.date] = { date: task.date, tasksCount: 0, checklistCount: 0 };
      dailyData[task.date].tasksCount++;
      
      const lblName = task.label_name || 'Unlabeled';
      const lblColor = task.label_color || '#94a3b8';
      if (!labelData[lblName]) labelData[lblName] = { name: lblName, color: lblColor, value: 0 };
      labelData[lblName].value++;
    }
    
    const dailyArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    const labelArray = Object.values(labelData).sort((a, b) => b.value - a.value);
    
    res.json({ totalTasks, totalCompletedChecklist, dailyData: dailyArray, labelData: labelArray, rawTasks: tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/yearly/:year', authenticateToken, async (req, res) => {
  const { year } = req.params;
  const prefix = `${year}-%`;
  
  try {
    const checklistItems = await getQuery('SELECT date, is_completed FROM checklist_items WHERE date LIKE ? AND user_id = ?', [prefix, req.user_id]);
    const tasks = await getQuery('SELECT date FROM task_entries WHERE date LIKE ? AND user_id = ?', [prefix, req.user_id]);
    
    const dailyCounts = {};
    
    for (const item of checklistItems) {
      if (item.is_completed) {
        if (!dailyCounts[item.date]) dailyCounts[item.date] = 0;
        dailyCounts[item.date]++;
      }
    }
    
    for (const task of tasks) {
      if (!dailyCounts[task.date]) dailyCounts[task.date] = 0;
      dailyCounts[task.date]++;
    }
    
    res.json(dailyCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/labels', authenticateToken, async (req, res) => {
  try {
    const labels = await getQuery('SELECT * FROM labels WHERE user_id = ?', [req.user_id]);
    res.json(labels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labels', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  if (!name || name.length > 30) return res.status(400).json({ error: 'Name must be between 1 and 30 characters' });
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return res.status(400).json({ error: 'Color must be a valid hex code' });
  try {
    const countRes = await getSingle('SELECT COUNT(*) as count FROM labels WHERE user_id = ?', [req.user_id]);
    if (countRes.count >= 20) return res.status(400).json({ error: 'Max labels (20) reached' });
    const result = await runQuery('INSERT INTO labels (user_id, name, color) VALUES (?, ?, ?)', [req.user_id, name, color]);
    res.json({ id: result.id, name, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labels/:id', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  if (!name || name.length > 30) return res.status(400).json({ error: 'Name must be between 1 and 30 characters' });
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return res.status(400).json({ error: 'Color must be a valid hex code' });
  try {
    await runQuery('UPDATE labels SET name = ?, color = ? WHERE id = ? AND user_id = ?', [name, color, req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/labels/:id', authenticateToken, async (req, res) => {
  try {
    await runQuery('DELETE FROM labels WHERE id = ? AND user_id = ?', [req.params.id, req.user_id]);
    await runQuery('UPDATE task_entries SET label_id = NULL WHERE label_id = ? AND user_id = ?', [req.params.id, req.user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  const { date, name } = req.body;
  const eventName = name ? name.trim() : '';
  if (eventName && eventName.length > 50) return res.status(400).json({ error: 'Event name must be under 50 characters' });
  try {
    await runQuery('INSERT INTO events (user_id, date, name) VALUES (?, ?, ?) ON CONFLICT(date, user_id) DO UPDATE SET name = excluded.name', [req.user_id, date, eventName]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Render Free Tier Keep-Alive Hack
const https = require('https');
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (url) {
    https.get(url + '/api/status', (resp) => {
      if (resp.statusCode === 200) console.log('Keep-alive ping successful');
    }).on('error', (err) => console.error('Keep-alive failed:', err.message));
  }
}, 10 * 60 * 1000); // 10 minutes

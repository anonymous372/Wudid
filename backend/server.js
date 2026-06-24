require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { google } = require('googleapis');
const mongoose = require('./db');
const { User, MagicLink, Label, Event, ChecklistItem, TaskEntry } = require('./models');

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
    
    // If the token is from the old SQLite DB (integer id), force them to login again
    if (!mongoose.Types.ObjectId.isValid(decoded.user_id)) {
      return res.status(401).json({ error: 'Unauthorized: Legacy token detected, please log in again.' });
    }
    
    req.user_id = decoded.user_id;
    next();
  });
};

// ---------------- AUTH ROUTES ----------------
app.post('/api/auth/request-link', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await MagicLink.create({ user_id: user._id, token, expires_at: expiresAt });
    
    const CLIENT_URL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173' 
      : (process.env.CLIENT_URL || 'https://wudid.netlify.app');
    const magicLink = `${CLIENT_URL}/verify?token=${token}`;
    
    console.log('\n======================================================');
    console.log('MAGIC LINK GENERATED:');
    console.log(magicLink);
    console.log('======================================================\n');
    
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
      const encodedMessage = Buffer.from(messageParts.join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } });
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
    const link = await MagicLink.findOne({ token, used: false });
    if (!link) return res.status(400).json({ error: 'Invalid or used token' });
    if (new Date(link.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });
    
    link.used = true;
    await link.save();
    
    const jwtToken = jwt.sign({ user_id: link.user_id.toString() }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token: jwtToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PROTECTED ROUTES ----------------

app.get('/api/status', authenticateToken, async (req, res) => {
  try {
    const minChecklist = await ChecklistItem.findOne({ user_id: req.user_id }).sort({ date: 1 }).select('date');
    const minTask = await TaskEntry.findOne({ user_id: req.user_id }).sort({ date: 1 }).select('date');
    
    let d1 = minChecklist?.date;
    let d2 = minTask?.date;
    
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
    const checklist = await ChecklistItem.find({ date, user_id: req.user_id }).sort({ is_completed: 1, _id: 1 });
    const tasksRaw = await TaskEntry.find({ date, user_id: req.user_id }).populate('label_id').sort({ _id: 1 });
    
    const tasks = tasksRaw.map(t => {
      const json = t.toJSON();
      if (t.label_id) {
        json.label_name = t.label_id.name;
        json.label_color = t.label_id.color;
        json.label_id = t.label_id._id.toString();
      }
      return json;
    });
    
    const event = await Event.findOne({ date, user_id: req.user_id });
    res.json({ checklist, tasks, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/month/:year/:month', authenticateToken, async (req, res) => {
  const { year, month } = req.params;
  const prefix = new RegExp(`^${year}-${month.padStart(2, '0')}`);
  try {
    const checklistItems = await ChecklistItem.find({ user_id: req.user_id, date: prefix }).sort({ _id: 1 });
    const tasksRaw = await TaskEntry.find({ user_id: req.user_id, date: prefix }).populate('label_id').sort({ _id: 1 });
    const events = await Event.find({ user_id: req.user_id, date: prefix });
    
    const days = {};
    for (const item of checklistItems) {
      if (!days[item.date]) days[item.date] = { checklist: [], tasks: [], event: null };
      days[item.date].checklist.push({ text: item.text, is_completed: item.is_completed });
    }
    for (const task of tasksRaw) {
      if (!days[task.date]) days[task.date] = { checklist: [], tasks: [], event: null };
      days[task.date].tasks.push({ 
        text: task.text, 
        label_color: task.label_id ? task.label_id.color : null, 
        label_name: task.label_id ? task.label_id.name : null 
      });
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
    const count = await ChecklistItem.countDocuments({ date, user_id: req.user_id });
    if (count >= 100) return res.status(400).json({ error: 'Max checklist items (100) reached for this day' });
    const item = await ChecklistItem.create({ user_id: req.user_id, date, text, is_completed: false });
    res.json(item.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/checklist/:id', authenticateToken, async (req, res) => {
  const { is_completed } = req.body;
  try {
    await ChecklistItem.findOneAndUpdate({ _id: req.params.id, user_id: req.user_id }, { is_completed: !!is_completed });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/checklist/:id', authenticateToken, async (req, res) => {
  try {
    await ChecklistItem.findOneAndDelete({ _id: req.params.id, user_id: req.user_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { date, text, label_id } = req.body;
  if (!text || text.length > 300) return res.status(400).json({ error: 'Text must be between 1 and 300 characters' });
  try {
    const count = await TaskEntry.countDocuments({ date, user_id: req.user_id });
    if (count >= 100) return res.status(400).json({ error: 'Max tasks (100) reached for this day' });
    const task = await TaskEntry.create({ user_id: req.user_id, date, text, label_id: label_id || null });
    res.json({ id: task._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { label_id } = req.body;
  try {
    await TaskEntry.findOneAndUpdate({ _id: req.params.id, user_id: req.user_id }, { label_id: label_id || null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await TaskEntry.findOneAndDelete({ _id: req.params.id, user_id: req.user_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/streak', authenticateToken, async (req, res) => {
  try {
    const cDates = await ChecklistItem.distinct('date', { user_id: req.user_id, is_completed: true });
    const tDates = await TaskEntry.distinct('date', { user_id: req.user_id });
    const dates = [...new Set([...cDates, ...tDates])].sort().reverse();
    
    let streak = 0;
    const todayStr = req.query.today || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const [tY, tM, tD] = todayStr.split('-');
    const todayObj = new Date(parseInt(tY), parseInt(tM) - 1, parseInt(tD));
    
    let currentDateObj = new Date(todayObj);
    let checkDateStr = todayStr;
    
    if (!dates.includes(todayStr)) {
      let yesterdayObj = new Date(todayObj);
      yesterdayObj.setDate(yesterdayObj.getDate() - 1);
      const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;
      if (dates.includes(yesterdayStr)) {
        currentDateObj = yesterdayObj;
        checkDateStr = yesterdayStr;
      } else {
        return res.json({ streak: 0, isActiveToday: false });
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
    
    res.json({ streak, isActiveToday: dates.includes(todayStr) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/monthly/:year/:month', authenticateToken, async (req, res) => {
  const { year, month } = req.params;
  const prefix = new RegExp(`^${year}-${month.padStart(2, '0')}`);
  try {
    const checklistItems = await ChecklistItem.find({ date: prefix, user_id: req.user_id });
    const tasksRaw = await TaskEntry.find({ date: prefix, user_id: req.user_id }).populate('label_id');
    
    const tasks = tasksRaw.map(t => {
      const json = t.toJSON();
      if (t.label_id) {
        json.label_name = t.label_id.name;
        json.label_color = t.label_id.color;
        json.label_id = t.label_id._id.toString();
      }
      return json;
    });

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
  const prefix = new RegExp(`^${year}-`);
  try {
    const checklistItems = await ChecklistItem.find({ date: prefix, user_id: req.user_id, is_completed: true });
    const tasks = await TaskEntry.find({ date: prefix, user_id: req.user_id });
    
    const dailyCounts = {};
    for (const item of checklistItems) {
      if (!dailyCounts[item.date]) dailyCounts[item.date] = 0;
      dailyCounts[item.date]++;
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
    const labels = await Label.find({ user_id: req.user_id });
    const labelsWithCounts = await Promise.all(labels.map(async (label) => {
      const taskCount = await TaskEntry.countDocuments({ label_id: label._id });
      return { ...label.toJSON(), taskCount };
    }));
    res.json(labelsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labels', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  if (!name || name.length > 30) return res.status(400).json({ error: 'Name must be between 1 and 30 characters' });
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return res.status(400).json({ error: 'Color must be a valid hex code' });
  try {
    const count = await Label.countDocuments({ user_id: req.user_id });
    if (count >= 20) return res.status(400).json({ error: 'Max labels (20) reached' });
    const label = await Label.create({ user_id: req.user_id, name, color });
    res.json(label.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/labels/:id', authenticateToken, async (req, res) => {
  const { name, color } = req.body;
  if (!name || name.length > 30) return res.status(400).json({ error: 'Name must be between 1 and 30 characters' });
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return res.status(400).json({ error: 'Color must be a valid hex code' });
  try {
    await Label.findOneAndUpdate({ _id: req.params.id, user_id: req.user_id }, { name, color });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/labels/:id', authenticateToken, async (req, res) => {
  try {
    await Label.findOneAndDelete({ _id: req.params.id, user_id: req.user_id });
    await TaskEntry.updateMany({ label_id: req.params.id, user_id: req.user_id }, { label_id: null });
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
    await Event.findOneAndUpdate(
      { user_id: req.user_id, date: date },
      { name: eventName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/events/upcoming', authenticateToken, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const events = await Event.find({ 
      user_id: req.user_id, 
      date: { $gte: todayStr } 
    }).sort({ date: 1 });
    
    res.json(events);
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

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { google } = require('googleapis');
const mongoose = require('./db');
const { User, MagicLink, Label, Event, Task, Habit, HabitLog } = require('./models');

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
  const { email, name } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  try {
    let user = await User.findOne({ email });
    if (!user) {
      if (!name || !name.trim()) {
        return res.json({ isNewUser: true, message: 'Welcome! Please enter your name to set up your account.' });
      }
      user = await User.create({ email, name: name.trim() });
    } else if (!user.name && name && name.trim()) {
      user.name = name.trim();
      await user.save();
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
    const minTask = await Task.findOne({ user_id: req.user_id }).sort({ date: 1 }).select('date');
    let startDate = minTask?.date || new Date().toISOString().split('T')[0];
    const user = await User.findById(req.user_id);
    res.json({ startDate, user: { email: user?.email || '', name: user?.name || '' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(req.user_id, { name: name?.trim() || '' }, { new: true });
    res.json({ email: user.email, name: user.name || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/day/:date', authenticateToken, async (req, res) => {
  const { date } = req.params;
  try {
    const tasksRaw = await Task.find({ date, user_id: req.user_id }).populate('label_id').sort({ is_completed: 1, _id: 1 });
    
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
    res.json({ tasks, event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/month/:year/:month', authenticateToken, async (req, res) => {
  const { year, month } = req.params;
  const prefix = new RegExp(`^${year}-${month.padStart(2, '0')}`);
  try {
    const tasksRaw = await Task.find({ user_id: req.user_id, date: prefix }).populate('label_id').sort({ is_completed: 1, _id: 1 });
    const events = await Event.find({ user_id: req.user_id, date: prefix });
    
    const days = {};
    for (const task of tasksRaw) {
      if (!days[task.date]) days[task.date] = { tasks: [], event: null };
      days[task.date].tasks.push({ 
        _id: task._id.toString(),
        text: task.text, 
        is_completed: task.is_completed,
        label_id: task.label_id ? task.label_id._id.toString() : null,
        label_color: task.label_id ? task.label_id.color : null, 
        label_name: task.label_id ? task.label_id.name : null 
      });
    }
    for (const evt of events) {
      if (!days[evt.date]) days[evt.date] = { tasks: [], event: null };
      days[evt.date].event = evt.name;
    }
    res.json(days);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { date, text, label_id } = req.body;
  if (!text || text.length > 300) return res.status(400).json({ error: 'Text must be between 1 and 300 characters' });
  try {
    const count = await Task.countDocuments({ date, user_id: req.user_id });
    if (count >= 100) return res.status(400).json({ error: 'Max tasks (100) reached for this day' });
    const task = await Task.create({ user_id: req.user_id, date, text, is_completed: false, label_id: label_id || null });
    
    // Return populated task so frontend has label data immediately if added
    const populated = await Task.findById(task._id).populate('label_id');
    const json = populated.toJSON();
    if (populated.label_id) {
      json.label_name = populated.label_id.name;
      json.label_color = populated.label_id.color;
      json.label_id = populated.label_id._id.toString();
    }
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { text, is_completed, label_id } = req.body;
  try {
    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (is_completed !== undefined) updateData.is_completed = !!is_completed;
    if (label_id !== undefined) updateData.label_id = label_id || null;
    
    await Task.findOneAndUpdate({ _id: req.params.id, user_id: req.user_id }, { $set: updateData });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user_id: req.user_id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/streak', authenticateToken, async (req, res) => {
  try {
    const dates = await Task.distinct('date', { user_id: req.user_id, is_completed: true });
    dates.sort().reverse();
    
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
    const tasksRaw = await Task.find({ date: prefix, user_id: req.user_id }).populate('label_id');
    
    const tasks = tasksRaw.map(t => {
      const json = t.toJSON();
      if (t.label_id) {
        json.label_name = t.label_id.name;
        json.label_color = t.label_id.color;
        json.label_id = t.label_id._id.toString();
      }
      return json;
    });

    let totalCompletedTasks = 0;
    let totalTasks = tasks.length;
    const dailyData = {};
    const labelData = {};
    
    for (const task of tasks) {
      if (task.is_completed) totalCompletedTasks++;
      if (!dailyData[task.date]) dailyData[task.date] = { date: task.date, tasksCount: 0, completedTasksCount: 0 };
      
      dailyData[task.date].tasksCount++;
      if (task.is_completed) dailyData[task.date].completedTasksCount++;
      
      if (task.is_completed) {
        const lblName = task.label_name || 'Unlabeled';
        const lblColor = task.label_color || '#94a3b8';
        if (!labelData[lblName]) labelData[lblName] = { name: lblName, color: lblColor, value: 0 };
        labelData[lblName].value++;
      }
    }
    
    const dailyArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    const labelArray = Object.values(labelData).sort((a, b) => b.value - a.value);
    
    res.json({ totalTasks, totalCompletedTasks, dailyData: dailyArray, labelData: labelArray, rawTasks: tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/yearly/:year', authenticateToken, async (req, res) => {
  const { year } = req.params;
  const { labels } = req.query;
  const prefix = new RegExp(`^${year}-`);
  try {
    const query = { date: prefix, user_id: req.user_id, is_completed: true };
    if (labels) {
      const labelIds = labels.split(',');
      const validIds = labelIds.filter(id => id !== 'unlabeled');
      const orConditions = [];
      if (validIds.length > 0) {
          orConditions.push({ label_id: { $in: validIds } });
      }
      if (labelIds.includes('unlabeled')) {
          orConditions.push({ label_id: null });
      }
      if (orConditions.length > 0) {
          query.$or = orConditions;
      }
    }

    const completedTasks = await Task.find(query);
    
    const dailyCounts = {};
    for (const task of completedTasks) {
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
      const taskCount = await Task.countDocuments({ label_id: label._id });
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
    if (!eventName) {
      await Event.findOneAndDelete({ user_id: req.user_id, date: date });
    } else {
      await Event.findOneAndUpdate(
        { user_id: req.user_id, date: date },
        { name: eventName },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }
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

// --- HABIT TRACKING ENDPOINTS ---

// Get all habits, last 365 days of logs, and computed streak statistics
app.get('/api/habits/data', authenticateToken, async (req, res) => {
  try {
    const habits = await Habit.find({ user_id: req.user_id, is_archived: false }).sort({ created_at: 1 });
    
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const startDateStr = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}-${String(oneYearAgo.getDate()).padStart(2, '0')}`;
    
    const logs = await HabitLog.find({
      user_id: req.user_id,
      date: { $gte: startDateStr }
    }).sort({ date: 1 });

    // Calculate streaks & stats for each habit
    const stats = {};
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    for (const habit of habits) {
      const habitLogs = logs.filter(l => l.habit_id.toString() === habit._id.toString());
      const logMap = {};
      habitLogs.forEach(l => { logMap[l.date] = l; });

      const isDayCompleted = (dateStr) => {
        const log = logMap[dateStr];
        if (!log) return false;
        if (habit.type === 'boolean') return log.value_bool === true;
        if (habit.type === 'numeric' && habit.target_type === 'daily_quota') {
          return (log.value_num !== null && habit.target_value !== null && log.value_num >= habit.target_value);
        }
        if (habit.type === 'numeric' && habit.target_type === 'milestone') {
          return log.value_num !== null && log.value_num > 0;
        }
        return false;
      };

      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date(today);
      let checkStr = todayStr;

      // If today is not completed yet, start checking from yesterday for active streak
      if (!isDayCompleted(todayStr)) {
        if (isDayCompleted(yesterdayStr)) {
          checkDate = new Date(yesterday);
          checkStr = yesterdayStr;
        } else {
          checkDate = null; // 0 streak
        }
      }

      if (checkDate) {
        while (true) {
          if (isDayCompleted(checkStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          } else {
            break;
          }
        }
      }

      // Calculate best streak over all available logs
      let bestStreak = 0;
      let tempStreak = 0;
      const sortedDates = Object.keys(logMap).sort();
      if (sortedDates.length > 0) {
        let prevDate = null;
        for (const dStr of sortedDates) {
          if (isDayCompleted(dStr)) {
            const currD = new Date(dStr);
            if (prevDate) {
              const diffDays = Math.round((currD - prevDate) / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                tempStreak++;
              } else {
                tempStreak = 1;
              }
            } else {
              tempStreak = 1;
            }
            if (tempStreak > bestStreak) bestStreak = tempStreak;
            prevDate = currD;
          } else {
            tempStreak = 0;
            prevDate = null;
          }
        }
      }
      if (currentStreak > bestStreak) bestStreak = currentStreak;

      stats[habit._id.toString()] = {
        currentStreak,
        bestStreak,
        totalLoggedDays: habitLogs.filter(l => isDayCompleted(l.date)).length
      };
    }

    res.json({ habits, logs, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new habit
app.post('/api/habits', authenticateToken, async (req, res) => {
  try {
    const { name, type, unit, target_value, target_type, icon, color, frequency } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });

    const newHabit = new Habit({
      user_id: req.user_id,
      name,
      type,
      unit: unit || '',
      target_value: target_value !== undefined ? target_value : null,
      target_type: target_type || null,
      icon: icon || 'Activity',
      color: color || '#3b82f6',
      frequency: frequency || 'daily'
    });

    await newHabit.save();
    res.status(201).json(newHabit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or archive habit
app.put('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, user_id: req.user_id });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const fields = ['name', 'type', 'unit', 'target_value', 'target_type', 'icon', 'color', 'frequency', 'is_archived'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) habit[f] = req.body[f];
    });

    await habit.save();
    res.json(habit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete habit and its logs
app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user_id: req.user_id });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    await HabitLog.deleteMany({ habit_id: req.params.id, user_id: req.user_id });
    res.json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log or update a daily value for a habit
app.post('/api/habits/log', authenticateToken, async (req, res) => {
  try {
    const { habit_id, date, value_bool, value_num, notes } = req.body;
    if (!habit_id || !date) return res.status(400).json({ error: 'habit_id and date required' });

    let log = await HabitLog.findOne({ habit_id, user_id: req.user_id, date });
    if (!log) {
      log = new HabitLog({
        habit_id,
        user_id: req.user_id,
        date,
        value_bool: value_bool !== undefined ? value_bool : null,
        value_num: value_num !== undefined ? value_num : null,
        notes: notes || ''
      });
    } else {
      if (value_bool !== undefined) log.value_bool = value_bool;
      if (value_num !== undefined) log.value_num = value_num;
      if (notes !== undefined) log.notes = notes;
      log.updated_at = new Date();
    }

    await log.save();
    res.json(log);
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

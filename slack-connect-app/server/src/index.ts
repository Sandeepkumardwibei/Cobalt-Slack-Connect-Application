const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 3001;

const TOKEN_DB = 'tokens.json';
const SCHEDULED_DB = 'scheduled.json';

// No TypeScript types used here (pure CommonJS-friendly)
function saveToFile(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function readFromFile(path) {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

// Redirect to Slack OAuth
app.get('/auth/slack', (req, res) => {
  const redirect = `https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=chat:write,channels:read&redirect_uri=${process.env.SLACK_REDIRECT_URI}`;
  res.redirect(redirect);
});

// Slack OAuth Callback
app.get('/auth/slack/callback', async (req, res) => {
  const code = req.query.code;
  const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
    params: {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI,
    },
  });

  const tokens = readFromFile(TOKEN_DB);
  tokens.push(response.data);
  saveToFile(TOKEN_DB, tokens);
  res.send('Slack connected!');
});

// Send message immediately
app.post('/api/sendMessage', async (req, res) => {
  const { channel, text } = req.body;
  const tokens = readFromFile(TOKEN_DB);
  const token = tokens[0].access_token;

  const response = await axios.post(
    'https://slack.com/api/chat.postMessage',
    { channel, text },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  res.json(response.data);
});

// Schedule message
app.post('/api/scheduleMessage', (req, res) => {
  const scheduled = readFromFile(SCHEDULED_DB);
  scheduled.push(req.body);
  saveToFile(SCHEDULED_DB, scheduled);
  res.json({ success: true });
});

// Get all scheduled messages
app.get('/api/scheduledMessages', (req, res) => {
  const data = readFromFile(SCHEDULED_DB);
  res.json(data);
});

// Cancel scheduled message
app.delete('/api/scheduledMessages/:id', (req, res) => {
  let data = readFromFile(SCHEDULED_DB);
  data = data.filter((m) => m.id !== req.params.id);
  saveToFile(SCHEDULED_DB, data);
  res.json({ success: true });
});

// Auto-send scheduled messages every minute
setInterval(() => {
  const now = new Date();
  let scheduled = readFromFile(SCHEDULED_DB);
  const toSend = scheduled.filter((m) => new Date(m.time) <= now);
  const tokens = readFromFile(TOKEN_DB);
  const token = tokens[0]?.access_token;

  toSend.forEach(async (msg) => {
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: msg.channel, text: msg.text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  });

  scheduled = scheduled.filter((m) => new Date(m.time) > now);
  saveToFile(SCHEDULED_DB, scheduled);
}, 60000);

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

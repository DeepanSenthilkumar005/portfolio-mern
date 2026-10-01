require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const ConnectDB = require('./config/DbConnect');
const Feedback = require('./models/feedback');

const app = express();

// Only the portfolio itself may post here. Set ALLOWED_ORIGINS in the env as a
// comma-separated list; localhost stays in for development.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'https://deepanreactportfolio.netlify.app,http://localhost:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (curl, health checks) which send no Origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed'));
    },
  })
);

app.use(express.json({ limit: '10kb' }));
app.set('trust proxy', 1); // Render sits behind a proxy

ConnectDB();

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages from this address. Try again later.' },
});

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/feedback', feedbackLimiter, async (req, res) => {
  try {
    const { name, email, phone, msg, website } = req.body || {};

    // Honeypot: real users never fill a hidden field.
    if (website) return res.status(201).json({ message: 'Feedback submitted successfully!' });

    if (!name || !email || !msg) {
      return res.status(400).json({ error: 'Name, email and message are required.' });
    }

    if (!isEmail(email)) {
      return res.status(400).json({ error: 'That email address does not look right.' });
    }

    if (name.length > 100 || msg.length > 2000) {
      return res.status(400).json({ error: 'That message is too long.' });
    }

    await new Feedback({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      msg: msg.trim(),
    }).save();

    res.status(201).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    console.error('POST /feedback failed:', error);

    // Surface validation problems instead of flattening them into a 500.
    if (error.name === 'ValidationError') {
      const detail = Object.values(error.errors)[0];
      return res.status(400).json({ error: detail ? detail.message : 'Invalid submission.' });
    }

    res.status(500).json({ error: 'Something went wrong on our end.' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});

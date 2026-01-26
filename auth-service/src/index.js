const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined.');
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Helper to generate token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
};

// POST /register
app.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, created_at',
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];
    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    // Set cookie
    // Note: When behind Nginx, we should trust proxy for secure: true
    // but in local development without HTTPS, secure: true might block cookies if not on localhost.
    // Assuming production-like env with Nginx terminating SSL or handling headers.
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // As requested in requirements
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /logout
app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out' });
});

// GET /me
app.get('/me', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      'SELECT id, email, first_name, last_name, phone, country, city, avatar, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform database fields to camelCase for frontend
    const formattedUser = {
      ...user,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    delete formattedUser.first_name;
    delete formattedUser.last_name;

    res.json({ user: formattedUser });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// PUT /profile
app.put('/profile', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { firstName, lastName, phone, country, city, avatar } = req.body;

    const result = await db.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, country = $4, city = $5, avatar = $6
       WHERE id = $7
       RETURNING id, email, first_name, last_name, phone, country, city, avatar, created_at`,
      [firstName, lastName, phone, country, city, avatar, decoded.userId]
    );

    const user = result.rows[0];
    
    // Transform database fields to camelCase for frontend
    const formattedUser = {
      ...user,
      firstName: user.first_name,
      lastName: user.last_name,
    };
    delete formattedUser.first_name;
    delete formattedUser.last_name;

    res.json({ user: formattedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

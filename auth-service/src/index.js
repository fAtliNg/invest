const express = require('express');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined.');
  process.exit(1);
}

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadsDir));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Helper to generate token
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
};

// POST /auth/google
app.post('/auth/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Токен обязателен' });
  }

  try {
    let email, firstName, lastName;

    try {
        // Try verifying as ID Token first (fast, offline if keys cached)
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        firstName = payload.given_name;
        lastName = payload.family_name;
    } catch (idTokenError) {
        // If ID Token verification fails, try using it as Access Token to fetch UserInfo
        try {
            const userInfoResponse = await client.request({
                url: 'https://www.googleapis.com/oauth2/v3/userinfo',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            email = userInfoResponse.data.email;
            firstName = userInfoResponse.data.given_name;
            lastName = userInfoResponse.data.family_name;
        } catch (accessTokenError) {
             console.error('Failed as ID Token:', idTokenError.message);
             console.error('Failed as Access Token:', accessTokenError.message);
             return res.status(401).json({ error: 'Неверный токен Google' });
        }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email не найден в токене Google' });
    }

    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userCheck.rows[0];

    if (user) {
      // Update existing user's name
      const updateResult = await db.query(
        'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING *',
        [firstName, lastName, user.id]
      );
      user = updateResult.rows[0];
    } else {
      // Create new user
      // Generate random password hash as placeholder since password is NOT NULL
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      const insertResult = await db.query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, passwordHash, firstName, lastName]
      );
      user = insertResult.rows[0];
    }

    const appToken = generateToken(user.id, user.email);

    res.cookie('token', appToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({ message: 'Вход через Google выполнен успешно' });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Неверный токен Google' });
  }
});

// POST /register
app.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
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
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email и пароль обязательны' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
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

    res.json({ message: 'Вход выполнен успешно' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
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
    const { firstName, lastName, phone, country, city } = req.body;

    const result = await db.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, phone = $3, country = $4, city = $5
       WHERE id = $6
       RETURNING id, email, first_name, last_name, phone, country, city, avatar, created_at`,
      [firstName, lastName, phone, country, city, decoded.userId]
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

// POST /avatar
app.post('/avatar', upload.single('avatar'), async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const avatarUrl = `/api/auth/uploads/${req.file.filename}`; // Assuming Nginx routes /api/auth to this service

    // Update DB
    const result = await db.query(
      'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id, email, first_name, last_name, phone, country, city, avatar, created_at',
      [avatarUrl, decoded.userId]
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

// DELETE /avatar
app.delete('/avatar', async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get current avatar
    const current = await db.query('SELECT avatar FROM users WHERE id = $1', [decoded.userId]);
    if (current.rows.length > 0 && current.rows[0].avatar) {
      const avatarPath = current.rows[0].avatar;
      // Extract filename from URL (e.g. /api/auth/uploads/filename.jpg -> filename.jpg)
      const filename = path.basename(avatarPath);
      const filePath = path.join(uploadsDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const result = await db.query(
      'UPDATE users SET avatar = NULL WHERE id = $1 RETURNING id, email, first_name, last_name, phone, country, city, avatar, created_at',
      [decoded.userId]
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

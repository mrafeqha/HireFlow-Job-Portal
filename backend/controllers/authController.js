const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforhireflowportal123!';

exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Check for duplicate email
  const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Create User
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    const userId = userResult.insertId;

    // For candidate, insert empty candidate profile to ensure it exists
    if (role === 'candidate') {
      await connection.execute(
        'INSERT INTO candidate_profiles (user_id) VALUES (?)',
        [userId]
      );
    }

    await connection.commit();

    // Create Token
    const token = jwt.sign(
      { id: userId, name, email, role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { id: userId, name, email, role }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve user
  const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const user = users[0];

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Generate Token
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
};

exports.getMe = async (req, res, next) => {
  const [users] = await db.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (users.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = users[0];
  if (user.role === 'candidate') {
    const [profiles] = await db.execute('SELECT * FROM candidate_profiles WHERE user_id = ?', [user.id]);
    user.profile = profiles[0] || null;
  }

  res.json({
    success: true,
    data: user
  });
};

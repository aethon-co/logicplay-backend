const db = require('../config/db');

exports.signup = async (req, res) => {
  const { email, password, schoolName, grade, name } = req.body;

  if (!email || !password || !schoolName || !grade || !name) {
    return res.status(400).json({ error: 'All fields (email, password, schoolName, grade, name) are required' });
  }

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = await db.query(
      'INSERT INTO users (email, password, school_name, grade, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, school_name, grade',
      [email, password, schoolName, grade, name]
    );

    res.status(201).json({ message: 'User created successfully', user: newUser.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    delete user.password;

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

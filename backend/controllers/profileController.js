const db = require('../config/db');

exports.getProfile = async (req, res, next) => {
  const [profiles] = await db.execute('SELECT * FROM candidate_profiles WHERE user_id = ?', [req.user.id]);
  if (profiles.length === 0) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }
  res.json({ success: true, data: profiles[0] });
};

exports.updateProfile = async (req, res, next) => {
  const { title, skills, experience_years, resume_url, bio } = req.body;
  const userId = req.user.id;

  const [existing] = await db.execute('SELECT id FROM candidate_profiles WHERE user_id = ?', [userId]);

  if (existing.length === 0) {
    await db.execute(
      'INSERT INTO candidate_profiles (user_id, title, skills, experience_years, resume_url, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, skills, experience_years, resume_url, bio]
    );
  } else {
    await db.execute(
      'UPDATE candidate_profiles SET title = ?, skills = ?, experience_years = ?, resume_url = ?, bio = ? WHERE user_id = ?',
      [title, skills, experience_years, resume_url, bio, userId]
    );
  }

  res.json({ success: true, message: 'Profile updated successfully' });
};

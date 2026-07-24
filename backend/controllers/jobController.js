const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforhireflowportal123!';

// 1. Get all jobs with optional filters and search
exports.getAllJobs = async (req, res, next) => {
  let query = `
    SELECT j.*, u.name as recruiter_name 
    FROM jobs j 
    JOIN users u ON j.recruiter_id = u.id 
    WHERE j.status = 'open'
  `;
  const params = [];

  const { search, location, job_type, category, experience_level } = req.query;

  if (search) {
    query += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.requirements LIKE ? OR j.category LIKE ?)';
    const searchVal = `%${search}%`;
    params.push(searchVal, searchVal, searchVal, searchVal);
  }
  if (location && location !== 'All Locations' && location.trim() !== '') {
    query += ' AND j.location = ?';
    params.push(location);
  }
  if (job_type && job_type !== 'All Types' && job_type.trim() !== '') {
    query += ' AND j.job_type = ?';
    params.push(job_type);
  }
  if (category && category !== 'All Categories' && category.trim() !== '') {
    query += ' AND j.category = ?';
    params.push(category);
  }
  if (experience_level && experience_level !== 'All Levels' && experience_level.trim() !== '') {
    query += ' AND j.experience_level = ?';
    params.push(experience_level);
  }

  query += ' ORDER BY j.created_at DESC';

  const [jobs] = await db.execute(query, params);
  res.json({ success: true, data: jobs });
};

// 2. Get detailed job by ID
exports.getJobById = async (req, res, next) => {
  const jobId = req.params.id;

  const [jobs] = await db.execute(
    `SELECT j.*, u.name as recruiter_name, u.email as recruiter_email 
     FROM jobs j 
     JOIN users u ON j.recruiter_id = u.id 
     WHERE j.id = ?`,
    [jobId]
  );

  if (jobs.length === 0) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  const job = jobs[0];

  // Optional: Check if logged-in user applied or bookmarked this job
  let hasApplied = false;
  let hasSaved = false;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check application
      const [apps] = await db.execute(
        'SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?',
        [jobId, decoded.id]
      );
      if (apps.length > 0) hasApplied = true;

      // Check saved
      const [saved] = await db.execute(
        'SELECT id FROM saved_jobs WHERE job_id = ? AND candidate_id = ?',
        [jobId, decoded.id]
      );
      if (saved.length > 0) hasSaved = true;
    } catch (e) {
      // Ignore token issues for details view
    }
  }

  res.json({
    success: true,
    data: {
      ...job,
      hasApplied,
      hasSaved
    }
  });
};

// 3. Get jobs posted by a specific recruiter
exports.getMyPostedJobs = async (req, res, next) => {
  const recruiterId = req.user.id;
  const [jobs] = await db.execute(
    'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC',
    [recruiterId]
  );
  res.json({ success: true, data: jobs });
};

// 4. Create a job listing
exports.createJob = async (req, res, next) => {
  const { title, description, requirements, location, job_type, category, experience_level, salary } = req.body;
  const recruiterId = req.user.id;

  const [result] = await db.execute(
    `INSERT INTO jobs (recruiter_id, title, description, requirements, location, job_type, category, experience_level, salary) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [recruiterId, title, description, requirements, location, job_type, category, experience_level, salary || null]
  );

  res.status(201).json({
    success: true,
    message: 'Job posting created successfully',
    jobId: result.insertId
  });
};

// 5. Update a job posting
exports.updateJob = async (req, res, next) => {
  const jobId = req.params.id;
  const recruiterId = req.user.id;
  const { title, description, requirements, location, job_type, category, experience_level, salary, status } = req.body;

  // Verify ownership or admin role
  const [jobs] = await db.execute('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);
  if (jobs.length === 0) {
    return res.status(404).json({ success: false, message: 'Job listing not found' });
  }

  if (jobs[0].recruiter_id !== recruiterId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to edit this job' });
  }

  await db.execute(
    `UPDATE jobs 
     SET title = ?, description = ?, requirements = ?, location = ?, job_type = ?, category = ?, experience_level = ?, salary = ?, status = ?
     WHERE id = ?`,
    [title, description, requirements, location, job_type, category, experience_level, salary || null, status || 'open', jobId]
  );

  res.json({ success: true, message: 'Job posting updated successfully' });
};

// 6. Delete a job posting
exports.deleteJob = async (req, res, next) => {
  const jobId = req.params.id;
  const recruiterId = req.user.id;

  // Verify ownership or admin role
  const [jobs] = await db.execute('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);
  if (jobs.length === 0) {
    return res.status(404).json({ success: false, message: 'Job listing not found' });
  }

  if (jobs[0].recruiter_id !== recruiterId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to delete this job' });
  }

  await db.execute('DELETE FROM jobs WHERE id = ?', [jobId]);
  res.json({ success: true, message: 'Job posting deleted successfully' });
};

// 7. Save/Bookmark a job
exports.saveJob = async (req, res, next) => {
  const jobId = req.params.id;
  const candidateId = req.user.id;

  try {
    await db.execute(
      'INSERT INTO saved_jobs (candidate_id, job_id) VALUES (?, ?)',
      [candidateId, jobId]
    );
    res.json({ success: true, message: 'Job bookmarked successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Job is already bookmarked' });
    }
    next(err);
  }
};

// 8. Unsave/Unbookmark a job
exports.unsaveJob = async (req, res, next) => {
  const jobId = req.params.id;
  const candidateId = req.user.id;

  const [result] = await db.execute(
    'DELETE FROM saved_jobs WHERE candidate_id = ? AND job_id = ?',
    [candidateId, jobId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Job bookmark not found' });
  }

  res.json({ success: true, message: 'Job bookmark removed' });
};

// 9. Get all bookmarked jobs
exports.getSavedJobs = async (req, res, next) => {
  const candidateId = req.user.id;

  const [jobs] = await db.execute(
    `SELECT j.*, u.name as recruiter_name 
     FROM saved_jobs sj 
     JOIN jobs j ON sj.job_id = j.id 
     JOIN users u ON j.recruiter_id = u.id 
     WHERE sj.candidate_id = ?
     ORDER BY sj.saved_at DESC`,
    [candidateId]
  );

  res.json({ success: true, data: jobs });
};

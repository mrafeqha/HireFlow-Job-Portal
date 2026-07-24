const db = require('../config/db');

// 1. Submit a job application (Candidate only)
exports.applyJob = async (req, res, next) => {
  const { job_id, resume_url, cover_letter } = req.body;
  const candidateId = req.user.id;

  // Check if job exists and is open
  const [jobs] = await db.execute('SELECT status FROM jobs WHERE id = ?', [job_id]);
  if (jobs.length === 0) {
    return res.status(404).json({ success: false, message: 'Job posting not found' });
  }

  if (jobs[0].status !== 'open') {
    return res.status(400).json({ success: false, message: 'This job posting has been closed' });
  }

  try {
    await db.execute(
      'INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter) VALUES (?, ?, ?, ?)',
      [job_id, candidateId, resume_url, cover_letter || null]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'You have already applied for this job listing' });
    }
    next(err);
  }
};

// 2. Withdraw a job application (Candidate only)
exports.withdrawApplication = async (req, res, next) => {
  const appId = req.params.id;
  const candidateId = req.user.id;

  const [apps] = await db.execute('SELECT candidate_id FROM applications WHERE id = ?', [appId]);
  if (apps.length === 0) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  if (apps[0].candidate_id !== candidateId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You can only withdraw your own applications' });
  }

  await db.execute('DELETE FROM applications WHERE id = ?', [appId]);
  res.json({ success: true, message: 'Application withdrawn successfully' });
};

// 3. View my job applications (Candidate only)
exports.getMyApplications = async (req, res, next) => {
  const candidateId = req.user.id;

  const [apps] = await db.execute(
    `SELECT a.id as application_id, a.resume_url, a.cover_letter, a.status, a.applied_at,
            j.id as job_id, j.title, j.location, j.job_type, j.salary, u.name as recruiter_name
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN users u ON j.recruiter_id = u.id
     WHERE a.candidate_id = ?
     ORDER BY a.applied_at DESC`,
    [candidateId]
  );

  res.json({ success: true, data: apps });
};

// 4. View applicants for a specific job posting (Recruiter/Admin only)
exports.getJobApplicants = async (req, res, next) => {
  const jobId = req.params.jobId;
  const recruiterId = req.user.id;

  // Verify job exists and recruiter owns it
  const [jobs] = await db.execute('SELECT recruiter_id FROM jobs WHERE id = ?', [jobId]);
  if (jobs.length === 0) {
    return res.status(404).json({ success: false, message: 'Job posting not found' });
  }

  if (jobs[0].recruiter_id !== recruiterId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You are not authorized to view applicants for this job' });
  }

  const [applicants] = await db.execute(
    `SELECT a.id as application_id, a.resume_url, a.cover_letter, a.status, a.applied_at,
            u.name as candidate_name, u.email as candidate_email,
            cp.title as candidate_title, cp.skills, cp.experience_years, cp.bio
     FROM applications a
     JOIN users u ON a.candidate_id = u.id
     LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
     WHERE a.job_id = ?
     ORDER BY a.applied_at DESC`,
    [jobId]
  );

  res.json({ success: true, data: applicants });
};

// 5. Update application status (Recruiter/Admin only)
exports.updateApplicationStatus = async (req, res, next) => {
  const appId = req.params.id;
  const recruiterId = req.user.id;
  const { status } = req.body;

  // Retrieve application to verify recruiter ownership
  const [apps] = await db.execute(
    `SELECT a.id, j.recruiter_id, j.title 
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.id = ?`,
    [appId]
  );

  if (apps.length === 0) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  if (apps[0].recruiter_id !== recruiterId && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify this application status' });
  }

  await db.execute(
    'UPDATE applications SET status = ? WHERE id = ?',
    [status, appId]
  );

  res.json({
    success: true,
    message: `Candidate application status successfully updated to: ${status}`
  });
};

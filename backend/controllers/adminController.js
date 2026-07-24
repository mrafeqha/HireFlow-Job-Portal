const db = require('../config/db');

// 1. Recruiter statistics for dashboard
exports.getRecruiterStats = async (req, res, next) => {
  const recruiterId = req.user.id;

  // Active jobs vs Closed jobs
  const [jobsStats] = await db.execute(
    `SELECT 
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as activeJobs,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closedJobs,
      COUNT(*) as totalJobs
     FROM jobs WHERE recruiter_id = ?`,
    [recruiterId]
  );

  // Total applications received
  const [appsCount] = await db.execute(
    `SELECT COUNT(*) as count 
     FROM applications a 
     JOIN jobs j ON a.job_id = j.id 
     WHERE j.recruiter_id = ?`,
    [recruiterId]
  );

  // Status breakdown
  const [statusBreakdown] = await db.execute(
    `SELECT a.status, COUNT(*) as count 
     FROM applications a 
     JOIN jobs j ON a.job_id = j.id 
     WHERE j.recruiter_id = ?
     GROUP BY a.status`,
    [recruiterId]
  );

  // Recent applications (last 5)
  const [recentApps] = await db.execute(
    `SELECT a.id as application_id, a.status, a.applied_at, j.title as job_title, u.name as candidate_name
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN users u ON a.candidate_id = u.id
     WHERE j.recruiter_id = ?
     ORDER BY a.applied_at DESC
     LIMIT 5`,
    [recruiterId]
  );

  res.json({
    success: true,
    data: {
      jobs: jobsStats[0] || { activeJobs: 0, closedJobs: 0, totalJobs: 0 },
      applicationsCount: appsCount[0] ? appsCount[0].count : 0,
      statusBreakdown,
      recentApps
    }
  });
};

// 2. Admin statistics for system dashboard
exports.getAdminStats = async (req, res, next) => {
  // Total counts
  const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
  const [jobCount] = await db.execute('SELECT COUNT(*) as count FROM jobs');
  const [appCount] = await db.execute('SELECT COUNT(*) as count FROM applications');

  // Breakdown of users by role
  const [roleBreakdown] = await db.execute(
    'SELECT role, COUNT(*) as count FROM users GROUP BY role'
  );

  // Recent jobs posted across the system
  const [recentJobs] = await db.execute(
    `SELECT j.id, j.title, j.location, j.status, j.created_at, u.name as recruiter_name 
     FROM jobs j 
     JOIN users u ON j.recruiter_id = u.id 
     ORDER BY j.created_at DESC 
     LIMIT 5`
  );

  res.json({
    success: true,
    data: {
      counts: {
        users: userCount[0].count,
        jobs: jobCount[0].count,
        applications: appCount[0].count
      },
      roles: roleBreakdown,
      recentJobs
    }
  });
};

// 3. Get all users in the system (Admin only)
exports.getAllUsers = async (req, res, next) => {
  const [users] = await db.execute(
    'SELECT id, name, email, role, created_at FROM users WHERE role != "admin" ORDER BY id DESC'
  );
  res.json({ success: true, data: users });
};

// 4. Delete user account (Admin only)
exports.deleteUser = async (req, res, next) => {
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId, 10) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
  }

  const [result] = await db.execute('DELETE FROM users WHERE id = ?', [userId]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'User account and all associated data deleted successfully' });
};

// 5. Get all jobs in system for moderation (Admin only)
exports.getAdminJobs = async (req, res, next) => {
  const [jobs] = await db.execute(
    `SELECT j.id, j.title, j.location, j.job_type, j.status, j.created_at, u.name as recruiter_name 
     FROM jobs j 
     JOIN users u ON j.recruiter_id = u.id 
     ORDER BY j.created_at DESC`
  );
  res.json({ success: true, data: jobs });
};

const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }
  if (!role || !['candidate', 'recruiter'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be candidate or recruiter' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  next();
};

const validateJob = (req, res, next) => {
  const { title, description, requirements, location, job_type, category, experience_level } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Job title is required' });
  if (!description || !description.trim()) return res.status(400).json({ success: false, message: 'Job description is required' });
  if (!requirements || !requirements.trim()) return res.status(400).json({ success: false, message: 'Job requirements are required' });
  if (!location || !location.trim()) return res.status(400).json({ success: false, message: 'Job location is required' });
  if (!category || !category.trim()) return res.status(400).json({ success: false, message: 'Job category is required' });
  
  const validTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
  if (!job_type || !validTypes.includes(job_type)) {
    return res.status(400).json({ success: false, message: `Job type must be one of: ${validTypes.join(', ')}` });
  }
  
  const validExp = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead/Executive'];
  if (!experience_level || !validExp.includes(experience_level)) {
    return res.status(400).json({ success: false, message: `Experience level must be one of: ${validExp.join(', ')}` });
  }
  next();
};

const validateApplication = (req, res, next) => {
  const { job_id, resume_url } = req.body;
  if (!job_id) {
    return res.status(400).json({ success: false, message: 'Job ID is required' });
  }
  if (!resume_url || !resume_url.trim()) {
    return res.status(400).json({ success: false, message: 'Resume URL or download link is required' });
  }
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatus = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];
  if (!status || !validStatus.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatus.join(', ')}` });
  }
  next();
};

const validateProfile = (req, res, next) => {
  const { title, skills, experience_years } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'Professional title is required' });
  if (!skills || !skills.trim()) return res.status(400).json({ success: false, message: 'Skills list is required' });
  if (experience_years === undefined || isNaN(experience_years) || Number(experience_years) < 0) {
    return res.status(400).json({ success: false, message: 'Experience years must be a valid non-negative number' });
  }
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateJob,
  validateApplication,
  validateStatusUpdate,
  validateProfile
};

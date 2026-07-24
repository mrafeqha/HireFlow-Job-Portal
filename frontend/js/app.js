// HireFlow Job Portal - Client Application Code

const API_BASE = '/api';

// Current State
let currentUser = null;
let currentView = 'jobs-view';
let selectedJobId = null;
let jobsData = []; // cached jobs

// Setup App on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  // Set Current Date in Dashboard
  const dateSpan = document.getElementById('current-date');
  if (dateSpan) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateSpan.textContent = new Date().toLocaleDateString('en-US', options);
  }

  // Check Login Status
  checkAuthState();
});

// Toast System
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-xmark';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Automatically remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'scale(0.9)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Auth state management
async function checkAuthState() {
  const token = localStorage.getItem('token');
  
  // Public jobs should always load for landing page on startup
  loadJobs();

  if (!token) {
    showLandingNavbar(false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    if (data.success) {
      currentUser = data.data;
      showLandingNavbar(true);
      // Sync Sidebar User Tags
      document.getElementById('user-display-name').textContent = currentUser.name;
      document.getElementById('user-display-role').textContent = currentUser.role;
      
      // Calculate global landing page statistics dynamically based on active listings
      setTimeout(() => {
        document.getElementById('landing-stat-jobs').textContent = `${jobsData.length}+`;
      }, 1000);
    } else {
      logoutUserSilent();
    }
  } catch (err) {
    console.error('Auth verification error:', err);
    logoutUserSilent();
  }
}

function showLandingNavbar(loggedIn) {
  const signInBtn = document.getElementById('nav-signin-btn');
  const dashBtn = document.getElementById('nav-dashboard-btn');
  
  if (loggedIn) {
    signInBtn.classList.add('hidden');
    dashBtn.classList.remove('hidden');
  } else {
    signInBtn.classList.remove('hidden');
    dashBtn.classList.add('hidden');
  }
}

function enterDashboard() {
  document.getElementById('landing-section').classList.add('hidden');
  document.getElementById('main-section').classList.remove('hidden');

  // Toggle Sidebar Navigation groups depending on role
  document.querySelector('.candidate-nav-group').classList.add('hidden');
  document.querySelector('.recruiter-nav-group').classList.add('hidden');
  document.querySelector('.admin-nav-group').classList.add('hidden');

  if (currentUser.role === 'candidate') {
    document.querySelector('.candidate-nav-group').classList.remove('hidden');
    navigateTo('jobs-view');
  } else if (currentUser.role === 'recruiter') {
    document.querySelector('.recruiter-nav-group').classList.remove('hidden');
    navigateTo('recruiter-dash');
  } else if (currentUser.role === 'admin') {
    document.querySelector('.admin-nav-group').classList.remove('hidden');
    navigateTo('admin-dash');
  }
}

function showLandingHome() {
  document.getElementById('landing-section').classList.remove('hidden');
  document.getElementById('main-section').classList.add('hidden');
  closeAuthModal();
  loadJobs();
}

function logoutUserSilent() {
  currentUser = null;
  localStorage.removeItem('token');
  showLandingNavbar(false);
  showLandingHome();
}

// Modal open triggers
function openAuthModal(tab) {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

// Auth View Controls
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginBtn = document.getElementById('tab-login-btn');
  const registerBtn = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginBtn.classList.remove('active');
    registerBtn.classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      showToast('Logged in successfully', 'success');
      showLandingNavbar(true);
      closeAuthModal();
      
      // Update sidebar badge
      document.getElementById('user-display-name').textContent = currentUser.name;
      document.getElementById('user-display-role').textContent = currentUser.role;

      // Enter Workspace
      enterDashboard();
      document.getElementById('login-form').reset();
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      currentUser = data.user;
      showToast('Profile created successfully!', 'success');
      showLandingNavbar(true);
      closeAuthModal();

      // Update sidebar badge
      document.getElementById('user-display-name').textContent = currentUser.name;
      document.getElementById('user-display-role').textContent = currentUser.role;

      enterDashboard();
      document.getElementById('register-form').reset();
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to backend server', 'error');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  currentUser = null;
  showToast('Logged out successfully', 'info');
  showLandingNavbar(false);
  showLandingHome();
}

// SPA Routing Router
function navigateTo(viewId) {
  currentView = viewId;
  
  // Hide all views
  const views = document.querySelectorAll('.view-container');
  views.forEach(v => v.classList.add('hidden'));

  // Show selected view
  const targetView = document.getElementById(viewId);
  if (targetView) targetView.classList.remove('hidden');

  // Map Sidebar Nav Menu highlighting
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(viewId)) {
      item.classList.add('active');
    }
  });

  // Set Header Title
  const titleMap = {
    'jobs-view': 'Browse Jobs Catalog',
    'job-details-view': 'Opportunity Specifications',
    'my-applications-view': 'My Submissions Tracker',
    'saved-jobs-view': 'Saved Bookmarks',
    'profile-view': 'Professional Experience Profile',
    'recruiter-dash': 'Recruitment Dashboard',
    'recruiter-jobs': 'Postings Manager',
    'post-job-view': 'Create / Edit Job Posting',
    'job-applicants-view': 'Job Applicants Manager',
    'admin-dash': 'Admin Dashboard',
    'admin-users': 'User Account Manager',
    'admin-jobs': 'Listing Moderation'
  };

  document.getElementById('view-title').textContent = titleMap[viewId] || 'Dashboard';

  // Load view data
  loadViewData(viewId);
}

// Delegate loading view statistics/data
function loadViewData(viewId) {
  switch (viewId) {
    case 'jobs-view':
      loadJobs();
      break;
    case 'my-applications-view':
      loadMyApplications();
      break;
    case 'saved-jobs-view':
      loadSavedJobs();
      break;
    case 'profile-view':
      loadCandidateProfile();
      break;
    case 'recruiter-dash':
      loadRecruiterDashboard();
      break;
    case 'recruiter-jobs':
      loadRecruiterJobsTable();
      break;
    case 'post-job-view':
      if (!document.getElementById('job-form-id').value) {
        resetJobForm();
      }
      break;
    case 'admin-dash':
      loadAdminDashboard();
      break;
    case 'admin-users':
      loadAdminUsersTable();
      break;
    case 'admin-jobs':
      loadAdminJobsTable();
      break;
  }
}

// ----------------------------------------------------
// 1. PUBLIC LANDING & GENERAL CATALOG MODULES
// ----------------------------------------------------

async function loadJobs() {
  const jobsList = document.getElementById('jobs-list');
  const landingJobsList = document.getElementById('landing-jobs-list');

  if (jobsList) jobsList.innerHTML = '<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching listings...</div>';
  if (landingJobsList) landingJobsList.innerHTML = '<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching listings...</div>';

  try {
    const res = await fetch(`${API_BASE}/jobs`);
    const data = await res.json();

    if (data.success) {
      jobsData = data.data;
      populateFilterOptions(jobsData);
      
      // Render on both views
      renderJobsList(jobsData, 'jobs-list');
      renderJobsList(jobsData, 'landing-jobs-list');
    } else {
      const errorMsg = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error</h3><p>${data.message}</p></div>`;
      if (jobsList) jobsList.innerHTML = errorMsg;
      if (landingJobsList) landingJobsList.innerHTML = errorMsg;
    }
  } catch (err) {
    const errorMsg = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error</h3><p>Could not connect to backend.</p></div>`;
    if (jobsList) jobsList.innerHTML = errorMsg;
    if (landingJobsList) landingJobsList.innerHTML = errorMsg;
  }
}

function renderJobsList(jobs, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (jobs.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-briefcase"></i>
        <h3>No opportunities found</h3>
        <p>Try changing search keywords or location filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  jobs.forEach(job => {
    const salary = job.salary ? job.salary : 'Salary Undisclosed';
    const date = new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const card = document.createElement('div');
    card.className = 'job-card';
    card.innerHTML = `
      <div class="job-card-header">
        <div>
          <h3 class="job-card-title">${job.title}</h3>
          <div class="job-card-company"><i class="fa-solid fa-circle-nodes"></i> ${job.recruiter_name}</div>
        </div>
      </div>
      <div class="job-card-metadata">
        <span class="badge badge-info">${job.job_type}</span>
        <span class="badge badge-indigo">${job.experience_level}</span>
        <span class="badge badge-muted">${job.location}</span>
      </div>
      <p class="job-card-description">${job.description}</p>
      <div class="job-card-footer">
        <div>
          <span class="job-card-salary">${salary}</span>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:2px;">Posted ${date}</div>
        </div>
        <button class="btn btn-primary btn-small" onclick="viewJobDetails(${job.id})">
          Details <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// Dynamic Filter values loader
function populateFilterOptions(jobs) {
  const locSelect = document.getElementById('filter-location');
  const catSelect = document.getElementById('filter-category');
  if (!locSelect || !catSelect) return;

  const currentLocVal = locSelect.value;
  const currentCatVal = catSelect.value;

  const locations = new Set();
  const categories = new Set();

  jobs.forEach(job => {
    if (job.location) locations.add(job.location);
    if (job.category) categories.add(job.category);
  });

  locSelect.innerHTML = '<option value="All Locations">All Locations</option>';
  locations.forEach(loc => {
    locSelect.innerHTML += `<option value="${loc}">${loc}</option>`;
  });

  catSelect.innerHTML = '<option value="All Categories">All Categories</option>';
  categories.forEach(cat => {
    catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
  });

  locSelect.value = currentLocVal || 'All Locations';
  catSelect.value = currentCatVal || 'All Categories';
}

// Landing search handlers
async function triggerLandingSearch() {
  const val = document.getElementById('landing-search-input').value;
  const params = new URLSearchParams();
  if (val) params.append('search', val);

  try {
    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      renderJobsList(data.data, 'landing-jobs-list');
    }
  } catch (err) {
    console.error(err);
  }
}

function setLandingCategoryFilter(category) {
  const searchInput = document.getElementById('landing-search-input');
  if (searchInput) searchInput.value = category;
  
  // Trigger filter
  triggerLandingSearch();

  // Scroll to listings
  const featured = document.getElementById('featured-heading');
  if (featured) {
    featured.scrollIntoView({ behavior: 'smooth' });
  }
}

function scrollToFeaturedJobs() {
  const featured = document.getElementById('featured-heading');
  if (featured) {
    featured.scrollIntoView({ behavior: 'smooth' });
  }
}

// Dashboard search triggers
async function triggerSearch() {
  const searchInput = document.getElementById('job-search-input').value;
  const location = document.getElementById('filter-location').value;
  const jobType = document.getElementById('filter-type').value;
  const category = document.getElementById('filter-category').value;
  const experience = document.getElementById('filter-experience').value;

  const params = new URLSearchParams();
  if (searchInput) params.append('search', searchInput);
  if (location && location !== 'All Locations') params.append('location', location);
  if (jobType && jobType !== 'All Types') params.append('job_type', jobType);
  if (category && category !== 'All Categories') params.append('category', category);
  if (experience && experience !== 'All Levels') params.append('experience_level', experience);

  try {
    const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      renderJobsList(data.data, 'jobs-list');
    }
  } catch (err) {
    console.error(err);
  }
}

function resetFilters() {
  document.getElementById('job-search-input').value = '';
  document.getElementById('filter-location').value = 'All Locations';
  document.getElementById('filter-type').value = 'All Types';
  document.getElementById('filter-category').value = 'All Categories';
  document.getElementById('filter-experience').value = 'All Levels';
  loadJobs();
}

// ----------------------------------------------------
// 2. CANDIDATE WORKFLOW MODULER DETAILS
// ----------------------------------------------------

async function viewJobDetails(jobId) {
  selectedJobId = jobId;
  const token = localStorage.getItem('token');
  
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, { headers });
    const data = await res.json();

    if (data.success) {
      const job = data.data;

      // Close Landing Section before moving into dashboard detailed view
      document.getElementById('landing-section').classList.add('hidden');
      document.getElementById('main-section').classList.remove('hidden');

      document.getElementById('detail-title').textContent = job.title;
      document.getElementById('detail-company').innerHTML = `<i class="fa-regular fa-building"></i> Posted by: <strong>${job.recruiter_name}</strong>`;
      document.getElementById('detail-type').textContent = job.job_type;
      document.getElementById('detail-level').textContent = job.experience_level;
      document.getElementById('detail-salary').textContent = job.salary || 'Salary Undisclosed';
      document.getElementById('detail-location').innerHTML = `<i class="fa-solid fa-location-dot"></i> ${job.location}`;
      document.getElementById('detail-description').textContent = job.description;
      document.getElementById('detail-requirements').textContent = job.requirements;
      document.getElementById('detail-category').textContent = job.category;
      document.getElementById('detail-posted').textContent = new Date(job.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      document.getElementById('detail-email').textContent = job.recruiter_email;

      const saveBtn = document.getElementById('save-job-btn');
      if (job.hasSaved) {
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Bookmarked';
        saveBtn.className = 'btn btn-outline active';
      } else {
        saveBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Bookmark';
        saveBtn.className = 'btn btn-outline';
      }

      const applyBtn = document.getElementById('apply-job-btn');
      if (currentUser && (currentUser.role === 'recruiter' || currentUser.role === 'admin')) {
        applyBtn.classList.add('hidden');
        saveBtn.classList.add('hidden');
      } else {
        applyBtn.classList.remove('hidden');
        saveBtn.classList.remove('hidden');

        if (job.hasApplied) {
          applyBtn.innerHTML = 'Applied <i class="fa-solid fa-circle-check"></i>';
          applyBtn.disabled = true;
          applyBtn.className = 'btn btn-success';
        } else {
          applyBtn.innerHTML = 'Apply Now <i class="fa-solid fa-paper-plane"></i>';
          applyBtn.disabled = false;
          applyBtn.className = 'btn btn-primary';
        }
      }

      navigateTo('job-details-view');
    } else {
      showToast(data.message || 'Job not found', 'error');
    }
  } catch (err) {
    showToast('Error loading job specifications', 'error');
  }
}

function goBackToJobs() {
  if (currentUser) {
    navigateTo('jobs-view');
  } else {
    showLandingHome();
  }
}

async function toggleSaveCurrentJob() {
  if (!currentUser) {
    showToast('Please sign in to bookmark jobs', 'warning');
    openAuthModal('login');
    return;
  }

  const token = localStorage.getItem('token');
  const saveBtn = document.getElementById('save-job-btn');
  const isCurrentlySaved = saveBtn.classList.contains('active');

  const method = isCurrentlySaved ? 'DELETE' : 'POST';
  const endpoint = isCurrentlySaved ? `jobs/${selectedJobId}/unsave` : `jobs/${selectedJobId}/save`;

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      if (isCurrentlySaved) {
        saveBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i> Bookmark';
        saveBtn.classList.remove('active');
      } else {
        saveBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i> Bookmarked';
        saveBtn.classList.add('active');
      }
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to bookmark listing', 'error');
  }
}

async function loadSavedJobs() {
  const token = localStorage.getItem('token');
  const savedList = document.getElementById('saved-jobs-list');
  savedList.innerHTML = '<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading bookmarks...</div>';

  try {
    const res = await fetch(`${API_BASE}/jobs/saved`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const savedJobs = data.data;

      if (savedJobs.length === 0) {
        savedList.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fa-regular fa-bookmark"></i>
            <h3>No bookmarks saved</h3>
            <p>Save job cards from the browse jobs board to review them here.</p>
          </div>
        `;
        return;
      }

      savedList.innerHTML = '';
      savedJobs.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.innerHTML = `
          <div class="job-card-header">
            <div>
              <h3 class="job-card-title">${job.title}</h3>
              <div class="job-card-company"><i class="fa-regular fa-building"></i> ${job.recruiter_name}</div>
            </div>
            <button class="btn btn-danger btn-small" onclick="removeSavedJob(${job.id}, event)" title="Remove Bookmark">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
          <div class="job-card-metadata">
            <span class="badge badge-info">${job.job_type}</span>
            <span class="badge badge-indigo">${job.experience_level}</span>
            <span class="badge badge-muted">${job.location}</span>
          </div>
          <p class="job-card-description">${job.description}</p>
          <div class="job-card-footer">
            <span class="job-card-salary">${job.salary || 'Salary Undisclosed'}</span>
            <button class="btn btn-primary btn-small" onclick="viewJobDetails(${job.id})">
              Details <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;
        savedList.appendChild(card);
      });
    }
  } catch (err) {
    savedList.innerHTML = '<div class="loading-state">Error loading saved jobs</div>';
  }
}

async function removeSavedJob(jobId, event) {
  event.stopPropagation();
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/unsave`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadSavedJobs();
    }
  } catch (err) {
    showToast('Failed to remove bookmark', 'error');
  }
}

function openApplyModal() {
  if (!currentUser) {
    showToast('Please sign in to submit applications', 'warning');
    openAuthModal('login');
    return;
  }
  
  if (currentUser.profile && currentUser.profile.resume_url) {
    document.getElementById('apply-resume-url').value = currentUser.profile.resume_url;
  }

  document.getElementById('apply-job-id').value = selectedJobId;
  document.getElementById('apply-modal').classList.remove('hidden');
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.add('hidden');
}

async function handleSubmitApplication(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const job_id = document.getElementById('apply-job-id').value;
  const resume_url = document.getElementById('apply-resume-url').value;
  const cover_letter = document.getElementById('apply-cover-letter').value;

  try {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ job_id, resume_url, cover_letter })
    });

    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeApplyModal();
      viewJobDetails(job_id);
    } else {
      showToast(data.message || 'Submission failed', 'error');
    }
  } catch (err) {
    showToast('Error submitting application', 'error');
  }
}

// Renders the interactive pipeline progress tracker visually
function renderTimelineTracker(status) {
  const stages = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Hired'];
  const currentIndex = stages.indexOf(status);
  const isRejected = status === 'Rejected';
  
  let stepsHtml = '';
  
  stages.forEach((stage, idx) => {
    let stepClass = '';
    if (isRejected && idx === 0) {
      stepClass = 'completed'; // at least Applied was completed
    } else if (isRejected) {
      stepClass = ''; // rest are empty since it's rejected
    } else {
      if (idx < currentIndex) stepClass = 'completed';
      else if (idx === currentIndex) stepClass = 'active';
    }
    
    stepsHtml += `
      <div class="tracker-step ${stepClass}">
        <span class="tracker-dot"></span>
      </div>
    `;
  });

  // If rejected, inject a final red warning tracker node instead of Hired
  if (isRejected) {
    stepsHtml += `
      <div class="tracker-step rejected">
        <span class="tracker-dot"></span>
      </div>
    `;
  }

  // Calculate percentage of progress line connector
  let progressPct = 0;
  if (!isRejected && currentIndex !== -1) {
    progressPct = (currentIndex / (stages.length - 1)) * 100;
  }

  // Label tags configuration
  let labelText = status;
  let badgeClass = 'badge-info';
  if (status === 'Under Review') badgeClass = 'badge-indigo';
  else if (status === 'Shortlisted') badgeClass = 'badge-success';
  else if (status === 'Interview') badgeClass = 'badge-warning';
  else if (status === 'Hired') badgeClass = 'badge-success';
  else if (status === 'Rejected') badgeClass = 'badge-danger';

  return `
    <div class="progress-tracker-wrap">
      <div class="tracker-timeline-line">
        <div class="tracker-connector">
          <div class="tracker-connector-progress" style="width: ${progressPct}%;"></div>
        </div>
        ${stepsHtml}
      </div>
      <div class="tracker-labels">
        <span>Applied</span>
        <span>Review</span>
        <span>Shortlist</span>
        <span>Interview</span>
        <span class="${isRejected ? 'gradient-text' : ''}">${isRejected ? 'Rejected' : 'Hired'}</span>
      </div>
      <div style="text-align:center; margin-top:2px;">
        <span class="badge ${badgeClass}">${labelText}</span>
      </div>
    </div>
  `;
}

async function loadMyApplications() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('applications-table-body');
  tbody.innerHTML = '<tr><td colspan="5" class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Fetching applications...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const apps = data.data;

      if (apps.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5">
              <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <h3>No submissions found</h3>
                <p>You haven't submitted any job applications yet.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      apps.forEach(app => {
        const appliedDate = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timelineHtml = renderTimelineTracker(app.status);

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <strong>${app.title}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;"><i class="fa-solid fa-building"></i> ${app.recruiter_name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${app.location} (${app.job_type})</div>
          </td>
          <td><strong>${app.salary || 'Undisclosed'}</strong></td>
          <td>
            <div style="font-size:0.8rem;">Submitted: ${appliedDate}</div>
            <a href="${app.resume_url}" target="_blank" style="font-size:0.75rem; color:var(--primary); text-decoration:underline;"><i class="fa-solid fa-paperclip"></i> View Resume Link</a>
          </td>
          <td>${timelineHtml}</td>
          <td>
            <button class="btn btn-danger btn-small" onclick="withdrawApplication(${app.application_id})">
              Withdraw
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-state">Error loading applications.</td></tr>';
  }
}

async function withdrawApplication(appId) {
  if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/applications/${appId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadMyApplications();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to withdraw application', 'error');
  }
}

async function loadCandidateProfile() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.data) {
      const profile = data.data;
      document.getElementById('profile-title').value = profile.title || '';
      document.getElementById('profile-skills').value = profile.skills || '';
      document.getElementById('profile-experience').value = profile.experience_years || 0;
      document.getElementById('profile-resume').value = profile.resume_url || '';
      document.getElementById('profile-bio').value = profile.bio || '';
      
      if (currentUser) {
        currentUser.profile = profile;
      }
    }
  } catch (err) {
    console.error('Error fetching profile', err);
  }
}

async function handleSaveProfile(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const title = document.getElementById('profile-title').value;
  const skills = document.getElementById('profile-skills').value;
  const experience_years = document.getElementById('profile-experience').value;
  const resume_url = document.getElementById('profile-resume').value;
  const bio = document.getElementById('profile-bio').value;

  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, skills, experience_years, resume_url, bio })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadCandidateProfile();
    } else {
      showToast(data.message || 'Profile update failed', 'error');
    }
  } catch (err) {
    showToast('Failed to save profile details', 'error');
  }
}

// ----------------------------------------------------
// 3. RECRUITER MODULES
// ----------------------------------------------------

async function loadRecruiterDashboard() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const stats = data.data;

      // Card Numbers
      document.getElementById('recruiter-total-jobs').textContent = stats.jobs.totalJobs || 0;
      document.getElementById('recruiter-active-jobs').textContent = stats.jobs.activeJobs || 0;
      document.getElementById('recruiter-total-apps').textContent = stats.applicationsCount || 0;

      // Status breakdown
      const statusList = document.getElementById('status-breakdown-list');
      statusList.innerHTML = '';
      if (stats.statusBreakdown.length === 0) {
        statusList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">No applications yet</div>';
      } else {
        stats.statusBreakdown.forEach(item => {
          statusList.innerHTML += `
            <div class="status-row">
              <span class="status-label-name"><i class="fa-solid fa-circle-dot"></i> ${item.status}</span>
              <span class="status-count">${item.count}</span>
            </div>
          `;
        });
      }

      // Recent Applications Table
      const recentTbody = document.getElementById('recruiter-recent-apps-body');
      recentTbody.innerHTML = '';
      if (stats.recentApps.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding: 20px 0;">No candidates applied yet</td></tr>';
      } else {
        stats.recentApps.forEach(app => {
          recentTbody.innerHTML += `
            <tr>
              <td><strong>${app.candidate_name}</strong></td>
              <td>${app.job_title}</td>
              <td>${new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
              <td><span class="badge badge-info">${app.status}</span></td>
            </tr>
          `;
        });
      }
    }
  } catch (err) {
    console.error('Error loading recruiter stats', err);
  }
}

async function loadRecruiterJobsTable() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('recruiter-jobs-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Fetching your jobs...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/jobs/my-postings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const jobs = data.data;

      if (jobs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6">
              <div class="empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3>No postings found</h3>
                <p>Create your first job listing using the "Post a Job" navigation link.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = '';
      jobs.forEach(job => {
        const badgeClass = job.status === 'open' ? 'badge-success' : 'badge-danger';
        
        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${job.title}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Category: ${job.category}</div>
            </td>
            <td>${job.location} (${job.job_type})</td>
            <td><strong>${job.salary || 'Undisclosed'}</strong></td>
            <td><span class="badge ${badgeClass}">${job.status}</span></td>
            <td>
              <button class="btn btn-outline btn-small" onclick="viewJobApplicants(${job.id}, '${job.title.replace(/'/g, "\\'")}')">
                Applicants
              </button>
            </td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-outline btn-small" onclick="editJobPosting(${job.id})" title="Edit Job">
                  <i class="fa-solid fa-pencil"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteJobPosting(${job.id})" title="Delete Posting">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Error loading jobs.</td></tr>';
  }
}

function resetJobForm() {
  document.getElementById('job-form-id').value = '';
  document.getElementById('job-title').value = '';
  document.getElementById('job-location').value = '';
  document.getElementById('job-type').value = 'Full-time';
  document.getElementById('job-category').value = '';
  document.getElementById('job-experience').value = 'Entry Level';
  document.getElementById('job-salary').value = '';
  document.getElementById('job-description').value = '';
  document.getElementById('job-requirements').value = '';
  
  document.getElementById('job-form-title').textContent = 'Create New Job Posting';
  document.getElementById('job-status-group').classList.add('hidden');
}

async function handleSaveJob(e) {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const id = document.getElementById('job-form-id').value;

  const payload = {
    title: document.getElementById('job-title').value,
    location: document.getElementById('job-location').value,
    job_type: document.getElementById('job-type').value,
    category: document.getElementById('job-category').value,
    experience_level: document.getElementById('job-experience').value,
    salary: document.getElementById('job-salary').value,
    description: document.getElementById('job-description').value,
    requirements: document.getElementById('job-requirements').value
  };

  if (id) {
    payload.status = document.getElementById('job-status').value;
  }

  const method = id ? 'PUT' : 'POST';
  const endpoint = id ? `jobs/${id}` : 'jobs';

  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      resetJobForm();
      navigateTo('recruiter-jobs');
    } else {
      showToast(data.message || 'Saving job failed', 'error');
    }
  } catch (err) {
    showToast('Connection to server failed', 'error');
  }
}

async function editJobPosting(jobId) {
  resetJobForm();
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const job = data.data;
      
      document.getElementById('job-form-id').value = job.id;
      document.getElementById('job-title').value = job.title;
      document.getElementById('job-location').value = job.location;
      document.getElementById('job-type').value = job.job_type;
      document.getElementById('job-category').value = job.category;
      document.getElementById('job-experience').value = job.experience_level;
      document.getElementById('job-salary').value = job.salary || '';
      document.getElementById('job-description').value = job.description;
      document.getElementById('job-requirements').value = job.requirements;
      
      document.getElementById('job-status').value = job.status;
      document.getElementById('job-status-group').classList.remove('hidden');

      document.getElementById('job-form-title').textContent = 'Edit Job Posting';
      navigateTo('post-job-view');
    }
  } catch (err) {
    showToast('Failed to load job posting', 'error');
  }
}

async function deleteJobPosting(jobId) {
  if (!confirm('Are you sure you want to delete this job listing? All associated applications will also be deleted.')) {
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadRecruiterJobsTable();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete job listing', 'error');
  }
}

async function viewJobApplicants(jobId, jobTitle) {
  document.getElementById('applicants-job-title').textContent = jobTitle;
  const container = document.getElementById('applicants-list-container');
  container.innerHTML = '<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading candidates...</div>';

  navigateTo('job-applicants-view');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/applications/job/${jobId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const applicants = data.data;

      if (applicants.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-user"></i>
            <h3>No applicants yet</h3>
            <p>No candidates have applied for this position yet.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = '';
      applicants.forEach(app => {
        const skills = app.skills ? app.skills : 'No skills specified';
        const exp = app.experience_years ? `${app.experience_years} years` : '0';
        const title = app.candidate_title ? app.candidate_title : 'Candidate Profile';
        const cover = app.cover_letter ? `
          <div class="applicant-cover-letter">
            <div class="cover-letter-heading">Cover Letter</div>
            <p>${app.cover_letter}</p>
          </div>
        ` : '';

        const card = document.createElement('div');
        card.className = 'applicant-card';
        card.innerHTML = `
          <div class="applicant-card-header">
            <div>
              <h3 class="applicant-name">${app.candidate_name}</h3>
              <div class="applicant-title">${title}</div>
            </div>
            
            <div class="status-selector-wrap">
              <label for="status-for-${app.application_id}">Status:</label>
              <select id="status-for-${app.application_id}" onchange="changeApplicantStatus(${app.application_id}, this.value)">
                <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
                <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                <option value="Shortlisted" ${app.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
                <option value="Hired" ${app.status === 'Hired' ? 'selected' : ''}>Hired</option>
                <option value="Rejected" ${app.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
              </select>
            </div>
          </div>

          <div class="applicant-details-row">
            <div class="applicant-detail-item">
              <span>Email</span>
              <strong>${app.candidate_email}</strong>
            </div>
            <div class="applicant-detail-item">
              <span>Experience</span>
              <strong>${exp} years</strong>
            </div>
            <div class="applicant-detail-item">
              <span>Applied Date</span>
              <strong>${new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </div>
            <div class="applicant-detail-item">
              <span>Resume Link</span>
              <strong><a href="${app.resume_url}" target="_blank" class="btn btn-outline btn-small" style="margin-top:4px;"><i class="fa-solid fa-download"></i> View PDF</a></strong>
            </div>
          </div>

          <p class="applicant-bio">${app.bio || 'No profile biography provided'}</p>
          <div class="applicant-bio" style="font-size:0.82rem; color:var(--text-main);"><strong>Skills Summary:</strong> ${skills}</div>
          
          ${cover}
        `;
        container.appendChild(card);
      });
    }
  } catch (err) {
    container.innerHTML = '<div class="loading-state">Error fetching applicant data.</div>';
  }
}

async function changeApplicantStatus(appId, newStatus) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
    } else {
      showToast(data.message || 'Status update failed', 'error');
    }
  } catch (err) {
    showToast('Failed to update status', 'error');
  }
}

// ----------------------------------------------------
// 4. ADMIN MODULES
// ----------------------------------------------------

async function loadAdminDashboard() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/admin/admin-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const stats = data.data;

      // Stats counts
      document.getElementById('admin-total-users').textContent = stats.counts.users;
      document.getElementById('admin-total-jobs').textContent = stats.counts.jobs;
      document.getElementById('admin-total-apps').textContent = stats.counts.applications;

      // User roles breakdown
      const rolesBreakdown = document.getElementById('admin-roles-breakdown');
      rolesBreakdown.innerHTML = '';
      stats.roles.forEach(role => {
        rolesBreakdown.innerHTML += `
          <div class="status-row">
            <span class="status-label-name" style="text-transform: capitalize;"><i class="fa-solid fa-user-shield"></i> ${role.role}s</span>
            <span class="status-count">${role.count}</span>
          </div>
        `;
      });

      // Recent postings
      const recentTbody = document.getElementById('admin-recent-jobs-body');
      recentTbody.innerHTML = '';
      if (stats.recentJobs.length === 0) {
        recentTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding: 14px 0;">No jobs posted yet</td></tr>';
      } else {
        stats.recentJobs.forEach(job => {
          recentTbody.innerHTML += `
            <tr>
              <td><strong>${job.title}</strong></td>
              <td>${job.recruiter_name}</td>
              <td>${job.location}</td>
              <td>${new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            </tr>
          `;
        });
      }
    }
  } catch (err) {
    console.error('Error loading admin dashboard', err);
  }
}

async function loadAdminUsersTable() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('admin-users-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Fetching users...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const users = data.data;

      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding: 20px 0;">No users registered</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      users.forEach(user => {
        let roleBadge = user.role === 'recruiter' ? 'badge-indigo' : 'badge-info';

        tbody.innerHTML += `
          <tr>
            <td>${user.id}</td>
            <td><strong>${user.name}</strong></td>
            <td>${user.email}</td>
            <td><span class="badge ${roleBadge}">${user.role}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>
              <button class="btn btn-danger btn-small" onclick="adminDeleteUser(${user.id})">
                Remove Account
              </button>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-state">Error fetching user directory</td></tr>';
  }
}

async function adminDeleteUser(userId) {
  if (!confirm('WARNING: Are you sure you want to permanently delete this user account? All candidate profiles, job postings, bookmarks, and applications linked with this account will be deleted.')) {
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminUsersTable();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete user account', 'error');
  }
}

async function loadAdminJobsTable() {
  const token = localStorage.getItem('token');
  const tbody = document.getElementById('admin-jobs-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Fetching jobs...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/admin/jobs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success) {
      const jobs = data.data;

      if (jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding: 20px 0;">No job listings in database</td></tr>';
        return;
      }

      tbody.innerHTML = '';
      jobs.forEach(job => {
        const badgeClass = job.status === 'open' ? 'badge-success' : 'badge-danger';
        
        tbody.innerHTML += `
          <tr>
            <td>${job.id}</td>
            <td><strong>${job.title}</strong><div style="font-size:0.75rem; color:var(--text-muted);">${job.job_type}</div></td>
            <td>${job.recruiter_name}</td>
            <td>${job.location}</td>
            <td><span class="badge ${badgeClass}">${job.status}</span></td>
            <td>${new Date(job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-outline btn-small" onclick="viewJobDetails(${job.id})">
                  View Specifications
                </button>
                <button class="btn btn-danger btn-small" onclick="adminDeleteJob(${job.id})">
                  Remove Job
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-state">Error loading jobs directory</td></tr>';
  }
}

async function adminDeleteJob(jobId) {
  if (!confirm('Are you sure you want to force-remove this job listing? All applications associated with it will be deleted.')) {
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminJobsTable();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to moderate and delete job listing', 'error');
  }
}

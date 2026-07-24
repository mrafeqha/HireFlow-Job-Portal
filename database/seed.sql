-- HireFlow Seed Data
-- Seed accounts all use 'password123' as password

USE hireflow;

-- Seed Users
-- Bcrypt hash of 'password123': $2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'System Admin', 'admin@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'admin'),
(2, 'Alice Smith', 'recruiter1@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'recruiter'),
(3, 'Bob Jones', 'recruiter2@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'recruiter'),
(4, 'John Doe', 'candidate1@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'candidate'),
(5, 'Jane Miller', 'candidate2@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'candidate'),
(6, 'Alex Rivera', 'candidate3@hireflow.com', '$2a$10$MbI/PQqr09JLQNL2w/3.UewhW3pOl1kZlhzqt8ElaybW7oKZL70pW', 'candidate');

-- Seed Candidate Profiles
INSERT INTO candidate_profiles (user_id, title, skills, experience_years, resume_url, bio) VALUES
(4, 'Software Engineer', 'JavaScript, React, Node.js, Express, MySQL', 3, 'https://example.com/resumes/johndoe.pdf', 'Passionate full-stack developer with 3 years of experience building web applications.'),
(5, 'UI/UX Designer', 'Figma, Adobe XD, CSS, HTML, Prototyping', 2, 'https://example.com/resumes/janemiller.pdf', 'Creative designer focused on crafting user-centric digital experiences.'),
(6, 'QA Engineer', 'Selenium, Cypress, Jest, Postman, QA Automation', 4, 'https://example.com/resumes/alexrivera.pdf', 'Detail-oriented QA engineer specialized in end-to-end automation and API testing.');

-- Seed Jobs
INSERT INTO jobs (id, recruiter_id, title, description, requirements, location, job_type, category, experience_level, salary, status) VALUES
(1, 2, 'Senior Backend Developer', 'We are looking for a Senior Backend Developer proficient in Node.js and MySQL to lead our server team.', 'Node.js, Express.js, MySQL, Redis, AWS, REST APIs', 'San Francisco, CA', 'Full-time', 'Engineering', 'Senior Level', '$120,000 - $150,000', 'open'),
(2, 2, 'Frontend Developer (React)', 'Join our dynamic team building next-generation SaaS interfaces. Strong React skills are required.', 'React, Redux, JavaScript, CSS3, Webpack', 'Remote', 'Full-time', 'Engineering', 'Mid Level', '$90,000 - $110,000', 'open'),
(3, 3, 'Product Designer', 'Create layouts, prototypes, and UI specifications for our flagship products.', 'Figma, Sketch, User Research, Interaction Design', 'New York, NY', 'Contract', 'Design', 'Mid Level', '$80 - $100 / hour', 'open'),
(4, 3, 'QA Automation Intern', 'Work closely with our QA leads to write automation scripts and verify software quality.', 'JavaScript, HTML, CSS, Cypress, Basic QA Concepts', 'Chicago, IL', 'Internship', 'Engineering', 'Entry Level', '$25 - $35 / hour', 'open'),
(5, 2, 'DevOps Engineer', 'Manage and optimize our deployment pipelines, cloud infrastructure, and databases.', 'Docker, Kubernetes, AWS, CI/CD, Terraform', 'Remote', 'Full-time', 'Engineering', 'Senior Level', '$130,000 - $160,000', 'open');

-- Seed Applications
INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status) VALUES
(1, 4, 'https://example.com/resumes/johndoe.pdf', 'I have extensive experience with Node.js and databases. I would love to join your team!', 'Under Review'),
(2, 4, 'https://example.com/resumes/johndoe.pdf', 'I work with React daily and have created several web apps.', 'Applied'),
(3, 5, 'https://example.com/resumes/janemiller.pdf', 'Figma is my home. Check out my portfolio in the bio.', 'Shortlisted'),
(4, 6, 'https://example.com/resumes/alexrivera.pdf', 'Looking to shift into automation testing with this internship.', 'Interview'),
(2, 6, 'https://example.com/resumes/alexrivera.pdf', 'I have basic React knowledge and strong QA scripting experience.', 'Rejected');

-- Seed Saved Jobs
INSERT INTO saved_jobs (candidate_id, job_id) VALUES
(4, 3), -- John saved Product Designer
(5, 1); -- Jane saved Senior Backend Developer

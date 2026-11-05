-- AI Resume Builder - MySQL Database Schema
-- Version: 1.0.0

CREATE DATABASE IF NOT EXISTS ai_resume_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_resume_builder;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('user', 'guest', 'admin') DEFAULT 'user',
  avatar_url VARCHAR(500),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_uuid (uuid)
);

-- =============================================
-- GUEST SESSIONS TABLE
-- =============================================
CREATE TABLE guest_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_token (session_token),
  INDEX idx_expires (expires_at)
);

-- =============================================
-- TEMPLATES TABLE
-- =============================================
CREATE TABLE templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category ENUM('professional', 'modern', 'minimal', 'creative', 'executive') DEFAULT 'professional',
  thumbnail_url VARCHAR(500),
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  config JSON COMMENT 'Default colors, fonts, layout settings',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_category (category)
);

-- =============================================
-- RESUMES TABLE
-- =============================================
CREATE TABLE resumes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  user_id INT UNSIGNED,
  guest_session_id INT UNSIGNED,
  template_id INT UNSIGNED,
  title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
  slug VARCHAR(255),
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  is_public BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100),
  target_job_role VARCHAR(255),
  ats_score INT DEFAULT 0,
  customization JSON COMMENT 'Colors, fonts, spacing settings',
  thumbnail_url VARCHAR(500),
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (guest_session_id) REFERENCES guest_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_uuid (uuid),
  INDEX idx_share_token (share_token)
);

-- =============================================
-- RESUME SECTIONS TABLE
-- =============================================
CREATE TABLE resume_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resume_id INT UNSIGNED NOT NULL,
  section_type ENUM(
    'personal_info', 'summary', 'objective', 'education',
    'experience', 'skills', 'projects', 'certifications',
    'achievements', 'languages', 'interests', 'declaration',
    'publications', 'volunteer', 'awards', 'references', 'custom'
  ) NOT NULL,
  custom_title VARCHAR(100),
  content JSON NOT NULL COMMENT 'Section-specific structured data',
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  INDEX idx_resume (resume_id),
  INDEX idx_type (section_type)
);

-- =============================================
-- AI RESUME CACHE TABLE
-- =============================================
CREATE TABLE ai_resume_cache (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(64) NOT NULL UNIQUE COMMENT 'MD5 of normalized inputs',
  job_role VARCHAR(255) NOT NULL,
  skills_input TEXT,
  experience_level ENUM('fresher', 'junior', 'mid', 'senior', 'lead', 'executive') DEFAULT 'mid',
  generated_content JSON NOT NULL,
  model_used VARCHAR(100),
  tokens_used INT,
  use_count INT DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cache_key (cache_key),
  INDEX idx_job_role (job_role),
  INDEX idx_use_count (use_count)
);

-- =============================================
-- AI GENERATION HISTORY TABLE
-- =============================================
CREATE TABLE ai_generation_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED,
  resume_id INT UNSIGNED,
  cache_id INT UNSIGNED,
  job_role VARCHAR(255),
  skills_input TEXT,
  was_cached BOOLEAN DEFAULT FALSE,
  tokens_used INT DEFAULT 0,
  generation_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL,
  FOREIGN KEY (cache_id) REFERENCES ai_resume_cache(id) ON DELETE SET NULL
);

-- =============================================
-- DOWNLOADS TABLE
-- =============================================
CREATE TABLE downloads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resume_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,
  format ENUM('pdf', 'docx') NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  file_size_bytes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_resume (resume_id),
  INDEX idx_user (user_id)
);

-- =============================================
-- RESUME ANALYTICS TABLE
-- =============================================
CREATE TABLE resume_analytics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  resume_id INT UNSIGNED NOT NULL,
  event_type ENUM('view', 'download', 'share', 'edit') NOT NULL,
  metadata JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  INDEX idx_resume (resume_id),
  INDEX idx_event (event_type),
  INDEX idx_date (created_at)
);

-- =============================================
-- PASSWORD RESET TOKENS
-- =============================================
CREATE TABLE password_reset_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
);

-- =============================================
-- DEFAULT TEMPLATE DATA
-- =============================================
INSERT INTO templates (name, slug, description, category, is_premium, sort_order, config) VALUES
('Executive Pro', 'executive-pro', 'Clean executive style with strong typography', 'professional', FALSE, 1,
  '{"primaryColor":"#1a1a2e","accentColor":"#e94560","font":"Playfair Display","fontSize":11,"lineHeight":1.5}'),
('Modern Slate', 'modern-slate', 'Contemporary two-column design with sidebar', 'modern', FALSE, 2,
  '{"primaryColor":"#2d3748","accentColor":"#667eea","font":"DM Sans","fontSize":10.5,"lineHeight":1.6}'),
('Minimal Edge', 'minimal-edge', 'Ultra-clean minimalist layout', 'minimal', FALSE, 3,
  '{"primaryColor":"#000000","accentColor":"#0070f3","font":"Inter","fontSize":10,"lineHeight":1.7}'),
('Creative Canvas', 'creative-canvas', 'Bold creative design with accent blocks', 'creative', TRUE, 4,
  '{"primaryColor":"#6c3483","accentColor":"#f39c12","font":"Syne","fontSize":11,"lineHeight":1.5}'),
('Corporate Blue', 'corporate-blue', 'Traditional corporate with blue accents', 'professional', FALSE, 5,
  '{"primaryColor":"#1565c0","accentColor":"#0d47a1","font":"Lato","fontSize":11,"lineHeight":1.5}'),
('Tech Resume', 'tech-resume', 'Developer-focused with clean code aesthetic', 'modern', FALSE, 6,
  '{"primaryColor":"#0f172a","accentColor":"#06b6d4","font":"JetBrains Mono","fontSize":10,"lineHeight":1.6}'),
('Elegant Serif', 'elegant-serif', 'Refined serif typography for senior roles', 'executive', TRUE, 7,
  '{"primaryColor":"#2c2c2c","accentColor":"#c9a84c","font":"Cormorant Garamond","fontSize":11.5,"lineHeight":1.6}'),
('Fresh Graduate', 'fresh-graduate', 'Perfect for entry-level and fresh graduates', 'minimal', FALSE, 8,
  '{"primaryColor":"#16a085","accentColor":"#2ecc71","font":"Nunito","fontSize":10.5,"lineHeight":1.7}');

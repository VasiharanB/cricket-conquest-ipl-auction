-- ============================================
-- Cricket Conquest – ZenTriX'26 IPL Auction
-- MySQL Database Schema for Teams & Participants
-- ============================================

USE cricket_conquest;

-- --------------------------------------------
-- Table: teams
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id VARCHAR(30) UNIQUE NOT NULL,
  team_name VARCHAR(120) NOT NULL,
  college_name VARCHAR(150) NOT NULL,
  captain_name VARCHAR(120) NOT NULL,
  captain_email VARCHAR(150) NOT NULL,
  captain_phone VARCHAR(30) NOT NULL,
  registration_status ENUM(
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'WAITLISTED'
  ) NOT NULL DEFAULT 'CONFIRMED',
  check_in_status ENUM(
    'NOT_CHECKED_IN',
    'CHECKED_IN'
  ) NOT NULL DEFAULT 'NOT_CHECKED_IN',
  starting_purse DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  remaining_purse DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  players_bought INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Performance Indexes
  INDEX idx_teams_team_id (team_id),
  INDEX idx_teams_name (team_name),
  INDEX idx_teams_college (college_name),
  INDEX idx_teams_reg_status (registration_status),
  INDEX idx_teams_checkin_status (check_in_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: team_members
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  member_number TINYINT UNSIGNED NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NULL,
  phone VARCHAR(30) NULL,
  is_captain BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign Key & Uniqueness
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY uq_team_member_number (team_id, member_number),
  INDEX idx_team_members_team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

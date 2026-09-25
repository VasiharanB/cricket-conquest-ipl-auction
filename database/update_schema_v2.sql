-- ============================================
-- Cricket Conquest – ZenTriX'26 IPL Auction
-- Schema Migration V2: Secret Points, Participant Auth, Watchdog & Results Gate
-- ============================================

USE cricket_conquest;

-- 1. Add secret key_points and notes to players table (if not exists)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS key_points DECIMAL(6, 2) NOT NULL DEFAULT 0.00 AFTER rating,
  ADD COLUMN IF NOT EXISTS notes TEXT NULL AFTER key_points;

-- 2. Add access_code and live presence tracking to teams table
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS access_code VARCHAR(50) NOT NULL DEFAULT 'CC26-PASS' AFTER captain_phone,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE AFTER players_bought,
  ADD COLUMN IF NOT EXISTS current_page VARCHAR(100) NOT NULL DEFAULT 'dashboard' AFTER is_online,
  ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP NULL AFTER current_page,
  ADD COLUMN IF NOT EXISTS support_requested BOOLEAN NOT NULL DEFAULT FALSE AFTER last_ping,
  ADD COLUMN IF NOT EXISTS support_message VARCHAR(255) NULL AFTER support_requested;

-- 3. Add results publishing lock to auction_sessions
ALTER TABLE auction_sessions
  ADD COLUMN IF NOT EXISTS is_results_published BOOLEAN NOT NULL DEFAULT FALSE AFTER round_number,
  ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMP NULL AFTER is_results_published;

-- 4. Create participant activities / audit tracking table for helpers
CREATE TABLE IF NOT EXISTS participant_activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT UNSIGNED NOT NULL,
  action_type ENUM('LOGIN', 'ENTER_AUCTION', 'LEAVE_AUCTION', 'PLACE_BID', 'REQUEST_HELP', 'RESOLVE_HELP', 'HEARTBEAT') NOT NULL,
  details VARCHAR(255) NULL,
  ip_address VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_activities_team (team_id),
  INDEX idx_activities_action (action_type),
  INDEX idx_activities_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed default access_codes for existing teams
UPDATE teams SET access_code = CONCAT('CC26-', UPPER(SUBSTRING(REPLACE(team_name, ' ', ''), 1, 4)), '-', FLOOR(1000 + RAND() * 9000))
WHERE access_code = 'CC26-PASS' OR access_code = '';

-- 6. Seed sample key_points for starter players
UPDATE players SET key_points = 95.50 WHERE player_id = 'P001';
UPDATE players SET key_points = 94.00 WHERE player_id = 'P002';
UPDATE players SET key_points = 93.00 WHERE player_id = 'P003';
UPDATE players SET key_points = 91.50 WHERE player_id = 'P004';
UPDATE players SET key_points = 95.00 WHERE player_id = 'P005';
UPDATE players SET key_points = 92.50 WHERE player_id = 'P006';
UPDATE players SET key_points = 93.50 WHERE player_id = 'P007';
UPDATE players SET key_points = 90.00 WHERE player_id = 'P008';
UPDATE players SET key_points = 89.50 WHERE player_id = 'P009';
UPDATE players SET key_points = 87.00 WHERE player_id = 'P010';
UPDATE players SET key_points = 89.00 WHERE player_id = 'P011';
UPDATE players SET key_points = 91.00 WHERE player_id = 'P012';
UPDATE players SET key_points = 94.50 WHERE player_id = 'P013';
UPDATE players SET key_points = 88.00 WHERE player_id = 'P014';
UPDATE players SET key_points = 87.50 WHERE player_id = 'P015';
UPDATE players SET key_points = 91.50 WHERE player_id = 'P016';
UPDATE players SET key_points = 86.50 WHERE player_id = 'P017';
UPDATE players SET key_points = 94.00 WHERE player_id = 'P018';
UPDATE players SET key_points = 85.00 WHERE player_id = 'P019';
UPDATE players SET key_points = 86.00 WHERE player_id = 'P020';

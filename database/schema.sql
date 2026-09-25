-- ============================================
-- Cricket Conquest – ZenTriX'26 IPL Auction
-- Database Schema for Player Database Milestone
-- ============================================

CREATE DATABASE IF NOT EXISTS cricket_conquest;
USE cricket_conquest;

-- Create Players Table
CREATE TABLE IF NOT EXISTS players (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(20) NOT NULL UNIQUE,
  player_name VARCHAR(120) NOT NULL,
  role VARCHAR(40) NOT NULL,
  nationality VARCHAR(60) NOT NULL,
  player_category VARCHAR(40) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(4, 1) NULL,
  status ENUM('AVAILABLE', 'SOLD', 'UNSOLD') NOT NULL DEFAULT 'AVAILABLE',
  sold_to_team_id BIGINT UNSIGNED NULL,
  sold_price DECIMAL(10, 2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Performance Indexes
  INDEX idx_players_player_id (player_id),
  INDEX idx_players_name (player_name),
  INDEX idx_players_role (role),
  INDEX idx_players_nationality (nationality),
  INDEX idx_players_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

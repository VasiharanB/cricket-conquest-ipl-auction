-- ============================================
-- Cricket Conquest – ZenTriX'26 IPL Auction
-- Auction System Database Schema
-- ============================================

USE cricket_conquest;

-- --------------------------------------------
-- Table: organizers (Authentication & RBAC)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS organizers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin', 'Auctioneer', 'Volunteer') NOT NULL DEFAULT 'Volunteer',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_organizers_username (username),
  INDEX idx_organizers_email (email),
  INDEX idx_organizers_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: auction_sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS auction_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_name VARCHAR(120) NOT NULL DEFAULT 'ZenTriX 26 IPL Auction',
  status ENUM('NOT_STARTED', 'ACTIVE', 'PAUSED', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  current_player_id BIGINT UNSIGNED NULL,
  current_bid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  highest_bidder_team_id BIGINT UNSIGNED NULL,
  state_stage ENUM(
    'INITIAL',
    'PLAYER_READY',
    'BIDDING',
    'GOING_ONCE',
    'GOING_TWICE',
    'SOLD',
    'UNSOLD',
    'PAUSED',
    'NEXT_PLAYER'
  ) NOT NULL DEFAULT 'INITIAL',
  timer_seconds INT NOT NULL DEFAULT 15,
  round_number INT NOT NULL DEFAULT 1,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (current_player_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (highest_bidder_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_auction_sessions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: auction_queue
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS auction_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  player_id BIGINT UNSIGNED NOT NULL,
  queue_order INT NOT NULL,
  status ENUM('QUEUED', 'CURRENT', 'SOLD', 'UNSOLD', 'PASSED') NOT NULL DEFAULT 'QUEUED',
  round_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE KEY uq_session_player (session_id, player_id),
  INDEX idx_queue_order (session_id, queue_order),
  INDEX idx_queue_status (session_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: bids
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS bids (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  player_id BIGINT UNSIGNED NOT NULL,
  team_id BIGINT UNSIGNED NOT NULL,
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_bids_session_player (session_id, player_id),
  INDEX idx_bids_team (team_id),
  INDEX idx_bids_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: player_purchases
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS player_purchases (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  player_id BIGINT UNSIGNED NOT NULL,
  team_id BIGINT UNSIGNED NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  winning_bid_id BIGINT UNSIGNED NULL,
  is_undone BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (winning_bid_id) REFERENCES bids(id) ON DELETE SET NULL,
  INDEX idx_purchases_session (session_id),
  INDEX idx_purchases_team (team_id),
  INDEX idx_purchases_undone (is_undone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------
-- Table: auction_events (Audit Log)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS auction_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM(
    'AUCTION_STARTED',
    'PLAYER_STARTED',
    'BID_PLACED',
    'GOING_ONCE',
    'GOING_TWICE',
    'PLAYER_SOLD',
    'PLAYER_UNSOLD',
    'AUCTION_PAUSED',
    'AUCTION_RESUMED',
    'SALE_UNDONE',
    'TIMER_RESET'
  ) NOT NULL,
  player_id BIGINT UNSIGNED NULL,
  team_id BIGINT UNSIGNED NULL,
  amount DECIMAL(10, 2) NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  INDEX idx_events_session (session_id),
  INDEX idx_events_type (event_type),
  INDEX idx_events_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Cricket Conquest – ZenTriX'26 IPL Auction System
-- FULL DATABASE SETUP SCRIPT (Run this once on a clean MySQL)
-- ============================================================
-- Usage: mysql -u root -p < database/FULL_SETUP.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS cricket_conquest
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cricket_conquest;

-- ─────────────────────────────────────────────────────────────
-- 1. PLAYERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id         VARCHAR(20)  NOT NULL UNIQUE,
  player_name       VARCHAR(120) NOT NULL,
  role              VARCHAR(40)  NOT NULL,
  nationality       VARCHAR(60)  NOT NULL,
  player_category   VARCHAR(40)  NOT NULL DEFAULT 'General',
  base_price        DECIMAL(10, 2) NOT NULL DEFAULT 0.20,
  rating            DECIMAL(4, 1)  NULL,
  status            ENUM('AVAILABLE','SOLD','UNSOLD') NOT NULL DEFAULT 'AVAILABLE',
  sold_to_team_id   BIGINT UNSIGNED NULL,
  sold_price        DECIMAL(10, 2)  NULL,
  notes             TEXT NULL,
  key_points        INT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_players_player_id  (player_id),
  INDEX idx_players_name       (player_name),
  INDEX idx_players_role       (role),
  INDEX idx_players_nationality(nationality),
  INDEX idx_players_status     (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 2. TEAMS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id              VARCHAR(20)  NOT NULL UNIQUE,
  team_name            VARCHAR(120) NOT NULL,
  college_name         VARCHAR(120) NOT NULL,
  captain_name         VARCHAR(120) NOT NULL,
  captain_email        VARCHAR(150) NOT NULL,
  captain_phone        VARCHAR(20)  NOT NULL,
  access_code          VARCHAR(20)  NOT NULL UNIQUE,
  registration_status  ENUM('PENDING','CONFIRMED','CANCELLED','WAITLISTED') NOT NULL DEFAULT 'PENDING',
  check_in_status      ENUM('NOT_CHECKED_IN','CHECKED_IN') NOT NULL DEFAULT 'NOT_CHECKED_IN',
  starting_purse       DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  remaining_purse      DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  players_bought       INT NOT NULL DEFAULT 0,
  is_online            BOOLEAN NOT NULL DEFAULT FALSE,
  current_page         VARCHAR(100) NULL,
  last_ping            TIMESTAMP NULL,
  support_requested    BOOLEAN NOT NULL DEFAULT FALSE,
  support_message      TEXT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_teams_team_id            (team_id),
  INDEX idx_teams_registration_status(registration_status),
  INDEX idx_teams_check_in_status    (check_in_status),
  INDEX idx_teams_access_code        (access_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 3. TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id       BIGINT UNSIGNED NOT NULL,
  member_number INT NOT NULL DEFAULT 1,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(150) NULL,
  phone         VARCHAR(20)  NULL,
  is_captain    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_team_members_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 4. ORGANIZERS — Authentication & RBAC
-- ─────────────────────────────────────────────────────────────
-- Roles:
--   Admin      → Full access: user management, team CRUD, player CRUD, auction control, publish results
--   Auctioneer → Auction control, team check-in, player edit, watchdog monitor, view all
--   Volunteer  → Read-only: dashboard, teams, players, history, results
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Admin','Auctioneer','Volunteer') NOT NULL DEFAULT 'Volunteer',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login    TIMESTAMP NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_organizers_username (username),
  INDEX idx_organizers_email    (email),
  INDEX idx_organizers_role     (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 5. AUCTION SESSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_sessions (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_name          VARCHAR(120) NOT NULL DEFAULT 'ZenTriX 26 IPL Auction',
  status                ENUM('NOT_STARTED','ACTIVE','PAUSED','COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
  current_player_id     BIGINT UNSIGNED NULL,
  current_bid           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  highest_bidder_team_id BIGINT UNSIGNED NULL,
  state_stage           ENUM(
    'INITIAL','PLAYER_READY','BIDDING','GOING_ONCE','GOING_TWICE',
    'SOLD','UNSOLD','PAUSED','NEXT_PLAYER'
  ) NOT NULL DEFAULT 'INITIAL',
  timer_seconds         INT NOT NULL DEFAULT 15,
  round_number          INT NOT NULL DEFAULT 1,
  started_at            TIMESTAMP NULL,
  ended_at              TIMESTAMP NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (current_player_id)       REFERENCES players(id) ON DELETE SET NULL,
  FOREIGN KEY (highest_bidder_team_id)  REFERENCES teams(id)   ON DELETE SET NULL,
  INDEX idx_auction_sessions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 6. AUCTION QUEUE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_queue (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   BIGINT UNSIGNED NOT NULL,
  player_id    BIGINT UNSIGNED NOT NULL,
  queue_order  INT NOT NULL,
  status       ENUM('QUEUED','CURRENT','SOLD','UNSOLD','PASSED') NOT NULL DEFAULT 'QUEUED',
  round_number INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id)  REFERENCES players(id)           ON DELETE CASCADE,
  UNIQUE KEY uq_session_player (session_id, player_id),
  INDEX idx_queue_order  (session_id, queue_order),
  INDEX idx_queue_status (session_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 7. BIDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id  BIGINT UNSIGNED NOT NULL,
  player_id   BIGINT UNSIGNED NOT NULL,
  team_id     BIGINT UNSIGNED NOT NULL,
  bid_amount  DECIMAL(10, 2) NOT NULL,
  bid_order   INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id)  REFERENCES players(id)           ON DELETE CASCADE,
  FOREIGN KEY (team_id)    REFERENCES teams(id)             ON DELETE CASCADE,
  INDEX idx_bids_session_player(session_id, player_id),
  INDEX idx_bids_team          (team_id),
  INDEX idx_bids_created_at    (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 8. PLAYER PURCHASES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS player_purchases (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id     BIGINT UNSIGNED NOT NULL,
  player_id      BIGINT UNSIGNED NOT NULL,
  team_id        BIGINT UNSIGNED NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  winning_bid_id BIGINT UNSIGNED NULL,
  is_undone      BOOLEAN NOT NULL DEFAULT FALSE,
  purchased_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id)     REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id)      REFERENCES players(id)           ON DELETE CASCADE,
  FOREIGN KEY (team_id)        REFERENCES teams(id)             ON DELETE CASCADE,
  FOREIGN KEY (winning_bid_id) REFERENCES bids(id)              ON DELETE SET NULL,
  INDEX idx_purchases_session(session_id),
  INDEX idx_purchases_team   (team_id),
  INDEX idx_purchases_undone (is_undone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 9. AUCTION EVENTS (Full Audit Log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_events (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id   BIGINT UNSIGNED NOT NULL,
  event_type   ENUM(
    'AUCTION_STARTED','PLAYER_STARTED','BID_PLACED',
    'GOING_ONCE','GOING_TWICE','PLAYER_SOLD','PLAYER_UNSOLD',
    'AUCTION_PAUSED','AUCTION_RESUMED','SALE_UNDONE','TIMER_RESET'
  ) NOT NULL,
  player_id    BIGINT UNSIGNED NULL,
  team_id      BIGINT UNSIGNED NULL,
  amount       DECIMAL(10, 2) NULL,
  payload_json JSON NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id)  REFERENCES players(id)           ON DELETE SET NULL,
  FOREIGN KEY (team_id)    REFERENCES teams(id)             ON DELETE SET NULL,
  INDEX idx_events_session   (session_id),
  INDEX idx_events_type      (event_type),
  INDEX idx_events_created_at(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 10. PUBLISHED RESULTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS published_results (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id     BIGINT UNSIGNED NOT NULL UNIQUE,
  results_json   LONGTEXT NOT NULL,
  published_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES auction_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- 11. PARTICIPANT ACTIVITIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participant_activities (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  team_id      BIGINT UNSIGNED NOT NULL,
  action_type  ENUM('LOGIN', 'ENTER_AUCTION', 'LEAVE_AUCTION', 'PLACE_BID', 'REQUEST_HELP', 'RESOLVE_HELP', 'HEARTBEAT') NOT NULL,
  details      VARCHAR(255) NULL,
  ip_address   VARCHAR(50) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  INDEX idx_activities_team    (team_id),
  INDEX idx_activities_action  (action_type),
  INDEX idx_activities_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- Foreign key: players.sold_to_team_id → teams.id
-- (Must be added after teams table exists)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE players
  ADD CONSTRAINT fk_players_sold_to_team
  FOREIGN KEY (sold_to_team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- DEFAULT ORGANIZER ACCOUNTS (Passwords seeded by server/src/db/seedOrganizers.ts)
-- Demo credentials (bcrypt hashed at server startup):
--   Admin     : admin          / Admin@ZenTriX26
--   Auctioneer: auctioneer     / Auction@ZenTriX26
--   Volunteer : volunteer      / Volunteer@ZenTriX26
-- ─────────────────────────────────────────────────────────────
-- NOTE: Passwords are bcrypt-hashed automatically at startup.
-- Do NOT insert plain passwords here.

-- ─────────────────────────────────────────────────────────────
-- RBAC PERMISSION MATRIX (Reference)
-- ─────────────────────────────────────────────────────────────
-- Route / Capability              | Admin | Auctioneer | Volunteer
-- ─────────────────────────────────────────────────────────────
-- GET  /api/teams                 |   ✓   |     ✓      |    ✓
-- GET  /api/players               |   ✓   |     ✓      |    ✓
-- GET  /api/auction/state         |   ✓   |     ✓      |    ✓  (public)
-- PATCH /api/teams/:id/check-in   |   ✓   |     ✓      |    ✗
-- POST  /api/teams                |   ✓   |     ✗      |    ✗
-- PUT   /api/teams/:id            |   ✓   |     ✗      |    ✗
-- DELETE /api/teams/:id           |   ✓   |     ✗      |    ✗
-- POST   /api/players/import      |   ✓   |     ✓      |    ✗
-- PUT    /api/players/:id         |   ✓   |     ✓      |    ✗
-- DELETE /api/players/:id         |   ✓   |     ✗      |    ✗
-- POST   /api/auction/start       |   ✓   |     ✓      |    ✗
-- POST   /api/auction/bid         |   ✓   |     ✓      |    ✗
-- POST   /api/auction/sold        |   ✓   |     ✓      |    ✗
-- POST   /api/auction/unsold      |   ✓   |     ✓      |    ✗
-- POST   /api/auction/publish-results |   ✓   |     ✗  |    ✗
-- GET    /api/auth/users          |   ✓   |     ✗      |    ✗
-- POST   /api/auth/users          |   ✓   |     ✗      |    ✗
-- DELETE /api/auth/users/:id      |   ✓   |     ✗      |    ✗
-- ─────────────────────────────────────────────────────────────

SELECT 'Database schema setup complete. Run the server to seed default organizer accounts.' AS Status;

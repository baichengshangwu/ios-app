-- D1 Schema Migration for zhitongwang.cn
-- Run in Cloudflare D1 Console or via wrangler d1 execute

-- Users table: core authentication and balance tracking
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pass TEXT NOT NULL,
  ac_balance REAL DEFAULT 1000,
  cny_balance REAL DEFAULT 0,
  usd_balance REAL DEFAULT 0,
  total_recharge REAL DEFAULT 0,
  wallet TEXT DEFAULT '',
  kyc TEXT DEFAULT 'Bronze',
  bio TEXT DEFAULT '',
  joined TEXT DEFAULT '',
  ref TEXT DEFAULT '',
  addr TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  user_api_key TEXT DEFAULT '',
  member_level TEXT DEFAULT 'normal'
);

-- Model usage tracking
CREATE TABLE IF NOT EXISTS model_usage (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  model_id TEXT,
  model_name TEXT,
  vendor TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd REAL DEFAULT 0,
  ac_deducted REAL DEFAULT 0,
  ac_balance_after REAL,
  cny_deducted REAL DEFAULT 0,
  cny_balance_after REAL,
  usd_deducted REAL DEFAULT 0,
  usd_balance_after REAL,
  exchange_rate REAL DEFAULT 0.00147,
  created_at TEXT
);

-- Forum posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY,
  author_email TEXT,
  author_name TEXT,
  title TEXT,
  content TEXT,
  tags TEXT,
  category TEXT DEFAULT 'general',
  image_url TEXT,
  video_url TEXT,
  audio_url TEXT,
  likes INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  pinned INTEGER DEFAULT 0,
  locked INTEGER DEFAULT 0
);

-- Forum comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  author_email TEXT,
  author_name TEXT,
  content TEXT,
  created_at TEXT
);

-- Social features
CREATE TABLE IF NOT EXISTS friends (
  user_email TEXT,
  friend_email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT,
  PRIMARY KEY (user_email, friend_email)
);

-- Recharge records
CREATE TABLE IF NOT EXISTS recharge_records (
  id TEXT PRIMARY KEY,
  user_email TEXT,
  amount_cny REAL DEFAULT 0,
  amount_usd REAL DEFAULT 0,
  ac_credited REAL DEFAULT 0,
  payment_type TEXT,
  out_trade_no TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT
);

-- Verification codes (for email verification)
CREATE TABLE IF NOT EXISTS verify_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_model_usage_user ON model_usage(user_email);
CREATE INDEX IF NOT EXISTS idx_model_usage_created ON model_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_recharge_user ON recharge_records(user_email);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'caregiver', 'member')),
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active')),
  created_at TIMESTAMPTZ NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS household_members_household_idx
  ON household_members (household_id);

CREATE TABLE IF NOT EXISTS household_invites (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('caregiver', 'member')),
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'revoked', 'expired')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS household_invites_household_idx
  ON household_invites (household_id);

CREATE TABLE IF NOT EXISTS moods (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  replied_at TIMESTAMPTZ,
  reply_status TEXT NOT NULL DEFAULT 'pending' CHECK (reply_status IN ('pending', 'ignored', 'replied'))
);

CREATE INDEX IF NOT EXISTS moods_household_created_idx
  ON moods (household_id, created_at DESC);

CREATE INDEX IF NOT EXISTS moods_user_created_idx
  ON moods (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mood_replies (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  mood_id TEXT NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
  recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mood_replies_mood_created_idx
  ON mood_replies (mood_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mood_replies_recipient_read_idx
  ON mood_replies (recipient_user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS custom_moods (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS custom_categories (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  category_id TEXT NOT NULL,
  category_label TEXT NOT NULL,
  category_icon TEXT NOT NULL,
  note TEXT,
  spent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS expenses_user_spent_idx
  ON expenses (user_id, spent_at DESC);

CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  streak_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  plant_stage TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS checkins_user_date_idx
  ON checkins (user_id, checkin_date DESC);

CREATE TABLE IF NOT EXISTS app_updates (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  apk_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL
);

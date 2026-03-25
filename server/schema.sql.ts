export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  city TEXT,
  country TEXT,
  graduation_year INTEGER,
  job_title TEXT,
  company TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_public INTEGER DEFAULT 1,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  is_remote INTEGER DEFAULT 0,
  is_entrepreneur INTEGER DEFAULT 0,
  is_ise_champion INTEGER DEFAULT 0,
  msc INTEGER DEFAULT 0,
  user_type TEXT DEFAULT 'Alum',
  professional_status TEXT DEFAULT 'open_to_work',
  cohort INTEGER,
  removed INTEGER DEFAULT 0,
  lat REAL,
  lng REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_removed ON profiles(removed);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort ON profiles(cohort);

CREATE TABLE IF NOT EXISTS profiles_history (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_title TEXT,
  company TEXT,
  city TEXT,
  country TEXT,
  professional_status TEXT,
  is_remote INTEGER,
  is_ise_champion INTEGER,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  change_type TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_profiles_history_profile_id ON profiles_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_profiles_history_changed_at ON profiles_history(changed_at);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#3b82f6',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  location TEXT,
  location_url TEXT,
  registration_url TEXT,
  start_at TEXT NOT NULL,
  end_at TEXT,
  organiser_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

CREATE TABLE IF NOT EXISTS event_tags (
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_event_tags_event_id ON event_tags(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tags_tag_id ON event_tags(tag_id);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  external_url TEXT,
  deadline TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_deadline ON announcements(deadline);

CREATE TABLE IF NOT EXISTS announcement_tags (
  announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_announcement_tags_announcement_id ON announcement_tags(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_tags_tag_id ON announcement_tags(tag_id);

CREATE TABLE IF NOT EXISTS residency_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_residency_partners_name ON residency_partners(name);
CREATE INDEX IF NOT EXISTS idx_residency_partners_is_active ON residency_partners(is_active);

CREATE TABLE IF NOT EXISTS residencies (
  id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES residency_partners(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_residencies_user_id ON residencies(user_id);
CREATE INDEX IF NOT EXISTS idx_residencies_company_id ON residencies(company_id);
CREATE INDEX IF NOT EXISTS idx_residencies_phase ON residencies(phase);
CREATE UNIQUE INDEX IF NOT EXISTS idx_residencies_unique_phase_user ON residencies(phase, user_id);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  reminder_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_at ON reminders(reminder_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_unique_user_target ON reminders(user_id, target_type, target_id);
`;

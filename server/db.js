const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new DatabaseSync(path.join(dbDir, 'reachout.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT,
  location TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  job_title TEXT,
  company TEXT,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  where_met TEXT,
  date_met TEXT,
  notes TEXT,
  linkedin_url TEXT,
  email TEXT,
  photo_path TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT,
  sent_at TEXT,
  response_note TEXT,
  generated_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
)`);

db.exec(`CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  user_name TEXT DEFAULT '',
  user_title TEXT DEFAULT '',
  user_company TEXT DEFAULT '',
  user_linkedin TEXT DEFAULT '',
  message_tone TEXT DEFAULT 'Warm & casual',
  reminder_frequency TEXT DEFAULT 'weekly',
  email_reminders INTEGER DEFAULT 0,
  reminder_email TEXT DEFAULT '',
  smtp_host TEXT DEFAULT '',
  smtp_port INTEGER DEFAULT 587,
  smtp_user TEXT DEFAULT '',
  smtp_pass TEXT DEFAULT ''
)`);

db.exec(`INSERT OR IGNORE INTO settings (id) VALUES (1)`);

module.exports = db;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'wudid.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Auth tables
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Create tables (with user_id if they don't exist yet)
      db.run(`CREATE TABLE IF NOT EXISTS labels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT NOT NULL,
        name TEXT NOT NULL,
        UNIQUE(date, user_id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS checklist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT NOT NULL,
        text TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        order_idx INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS task_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT NOT NULL,
        text TEXT NOT NULL,
        label_id INTEGER,
        FOREIGN KEY (label_id) REFERENCES labels (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`);

      // Migration
      const migrateTable = (tableName) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
          if (!err && rows && !rows.some(r => r.name === 'user_id')) {
            db.serialize(() => {
              db.run(`ALTER TABLE ${tableName} ADD COLUMN user_id INTEGER`);
              db.run(`UPDATE ${tableName} SET user_id = 1`);
            });
          }
        });
      };
      
      migrateTable('labels');
      migrateTable('checklist_items');
      migrateTable('task_entries');

      // Migrate events properly to update UNIQUE constraint
      db.all(`PRAGMA table_info(events)`, (err, rows) => {
        if (!err && rows && !rows.some(r => r.name === 'user_id')) {
          db.serialize(() => {
            db.run(`CREATE TABLE events_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              date TEXT NOT NULL,
              name TEXT NOT NULL,
              UNIQUE(date, user_id),
              FOREIGN KEY (user_id) REFERENCES users (id)
            )`);
            db.run(`INSERT INTO events_new (id, user_id, date, name) SELECT id, 1, date, name FROM events`);
            db.run(`DROP TABLE events`);
            db.run(`ALTER TABLE events_new RENAME TO events`);
          });
        }
      });
    });
  }
});

// Helper for queries
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getSingle = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = {
  db,
  runQuery,
  getQuery,
  getSingle
};

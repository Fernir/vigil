const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../db/data.sqlite3');
const dbDir = path.dirname(dbPath);

console.log('Initializing database...');
console.log('Database path:', dbPath);

// Create folder if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory');
}

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Create new database
const db = new sqlite3.Database(dbPath);

// Use serialize for sequential execution
db.serialize(() => {
  console.log('Creating tables...');
  
  // Toggle support for foreign keys
  db.run('PRAGMA foreign_keys = ON');
  
  // Table for users
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      webhook_url TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table created');
  });

  // Table for sites
    db.run(`
    CREATE TABLE sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      checkInterval INTEGER DEFAULT 5,
      isActive BOOLEAN DEFAULT 1,
      userId INTEGER,
      check_type TEXT DEFAULT 'http',
      expected_text TEXT,
      text_condition TEXT DEFAULT 'contains',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating sites table:', err);
    else console.log('Sites table created');
  });

  // Table for check results
  db.run(`
    CREATE TABLE check_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteId INTEGER NOT NULL,
      status TEXT CHECK(status IN ('up', 'down', 'degraded')) NOT NULL,
      responseTime INTEGER,
      statusCode INTEGER,
      errorMessage TEXT,
      checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating check_results table:', err);
    else console.log('Check_results table created');
  });

  // Indexes for performance
  db.run(`CREATE INDEX idx_check_results_siteId_checkedAt ON check_results(siteId, checkedAt DESC)`);
  db.run(`CREATE INDEX idx_sites_userId ON sites(userId)`);
  db.run(`CREATE INDEX idx_sites_isActive ON sites(isActive)`);
  
  console.log('Indexes created');


   // Table for SSL checks
  db.run(`
    CREATE TABLE ssl_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteId INTEGER NOT NULL,
      valid BOOLEAN NOT NULL,
      expired BOOLEAN NOT NULL,
      daysLeft INTEGER NOT NULL,
      validFrom DATETIME,
      validTo DATETIME,
      issuer TEXT,
      error TEXT,
      checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating ssl_results table:', err);
    else console.log('SSL_results table created');
  });

 // Table for screenshots
  db.run(`
    CREATE TABLE IF NOT EXISTS screenshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    siteId INTEGER NOT NULL,
    filename TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) console.error('Error creating screenshots table:', err);
    else console.log('screenshots table created');
  });

  db.run(`CREATE INDEX idx_screenshots_siteId_checkedAt ON screenshots(siteId, checkedAt DESC);`);

  // Table for speed check results
  db.run(`
    CREATE TABLE speed_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      siteId INTEGER NOT NULL,
      loadTime INTEGER,
      ttfb INTEGER,
      domContentLoaded INTEGER,
      pageSize INTEGER,
      requestCount INTEGER,
      error TEXT,
      checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('Error creating speed_results table:', err);
    else console.log('Speed_results table created');
  });

  // Indexes for new tables
  db.run(`CREATE INDEX idx_ssl_results_siteId_checkedAt ON ssl_results(siteId, checkedAt DESC);`);
  db.run(`CREATE INDEX idx_speed_results_siteId_checkedAt ON speed_results(siteId, checkedAt DESC);`);
});
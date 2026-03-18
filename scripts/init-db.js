const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../db/data.sqlite3');
const dbDir = path.dirname(dbPath);

console.log('Initializing database...');
console.log('Database path:', dbPath);

// Создаем папку если нет
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory');
}

// Удаляем старую БД если есть
if (fs.existsSync(dbPath)) {
  console.log('Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Создаем новую БД
const db = new sqlite3.Database(dbPath);

// Используем serialize для последовательного выполнения
db.serialize(() => {
  console.log('Creating tables...');
  
  // Включаем поддержку внешних ключей
  db.run('PRAGMA foreign_keys = ON');
  
  // Таблица пользователей
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

  // Таблица сайтов
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

  // Таблица результатов
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

  // Индексы
  db.run(`CREATE INDEX idx_check_results_siteId_checkedAt ON check_results(siteId, checkedAt DESC)`);
  db.run(`CREATE INDEX idx_sites_userId ON sites(userId)`);
  db.run(`CREATE INDEX idx_sites_isActive ON sites(isActive)`);
  
  console.log('Indexes created');


   // Таблица для SSL-проверок
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

  // Таблица для результатов проверки скорости
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

  // Индексы для новых таблиц
  db.run(`CREATE INDEX idx_ssl_results_siteId_checkedAt ON ssl_results(siteId, checkedAt DESC);`);
  db.run(`CREATE INDEX idx_speed_results_siteId_checkedAt ON speed_results(siteId, checkedAt DESC);`);
});
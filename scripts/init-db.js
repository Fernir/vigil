const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../db/data.sqlite3');
const dbDir = path.dirname(dbPath);

console.log('🚀 Initializing database...');
console.log('📁 Database path:', dbPath);

// Создаем папку если нет
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Created database directory');
}

// Удаляем старую БД если есть
if (fs.existsSync(dbPath)) {
  console.log('🗑️ Removing existing database...');
  fs.unlinkSync(dbPath);
}

// Создаем новую БД
const db = new sqlite3.Database(dbPath);

// Используем serialize для последовательного выполнения
db.serialize(() => {
  console.log('📦 Creating tables...');
  
  // Включаем поддержку внешних ключей
  db.run('PRAGMA foreign_keys = ON');
  
  // Таблица пользователей
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      telegramChatId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('❌ Error creating users table:', err);
    else console.log('✅ Users table created');
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
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) console.error('❌ Error creating sites table:', err);
    else console.log('✅ Sites table created');
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
    if (err) console.error('❌ Error creating check_results table:', err);
    else console.log('✅ Check_results table created');
  });

  // Индексы
  db.run(`CREATE INDEX idx_check_results_siteId_checkedAt ON check_results(siteId, checkedAt DESC)`);
  db.run(`CREATE INDEX idx_sites_userId ON sites(userId)`);
  db.run(`CREATE INDEX idx_sites_isActive ON sites(isActive)`);
  
  console.log('✅ Indexes created');

  // Создаем тестового пользователя
  setTimeout(() => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);

    db.run(
      `INSERT INTO users (email, password, telegramChatId, createdAt, updatedAt) 
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      ['admin@example.com', hash, '123456789'],
      function(err) {
        if (err) {
          console.log('⚠️ Error creating test user:', err);
        } else {
          console.log('✅ Test user created: admin@example.com / admin123');
          const userId = this.lastID;
          
          // Добавляем тестовые сайты
          db.run(
            `INSERT INTO sites (name, url, checkInterval, isActive, userId, createdAt, updatedAt) 
             VALUES 
               ('Google', 'https://www.google.com', 5, 1, ?, datetime('now'), datetime('now')),
               ('GitHub', 'https://www.github.com', 5, 1, ?, datetime('now'), datetime('now')),
               ('Stack Overflow', 'https://stackoverflow.com', 5, 1, ?, datetime('now'), datetime('now'))`,
            [userId, userId, userId],
            function(err) {
              if (err) {
                console.error('❌ Error creating sites:', err);
              } else {
                console.log('✅ Test sites created');
              }
            }
          );
        }
      }
    );
  }, 500); // Небольшая задержка для создания таблиц

  // Проверяем результат через 2 секунды
  setTimeout(() => {
    console.log('\n📊 Database summary:');
    
    db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
      if (!err) console.log(`👥 Users: ${rows[0].count}`);
    });
    
    db.all('SELECT COUNT(*) as count FROM sites', (err, rows) => {
      if (!err) console.log(`🌐 Sites: ${rows[0].count}`);
    });
    
    db.all('SELECT COUNT(*) as count FROM check_results', (err, rows) => {
      if (!err) console.log(`📝 Check results: ${rows[0].count}`);
      
      console.log('\n🎉 Database initialization complete!');
      db.close();
    });
  }, 2000);
});
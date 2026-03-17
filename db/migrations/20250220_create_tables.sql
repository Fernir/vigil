-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  telegramChatId TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сайтов
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  checkInterval INTEGER DEFAULT 5,
  isActive BOOLEAN DEFAULT 1,
  userId INTEGER,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица результатов проверок
CREATE TABLE IF NOT EXISTS check_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siteId INTEGER NOT NULL,
  status TEXT CHECK(status IN ('up', 'down', 'degraded')) NOT NULL,
  responseTime INTEGER,
  statusCode INTEGER,
  errorMessage TEXT,
  checkedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
);

-- Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_check_results_siteId_checkedAt ON check_results(siteId, checkedAt DESC);
CREATE INDEX IF NOT EXISTS idx_sites_userId ON sites(userId);
CREATE INDEX IF NOT EXISTS idx_sites_isActive ON sites(isActive);

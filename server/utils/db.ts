import sqlite3 from "sqlite3";
import { resolve } from "path";
import fs from "fs";

// Типы для таблиц
export interface User {
  id: number;
  email: string;
  password: string;
  telegramChatId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: number;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  userId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CheckResult {
  id: number;
  siteId: number;
  status: "up" | "down" | "degraded";
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
  checkedAt: string;
}

// Создаем и экспортируем функцию для получения БД
export const useDB = () => {
  const dbPath = resolve(process.cwd(), "db/data.sqlite3");

  // Проверяем существует ли БД
  if (!fs.existsSync(dbPath)) {
    console.error("❌ Database not found at:", dbPath);
    console.error("💡 Run: npm run db:init");
    throw new Error("Database not initialized");
  }

  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("❌ Database connection error:", err);
      throw err;
    }
  });

  // Включаем поддержку внешних ключей
  db.run("PRAGMA foreign_keys = ON");

  return db;
};

// Промис-обертки для удобства
export const dbGet = <T>(
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result as T);
    });
  });
};

export const dbRun = (
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<{ lastID: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID });
    });
  });
};

export const dbAll = <T>(
  db: sqlite3.Database,
  sql: string,
  params: any[] = [],
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

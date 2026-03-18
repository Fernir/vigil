import sqlite3 from "sqlite3";
import { resolve } from "path";
import fs from "fs";

// Types for tables
export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  webhook_url?: string;
  max_sites: number;
  banned_at: string | null;
  is_admin?: boolean;
}

export interface Site {
  id: number;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  userId?: number;
  check_type?: "http" | "text";
  expected_text?: string | null;
  text_condition?: "contains" | "not_contains";
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

// Make the database available and export the function for getting the DB connection
export const useDB = () => {
  const dbPath = resolve(process.cwd(), "db/data.sqlite3");

  // Check if the database exists
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

  // Toggle support for foreign keys
  db.run("PRAGMA foreign_keys = ON");

  return db;
};

// Promise wrappers for convenience
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

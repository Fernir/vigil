import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// derive SQLite path from env variable and create directory before Prisma initialization
const sqliteUrl = process.env.DATABASE_URL || (process.env.RAILWAY_ENV ? 'file:/tmp/vigil/db/data.sqlite3' : 'file:./db/data.sqlite3');
let dbPath = sqliteUrl.startsWith('file:') ? sqliteUrl.slice(5) : sqliteUrl;

// if relative path, resolve from current working directory
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(process.cwd(), dbPath);
}

// ensure parent directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure Prisma uses this path if no explicit DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${dbPath}`;
}

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

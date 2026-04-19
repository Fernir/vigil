import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const sqliteUrl = process.env.DATABASE_URL || (process.env.RAILWAY_ENV ? 'file:/tmp/vigil/db/data.sqlite3' : 'file:./db/data.sqlite3');
let dbPath = sqliteUrl.startsWith('file:') ? sqliteUrl.slice(5) : sqliteUrl;

if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(process.cwd(), dbPath);
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

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

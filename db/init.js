import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Ensure db folder exists when initializing
const dbDir = path.resolve(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

async function safeDelete(modelName, action) {
  try {
    await action();
  } catch (error) {
    if (error?.code === 'P2021') {
      // Table doesn't exist yet, that's fine on first init
      console.log(`Table ${modelName} does not exist, skipping delete`);
    } else {
      throw error;
    }
  }
}

async function initDatabase() {
  console.log('Initializing database...');

  let prisma;

  try {
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy --schema prisma/schema.prisma', { stdio: 'inherit' });

    prisma = new PrismaClient();

    // Очищаем таблицы в правильном порядке (из-за внешних ключей)
    console.log('Clearing existing data...');
    await safeDelete('speed_results', () => prisma.speed_results.deleteMany());
    await safeDelete('screenshots', () => prisma.screenshots.deleteMany());
    await safeDelete('ssl_results', () => prisma.ssl_results.deleteMany());
    await safeDelete('check_results', () => prisma.check_results.deleteMany());
    await safeDelete('sites', () => prisma.sites.deleteMany());
    await safeDelete('users', () => prisma.users.deleteMany());

    console.log('Data cleared');

    // Создаём администратора
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        is_admin: true,
        max_sites: 100,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log(`Admin created: ${adminEmail}`);

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();

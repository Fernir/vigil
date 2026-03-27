import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('Initializing database...');

  try {
    // Очищаем таблицы в правильном порядке (из-за внешних ключей)
    console.log('Clearing existing data...');
    await prisma.speed_results.deleteMany();
    await prisma.screenshots.deleteMany();
    await prisma.ssl_results.deleteMany();
    await prisma.check_results.deleteMany();
    await prisma.sites.deleteMany();
    await prisma.users.deleteMany();

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

import { execSync } from 'child_process';
import { PrismaClient, Prisma } from '@prisma/client'; // Импортируем пространство имен Prisma
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';

// Используем Prisma.PromiseReturnType или просто Promise<unknown> для экшена
async function safeDelete(modelName: string, action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (error: unknown) {
    // Проверяем, является ли ошибка известной ошибкой Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021') {
        console.log(`Table ${modelName} does not exist, skipping delete`);
        return;
      }
    }
    throw error;
  }
}

async function initDatabase(): Promise<void> {
  console.log('Initializing database...');

  const prisma = new PrismaClient();

  try {
    console.log('Running migrations...');
    execSync('npx prisma migrate deploy --schema prisma/schema.prisma', { stdio: 'inherit' });

    console.log('Clearing existing data...');

    // Теперь используем функции без any
    await safeDelete('speed_results', () => prisma.speed_results.deleteMany());
    await safeDelete('screenshots', () => prisma.screenshots.deleteMany());
    await safeDelete('ssl_results', () => prisma.ssl_results.deleteMany());
    await safeDelete('check_results', () => prisma.check_results.deleteMany());
    await safeDelete('sites', () => prisma.sites.deleteMany());
    await safeDelete('users', () => prisma.users.deleteMany());

    console.log('Data cleared');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.users.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
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
      console.log(`Admin created: ${admin.email}`);
    } else {
      console.log(`Admin already exists: ${adminEmail}`);
    }

    console.log('Database initialization complete!');
  } catch (error: unknown) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Запуск с обработкой ошибок верхнего уровня
initDatabase().catch((err) => {
  console.error(err);
  process.exit(1);
});

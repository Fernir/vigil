import 'dotenv/config';

export const adminUser = {
  email: process.env.ADMIN_EMAIL || 'admin@admin.com',
  password: process.env.ADMIN_PASSWORD || '5632120',
};

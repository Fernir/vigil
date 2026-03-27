import { test, expect } from '@playwright/test';
import { adminUser } from './fixtures/testData';

test.describe('API Endpoints', () => {
  let authToken: string;

  test.beforeEach(async ({ request }) => {
    // Login to get token
    const response = await request.post('/api/auth/login', {
      data: {
        email: adminUser.email,
        password: adminUser.password,
      },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();

    authToken = data.token;
  });

  test('GET /api/status should return sites', async ({ request }) => {
    const response = await request.get('/api/status', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /api/stats should return statistics', async ({ request }) => {
    const response = await request.get('/api/stats', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('operational');
    expect(data).toHaveProperty('overallUptime');
  });

  test('POST /api/auth/login should return token', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: adminUser.email,
        password: adminUser.password,
      },
    });
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('user');
  });

  test('POST /api/auth/login with invalid credentials should return 401', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'wrong@example.com',
        password: 'wrongwrong',
      },
    });
    expect(response.status()).toBe(401);
  });

  test('GET /api/sites should require authentication', async ({ request }) => {
    const response = await request.get('/api/sites');
    expect(response.status()).toBe(401);
  });
});

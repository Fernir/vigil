export const testSite = {
  name: "Test Site",
  url: "https://httpbin.org/status/200",
  interval: 60,
  checkType: "http",
};

export const testTextSite = {
  name: "Text Check Site",
  url: "https://httpbin.org/html",
  interval: 60,
  checkType: "text",
  expectedText: "<html",
};

export const testUser = {
  email: "test@example.com",
  password: "test123",
};

export const adminUser = {
  email: process.env.ADMIN_EMAIL || "admin@admin.com",
  password: process.env.ADMIN_PASSWORD || "111111",
};

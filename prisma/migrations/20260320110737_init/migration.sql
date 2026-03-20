-- CreateTable
CREATE TABLE "check_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" INTEGER,
    "status" TEXT NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "checked_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "knex_migrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "batch" INTEGER,
    "migration_time" DATETIME
);

-- CreateTable
CREATE TABLE "knex_migrations_lock" (
    "index" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "is_locked" INTEGER
);

-- CreateTable
CREATE TABLE "screenshots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" INTEGER,
    "image_data" BLOB,
    "width" INTEGER,
    "height" INTEGER,
    "checked_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "screenshots_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "sites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "checkInterval" INTEGER DEFAULT 5,
    "isActive" BOOLEAN DEFAULT true,
    "userId" INTEGER,
    "check_type" TEXT DEFAULT 'http',
    "expected_text" TEXT,
    "text_condition" TEXT DEFAULT 'contains',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "speed_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" INTEGER,
    "loadTime" INTEGER,
    "ttfb" INTEGER,
    "domContentLoaded" INTEGER,
    "pageSize" INTEGER,
    "requestCount" INTEGER,
    "error" TEXT,
    "checked_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "speed_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ssl_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" INTEGER,
    "valid" BOOLEAN NOT NULL,
    "expired" BOOLEAN NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "issuer" TEXT,
    "error" TEXT,
    "checked_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ssl_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "webhook_url" TEXT,
    "is_admin" BOOLEAN DEFAULT false,
    "max_sites" INTEGER DEFAULT 4,
    "banned_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "check_results_siteid_checked_at_index" ON "check_results"("siteId", "checked_at");

-- CreateIndex
CREATE INDEX "screenshots_siteid_checked_at_index" ON "screenshots"("siteId", "checked_at");

-- CreateIndex
CREATE INDEX "speed_results_siteid_checked_at_index" ON "speed_results"("siteId", "checked_at");

-- CreateIndex
CREATE INDEX "ssl_results_siteid_checked_at_index" ON "ssl_results"("siteId", "checked_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- CreateTable
CREATE TABLE "check_results" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER,
    "status" TEXT NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "checked_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knex_migrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "batch" INTEGER,
    "migration_time" TIMESTAMP(3),

    CONSTRAINT "knex_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knex_migrations_lock" (
    "index" SERIAL NOT NULL,
    "is_locked" INTEGER,

    CONSTRAINT "knex_migrations_lock_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "screenshots" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER,
    "image_data" BYTEA,
    "width" INTEGER,
    "height" INTEGER,
    "checked_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screenshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "checkInterval" INTEGER DEFAULT 5,
    "isActive" BOOLEAN DEFAULT true,
    "userId" INTEGER,
    "check_type" TEXT DEFAULT 'http',
    "expected_text" TEXT,
    "text_condition" TEXT DEFAULT 'contains',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "speed_results" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER,
    "loadTime" INTEGER,
    "ttfb" INTEGER,
    "domContentLoaded" INTEGER,
    "pageSize" INTEGER,
    "requestCount" INTEGER,
    "error" TEXT,
    "checked_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "speed_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ssl_results" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER,
    "valid" BOOLEAN NOT NULL,
    "expired" BOOLEAN NOT NULL,
    "daysLeft" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "issuer" TEXT,
    "error" TEXT,
    "checked_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ssl_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "webhook_url" TEXT,
    "is_admin" BOOLEAN DEFAULT false,
    "max_sites" INTEGER DEFAULT 4,
    "banned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "check_results" ADD CONSTRAINT "check_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "speed_results" ADD CONSTRAINT "speed_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ssl_results" ADD CONSTRAINT "ssl_results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

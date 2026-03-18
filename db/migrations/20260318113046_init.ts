import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.string("webhook_url");
    table.boolean("is_admin").defaultTo(false);
    table.integer("max_sites").defaultTo(4);
    table.timestamp("banned_at").nullable();
    table.timestamps(true, true);
  });

  // Sites table
  await knex.schema.createTable("sites", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("url").notNullable();
    table.integer("checkInterval").defaultTo(5);
    table.boolean("isActive").defaultTo(true);
    table
      .integer("userId")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("check_type").defaultTo("http");
    table.string("expected_text");
    table.string("text_condition").defaultTo("contains");
    table.timestamps(true, true);
  });

  // Check results table
  await knex.schema.createTable("check_results", (table) => {
    table.increments("id").primary();
    table
      .integer("siteId")
      .unsigned()
      .references("id")
      .inTable("sites")
      .onDelete("CASCADE");
    table.enum("status", ["up", "down", "degraded"]).notNullable();
    table.integer("responseTime");
    table.integer("statusCode");
    table.text("errorMessage");
    table.timestamp("checked_at").defaultTo(knex.fn.now());
    table.index(["siteId", "checked_at"]);
  });

  // SSL results table
  await knex.schema.createTable("ssl_results", (table) => {
    table.increments("id").primary();
    table
      .integer("siteId")
      .unsigned()
      .references("id")
      .inTable("sites")
      .onDelete("CASCADE");
    table.boolean("valid").notNullable();
    table.boolean("expired").notNullable();
    table.integer("daysLeft").notNullable();
    table.timestamp("validFrom");
    table.timestamp("validTo");
    table.string("issuer");
    table.text("error");
    table.timestamp("checked_at").defaultTo(knex.fn.now());
    table.index(["siteId", "checked_at"]);
  });

  // Screenshots table
  await knex.schema.createTable("screenshots", (table) => {
    table.increments("id").primary();
    table
      .integer("siteId")
      .unsigned()
      .references("id")
      .inTable("sites")
      .onDelete("CASCADE");
    table.string("filename").notNullable();
    table.integer("width");
    table.integer("height");
    table.timestamp("checked_at").defaultTo(knex.fn.now());
    table.index(["siteId", "checked_at"]);
  });

  // Speed results table
  await knex.schema.createTable("speed_results", (table) => {
    table.increments("id").primary();
    table
      .integer("siteId")
      .unsigned()
      .references("id")
      .inTable("sites")
      .onDelete("CASCADE");
    table.integer("loadTime");
    table.integer("ttfb");
    table.integer("domContentLoaded");
    table.integer("pageSize");
    table.integer("requestCount");
    table.text("error");
    table.timestamp("checked_at").defaultTo(knex.fn.now());
    table.index(["siteId", "checked_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Delete tables in the correct order to avoid foreign key constraint issues
  await knex.schema.dropTableIfExists("speed_results");
  await knex.schema.dropTableIfExists("screenshots");
  await knex.schema.dropTableIfExists("ssl_results");
  await knex.schema.dropTableIfExists("check_results");
  await knex.schema.dropTableIfExists("sites");
  await knex.schema.dropTableIfExists("users");
}

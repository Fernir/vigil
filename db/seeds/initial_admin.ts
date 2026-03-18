import type { Knex } from "knex";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Загружаем переменные из .env
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

export async function seed(knex: Knex): Promise<void> {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    throw new Error("Admin credentials not provided");
  }

  // Clear tables in the correct order to avoid foreign key constraint issues
  await knex("screenshots").del();
  await knex("speed_results").del();
  await knex("ssl_results").del();
  await knex("check_results").del();
  await knex("sites").del();
  await knex("users").del();

  // Create admin user with credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await knex("users")
    .insert({
      email: adminEmail,
      password: hashedPassword,
      webhook_url: null,
      is_admin: true,
      max_sites: 100,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning("id");

  console.log(`Admin created: ${adminEmail}`);
}

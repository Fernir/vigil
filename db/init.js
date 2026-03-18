const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("Initializing database...");

// Path to DB
const dbPath = path.resolve(__dirname, "./data.sqlite3");
const dbDir = path.dirname(dbPath);

// Create directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log("Created database directory");
}

// Delete existing database file if it exists
if (fs.existsSync(dbPath)) {
  console.log("Removing existing database...");
  fs.unlinkSync(dbPath);
}

// Create empty database file (Knex will create it, but for certainty we create it here)
fs.writeFileSync(dbPath, "");
console.log("Empty database file created");

// Run migrations
try {
  console.log("Running migrations...");
  execSync("npx knex migrate:latest --knexfile ./knexfile.ts", {
    stdio: "inherit",
    cwd: path.resolve(__dirname),
  });
  console.log("Migrations completed");
} catch (error) {
  console.error("Migrations failed:", error);
  process.exit(1);
}

// Run seeds
try {
  console.log("Running seeds...");
  execSync("npx knex seed:run --knexfile ./knexfile.ts", {
    stdio: "inherit",
    cwd: path.resolve(__dirname),
  });
  console.log("Seeds completed");
} catch (error) {
  console.error("Seeds failed:", error);
  process.exit(1);
}

console.log("Database initialization complete!");

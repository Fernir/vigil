import type { Knex } from "knex";
import { resolve } from "path";

const projectRoot = process.cwd();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: resolve(projectRoot, "data.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: resolve(projectRoot, "migrations"),
      extension: "ts",
    },
    seeds: {
      directory: resolve(projectRoot, "seeds"),
      extension: "ts",
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: resolve(projectRoot, "data.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: resolve(projectRoot, "migrations"),
      extension: "ts",
    },
  },
};

export default config;

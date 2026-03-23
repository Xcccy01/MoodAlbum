import { createConfig } from "../server/config/env.js";
import { createDatabase } from "../server/db/client.js";
import { runMigrations } from "../server/db/migrate.js";

async function main() {
  const config = createConfig({ preferMigrationUrl: true });

  if (!config.databaseUrl) {
    throw new Error("运行迁移前必须设置 DATABASE_URL 或 DATABASE_MIGRATION_URL。");
  }

  const database = await createDatabase(config);
  await runMigrations(database);
  console.log("Database migrations completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createConfig } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { runMigrations } from "./db/migrate.js";

async function main() {
  const config = createConfig();
  const database = await createDatabase(config);
  await runMigrations(database);

  const app = createApp({ config, database });
  const server = createServer(app);

  server.listen(config.port, () => {
    const databaseLabel = config.databaseUrl ? "postgresql" : "in-memory postgres";
    console.log(`MoodAlbum public server listening on ${config.port} (${databaseLabel})`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

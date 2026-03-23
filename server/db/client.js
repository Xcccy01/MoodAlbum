import { Pool } from "pg";
import { newDb } from "pg-mem";

export async function createDatabase(config) {
  let pool;

  if (config.databaseUrl) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
    });
  } else {
    const memoryDatabase = newDb({
      autoCreateForeignKeyIndices: true,
    });
    const adapter = memoryDatabase.adapters.createPg();
    pool = new adapter.Pool();
  }

  await pool.query("SELECT 1");

  return {
    pool,
    query(text, params = []) {
      return pool.query(text, params);
    },
    async transaction(run) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await run(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

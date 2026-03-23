import { createConfig } from "../server/config/env.js";
import { createDatabase } from "../server/db/client.js";

const REQUIRED_PRIVILEGES = {
  users: ["SELECT", "INSERT"],
  households: ["SELECT", "INSERT"],
  household_members: ["SELECT", "INSERT"],
  household_invites: ["SELECT", "INSERT", "UPDATE"],
  moods: ["SELECT", "INSERT", "UPDATE"],
  mood_replies: ["SELECT", "INSERT", "UPDATE"],
  custom_moods: ["SELECT", "INSERT", "UPDATE"],
  custom_categories: ["SELECT", "INSERT", "UPDATE"],
  expenses: ["SELECT", "INSERT", "DELETE"],
  checkins: ["SELECT", "INSERT"],
  app_updates: ["SELECT", "INSERT", "UPDATE"],
};

async function main() {
  const config = createConfig();

  if (!config.databaseUrl) {
    throw new Error("生产环境自检要求 DATABASE_URL 指向真实 PostgreSQL。");
  }

  const database = await createDatabase(config);

  const roleResult = await database.query(`
    SELECT
      current_user AS current_user,
      current_database() AS current_database,
      r.rolsuper,
      r.rolcreaterole,
      r.rolcreatedb,
      has_schema_privilege(current_user, 'public', 'USAGE') AS has_public_usage,
      has_schema_privilege(current_user, 'public', 'CREATE') AS has_public_create,
      has_database_privilege(current_user, current_database(), 'CONNECT') AS has_db_connect,
      has_database_privilege(current_user, current_database(), 'CREATE') AS has_db_create
    FROM pg_roles r
    WHERE r.rolname = current_user
  `);

  const role = roleResult.rows[0];
  const failures = [];

  if (!role) {
    failures.push("无法读取当前 PostgreSQL 角色信息。");
  } else {
    if (role.rolsuper) {
      failures.push("生产环境应用角色不应为 superuser。");
    }
    if (role.rolcreaterole) {
      failures.push("生产环境应用角色不应拥有 CREATEROLE。");
    }
    if (role.rolcreatedb) {
      failures.push("生产环境应用角色不应拥有 CREATEDB。");
    }
    if (!role.has_public_usage) {
      failures.push("当前角色缺少 public schema 的 USAGE 权限。");
    }
    if (role.has_public_create) {
      failures.push("当前角色仍然拥有 public schema 的 CREATE 权限，应收紧。");
    }
    if (!role.has_db_connect) {
      failures.push("当前角色缺少数据库 CONNECT 权限。");
    }
    if (role.has_db_create) {
      failures.push("当前角色仍然拥有数据库 CREATE 权限，应收紧。");
    }
  }

  if (config.runMigrationsOnBoot) {
    failures.push("生产环境建议将 RUN_MIGRATIONS 设为 false，并改为部署前显式执行 npm run db:migrate。");
  }

  for (const [tableName, privileges] of Object.entries(REQUIRED_PRIVILEGES)) {
    for (const privilege of privileges) {
      const result = await database.query(
        "SELECT has_table_privilege(current_user, $1, $2) AS allowed",
        [tableName, privilege]
      );
      if (!result.rows[0]?.allowed) {
        failures.push(`当前角色缺少 ${tableName} 的 ${privilege} 权限。`);
      }
    }
  }

  if (failures.length) {
    console.error("PostgreSQL production check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("PostgreSQL production check passed.");
  console.log(`role=${role.current_user} database=${role.current_database}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

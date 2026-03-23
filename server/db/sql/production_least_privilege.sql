-- 生产环境建议分成两个数据库角色：
-- 1. moodalbum_migrator: 只在部署时运行 npm run db:migrate
-- 2. moodalbum_runtime: 只给应用运行时最小权限
--
-- 请先把下面的数据库名和用户名替换成你自己的实际值。

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON DATABASE moodalbum_public FROM PUBLIC;

GRANT CONNECT ON DATABASE moodalbum_public TO moodalbum_runtime;
GRANT USAGE ON SCHEMA public TO moodalbum_runtime;

GRANT SELECT, INSERT ON TABLE users TO moodalbum_runtime;
GRANT SELECT, INSERT ON TABLE households TO moodalbum_runtime;
GRANT SELECT, INSERT ON TABLE household_members TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE household_invites TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE moods TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE mood_replies TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE custom_moods TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE custom_categories TO moodalbum_runtime;
GRANT SELECT, INSERT, DELETE ON TABLE expenses TO moodalbum_runtime;
GRANT SELECT, INSERT ON TABLE checkins TO moodalbum_runtime;
GRANT SELECT, INSERT, UPDATE ON TABLE app_updates TO moodalbum_runtime;

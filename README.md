<p align="center">
  <img src="public/icon-192.png" width="80" />
</p>

<h1 align="center">MoodAlbum 🌿</h1>

<p align="center">
  <b>情感链接</b><br/>
  <i>一个温暖的小工具，让家人之间的关心变得更简单</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" />
  <img src="https://img.shields.io/badge/Express-4-000?logo=express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

<p align="center">
  <a href="./README_EN.md">🌐 English Version</a>
</p>

---

## 这是什么？

你有没有觉得，和家里的长辈或者小朋友之间，其实不需要每天打电话、不需要事无巨细地汇报生活，但你又确实想知道他们今天过得怎么样？

MoodAlbum 就是为这种 **“不用太紧密、但一直都在”** 的情感连接而生的。

这个版本是公开版架构：用户可以自己注册账号、创建家庭、邀请家人加入，并通过独立的 `/care` 回复端查看和回复家庭成员的心情。不同家庭之间的数据完全隔离。

---

## 功能特色

### ❤️ · 心情记录

记录今天的心情，比如开心、有点累、想休息，也可以自定义心情。家人回复后，你会在自己的记录页里收到温和提醒。

### 🌿 · 养生打卡

每日打卡会慢慢养出一棵小植物：从种子到发芽，再到开花。每次回来都能看到一点点积累后的变化。

### 📒 · 记账本

简单好用的记账本，买菜、水果、出行等支出都能记下来，并自动整理成按月明细和分类汇总。

### 🏠 · 家庭空间

一个账号只属于一个家庭。创建家庭的人自动成为 `owner`，家人可以通过邀请码加入成为 `member` 或 `caregiver`。

### 💌 · 家人回复端

`owner` 和 `caregiver` 可以访问 `/care`，查看本家庭成员的心情动态、发布回复、管理邀请码。`member` 只能查看和编辑自己的数据。

---

## 界面预览

<table align="center">
  <tr>
    <td align="center">
      <img src="docs/readme-images/demo-mood-home.jpg" alt="心情主页" width="220" /><br/>
      <sub>心情主页</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-mood-toast.jpg" alt="记录成功弹层" width="220" /><br/>
      <sub>记录成功弹层</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-wellness.jpg" alt="养生打卡页" width="220" /><br/>
      <sub>养生打卡页</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/readme-images/demo-expense-entry.jpg" alt="记账录入" width="220" /><br/>
      <sub>记账录入</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-expense-detail.jpg" alt="记账明细" width="220" /><br/>
      <sub>记账明细</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-expense-summary.jpg" alt="记账汇总" width="220" /><br/>
      <sub>记账汇总</sub>
    </td>
  </tr>
</table>

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 18 + Vite 6 + Recharts |
| 后端 | Express 4 + PostgreSQL 16 |
| 移动端 | Capacitor 8 (Android) |
| 样式 | 模块化手写 CSS |
| 测试 | Playwright E2E + Autocannon |

---

## 快速开始

```bash
git clone https://github.com/Xcccy01/MoodAlbum.git
cd MoodAlbum

npm install
cp .env.example .env

# 开发模式
npm run dev
```

默认打开 http://localhost:5173。

`.env` 里建议至少设置：

```env
NODE_ENV=development
DATABASE_URL=
DATABASE_MIGRATION_URL=
SESSION_SECRET=change-me
PLATFORM_ADMIN_SECRET=
RUN_MIGRATIONS=true
PORT=8787
```

本地如果没有配置 `DATABASE_URL`，开发环境会自动回退到内存版 PostgreSQL 适配，便于快速体验；正式部署必须使用真实 PostgreSQL。

---

## 公开版部署

推荐环境：
- Ubuntu 22.04 或 24.04
- Node.js 22 LTS
- PostgreSQL 16
- Nginx
- systemd
- HTTPS（建议 Certbot）

### 1. 安装依赖

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx postgresql postgresql-contrib
node -v
psql --version
```

### 2. 创建数据库

```bash
sudo -u postgres psql
CREATE DATABASE moodalbum_public;
CREATE USER moodalbum WITH ENCRYPTED PASSWORD '请换成强密码';
GRANT ALL PRIVILEGES ON DATABASE moodalbum_public TO moodalbum;
\q
```

### 3. 部署代码

```bash
mkdir -p /home/ubuntu/family-care-app
cd /home/ubuntu/family-care-app
git clone https://github.com/Xcccy01/MoodAlbum.git .
npm install
npm run build
cp .env.example .env
```

编辑 `.env`：

```env
NODE_ENV=production
DATABASE_URL=postgres://moodalbum:你的数据库密码@127.0.0.1:5432/moodalbum_public
DATABASE_MIGRATION_URL=postgres://moodalbum_migrator:迁移账号密码@127.0.0.1:5432/moodalbum_public
SESSION_SECRET=一串足够长的随机字符
PLATFORM_ADMIN_SECRET=
RUN_MIGRATIONS=false
PORT=8787
```

说明：
- `DATABASE_URL` 给应用运行时使用，建议绑定最小权限角色
- `DATABASE_MIGRATION_URL` 只在部署时执行迁移，建议绑定较高权限角色
- `PLATFORM_ADMIN_SECRET` 留空时，平台更新发布接口会保持关闭，运行时角色只需对 `app_updates` 保留只读权限
- 生产环境建议把 `RUN_MIGRATIONS=false`
- 生产环境要显式设置 `NODE_ENV=production`，否则 `Secure` Cookie 和生产配置校验不会生效

### 4. 试运行

```bash
npm run db:migrate
npm run db:check
node server/index.js
```

如果看到 `MoodAlbum public server listening on 8787`，说明迁移和服务已经正常启动。

### 5. 配置 systemd

```bash
sudo tee /etc/systemd/system/family-care-app.service > /dev/null <<'EOF'
[Unit]
Description=MoodAlbum Public App
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/family-care-app
EnvironmentFile=/home/ubuntu/family-care-app/.env
ExecStart=/usr/bin/node /home/ubuntu/family-care-app/server/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable family-care-app
sudo systemctl start family-care-app
sudo systemctl status family-care-app
```

### 6. 配置 Nginx

```bash
sudo tee /etc/nginx/sites-available/family-care-app > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/family-care-app /etc/nginx/sites-enabled/family-care-app
sudo nginx -t
sudo systemctl restart nginx
```

### 7. HTTPS 与备份

建议至少补这两件事：
- 用 Certbot 给 Nginx 配好 HTTPS，生产环境 cookie 才会带 `Secure`
- 每天做一次 `pg_dump`，至少保留 7 天

最小权限 SQL 模板见：
- `server/db/sql/production_least_privilege.sql`

备份示例：

```bash
pg_dump "$DATABASE_URL" > /home/ubuntu/backups/moodalbum-$(date +%F).sql
```

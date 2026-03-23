<p align="center">
  <img src="public/icon-192.png" width="80" />
</p>

<h1 align="center">MoodAlbum 🌿</h1>

<p align="center">
  <b>Emotional Connection</b><br/>
  <i>A soft, warm little app for sharing feelings across generations</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" />
  <img src="https://img.shields.io/badge/Express-4-000?logo=express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

<p align="center">
  <a href="./README.md">🇨🇳 中文版</a>
</p>

---

## What is this?

Ever felt like you want to stay connected with grandparents or little ones, but not in a “call me every day” kind of way?

MoodAlbum is built for that gentle **“I’m here even if I don’t say much”** kind of bond.

This version is the public multi-household architecture: people can sign up, create a household, invite family members, and use a dedicated `/care` portal for replies. Data is isolated at the household level.

---

## Features

### ❤️ · Mood Logging

Log today’s mood such as happy, tired, or needing rest. You can create custom moods too. Family replies come back as gentle notifications in your own timeline.

### 🌿 · Wellness Check-in

Daily check-ins slowly grow a plant from seed to sprout to bloom, giving the user a soft sense of progress.

### 📒 · Expense Tracking

A simple expense journal for groceries, fruit, transport, and more, with monthly detail and category summaries.

### 🏠 · Household Space

Each account belongs to exactly one household. The creator becomes the `owner`, and invited relatives can join as `member` or `caregiver`.

### 💌 · Care Portal

`owner` and `caregiver` can open `/care` to review family moods, send replies, and manage invite codes. `member` users only see and edit their own data.

---

## Screenshots

<table align="center">
  <tr>
    <td align="center">
      <img src="docs/readme-images/demo-mood-home.jpg" alt="Mood home screen" width="220" /><br/>
      <sub>Mood Home</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-mood-toast.jpg" alt="Mood record success toast" width="220" /><br/>
      <sub>Record Success</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-wellness.jpg" alt="Wellness check-in screen" width="220" /><br/>
      <sub>Wellness Check-in</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/readme-images/demo-expense-entry.jpg" alt="Expense entry screen" width="220" /><br/>
      <sub>Expense Entry</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-expense-detail.jpg" alt="Expense detail screen" width="220" /><br/>
      <sub>Expense Detail</sub>
    </td>
    <td align="center">
      <img src="docs/readme-images/demo-expense-summary.jpg" alt="Expense summary screen" width="220" /><br/>
      <sub>Expense Summary</sub>
    </td>
  </tr>
</table>

---

## Tech Stack

| Layer | What |
|---|---|
| Frontend | React 18 + Vite 6 + Recharts |
| Backend | Express 4 + PostgreSQL 16 |
| Mobile | Capacitor 8 (Android) |
| Styling | Modular hand-written CSS |
| Testing | Playwright E2E + Autocannon |

---

## Quick Start

```bash
git clone https://github.com/Xcccy01/MoodAlbum.git
cd MoodAlbum

npm install
cp .env.example .env

npm run dev
```

Open http://localhost:5173.

Recommended local `.env`:

```env
DATABASE_URL=
DATABASE_MIGRATION_URL=
SESSION_SECRET=change-me
PLATFORM_ADMIN_SECRET=change-this-too
RUN_MIGRATIONS=true
PORT=8787
```

If `DATABASE_URL` is empty, local development falls back to an in-memory PostgreSQL adapter for convenience. Production deployment should always use a real PostgreSQL instance.

---

## Deployment Guide

Recommended runtime:
- Ubuntu 22.04 or 24.04
- Node.js 22 LTS
- PostgreSQL 16
- Nginx
- systemd
- HTTPS via Certbot

### 1. Install system packages

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx postgresql postgresql-contrib
node -v
psql --version
```

### 2. Create the database

```bash
sudo -u postgres psql
CREATE DATABASE moodalbum_public;
CREATE USER moodalbum WITH ENCRYPTED PASSWORD 'replace-with-a-strong-password';
GRANT ALL PRIVILEGES ON DATABASE moodalbum_public TO moodalbum;
\q
```

### 3. Deploy the code

```bash
mkdir -p /home/ubuntu/family-care-app
cd /home/ubuntu/family-care-app
git clone https://github.com/Xcccy01/MoodAlbum.git .
npm install
npm run build
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgres://moodalbum:your-db-password@127.0.0.1:5432/moodalbum_public
DATABASE_MIGRATION_URL=postgres://moodalbum_migrator:your-migration-password@127.0.0.1:5432/moodalbum_public
SESSION_SECRET=replace-with-a-long-random-string
PLATFORM_ADMIN_SECRET=another-random-string-for-platform-update-api
RUN_MIGRATIONS=false
PORT=8787
```

Notes:
- `DATABASE_URL` is the runtime connection string and should point to a least-privilege role
- `DATABASE_MIGRATION_URL` is only for deployment-time migrations and can use a higher-privilege role
- production should usually run with `RUN_MIGRATIONS=false`

### 4. Verify startup

```bash
npm run db:migrate
npm run db:check
node server/index.js
```

If you see `MoodAlbum public server listening on 8787`, migrations and startup are working.

### 5. Create the systemd service

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

### 6. Configure Nginx

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

### 7. HTTPS and backups

Before opening it to real users:
- enable HTTPS with Certbot so production cookies can use `Secure`
- run a daily `pg_dump` backup and keep at least 7 days

Least-privilege SQL template:
- `server/db/sql/production_least_privilege.sql`

Example backup command:

```bash
pg_dump "$DATABASE_URL" > /home/ubuntu/backups/moodalbum-$(date +%F).sql
```

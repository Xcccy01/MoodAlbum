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
  <img src="https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

<p align="center">
  <a href="./README.md">🇨🇳 中文版本</a>
</p>

---

## What is this?

Ever felt like you want to stay connected with your grandparents or little ones — but not in a "call me every day" kind of way?

MoodAlbum is built for that gentle, **"I'm always here even if I don't say much"** kind of bond.

It's simple: log your mood, do a daily check-in, track some expenses. No social media noise, no group chat pressure. It's like sticking a note on the fridge that says "I'm doing okay today."

---

## Features

### ❤️ · Mood

Log your mood — happy, a bit tired, want some rest... You can create custom moods too. Family members can reply through the admin panel, like slipping a warm little note under your door.

### 🌿  · Wellness

Daily check-in grows a little plant: from seed 🫘 to sprout 🌱, to bloom 🌸, all the way to a flourishing tree 🌳. You'll also get seasonal wellness tips every day.

### 📒 · Expenses

A simple expense tracker — groceries, fruit, transport... Auto-generates pie charts and bar graphs so you can see where the money goes. Custom categories supported.

### 🔔 · Admin Panel

Family enters the admin panel with a passcode, views mood updates and replies by hand. Not auto-generated cold text — real care from a real person.

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
| Backend | Express 4 + SQLite (WAL mode) |
| Mobile | Capacitor 8 (Android) |
| Styling | Hand-written CSS, Glassmorphism |
| Testing | Playwright E2E + Autocannon load test |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/Xcccy01/MoodAlbum.git
cd MoodAlbum

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env, set your own ADMIN_PASSCODE and SESSION_SECRET

# Start dev mode (frontend + backend)
npm run dev
```

Open http://localhost:5173 and you're good to go~

---

## Deployment Guide

> Using Tencent Cloud / Alibaba Cloud lightweight server as example, Ubuntu system, beginner-friendly.

### Step 1: Prepare Server

Get a lightweight cloud server (Tencent Cloud or Alibaba Cloud both work), choose **Ubuntu 22.04**, the cheapest tier is fine. Open **port 80** (HTTP) in the security group / firewall.

### Step 2: Install Dependencies

After SSH into the server:

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt-get install -y nginx

# Verify versions
node -v   # should be >= 18
npm -v
```

### Step 3: Upload Code

```bash
# On the server
mkdir -p /home/ubuntu/family-care-app
cd /home/ubuntu/family-care-app

# Option 1: git clone directly
git clone https://github.com/Xcccy01/MoodAlbum.git .

# Option 2: pack and upload from local
# Local: npm run build && tar -czf deploy.tar.gz package.json package-lock.json server/ dist/ .env.example
# Then: scp deploy.tar.gz ubuntu@YOUR_SERVER_IP:/home/ubuntu/family-care-app/
# Server: tar -xzf deploy.tar.gz
```

### Step 4: Configure Environment

```bash
cd /home/ubuntu/family-care-app
cp .env.example .env
```

Edit `.env`:

```env
ADMIN_PASSCODE=your_admin_passcode
SESSION_SECRET=a_long_random_string_(the_messier_the_safer)
PORT=8787
```

Too lazy to think of a random string? Run this:

```bash
head -c 48 /dev/urandom | base64 | tr -d '\n' && echo
```

### Step 5: Install & Start

```bash
npm install --omit=dev
mkdir -p server/data

# Test run to check for issues
node server/index.js
# If you see "listening on 8787", it's working — Ctrl+C to stop
```

### Step 6: Setup Systemd Service

So the app auto-starts after server reboot:

```bash
sudo tee /etc/systemd/system/family-care-app.service > /dev/null <<'EOF'
[Unit]
Description=MoodAlbum App
After=network.target

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

# Check status
sudo systemctl status family-care-app
```

### Step 7: Configure Nginx

```bash
sudo tee /etc/nginx/sites-available/family-care-app > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
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
sudo nginx -t && sudo systemctl restart nginx
```

### Step 8: Open Firewall

```bash
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

Done! Open `http://YOUR_SERVER_IP` in a browser and share the link with your family~

### Build Android APK (Optional)

If you want to install an app on grandma's phone:

```bash
# First change server.url in capacitor.config.json to your server address
npm run build
npx cap sync android
# Open android/ directory with Android Studio, build APK
```

---

## Project Structure

```
MoodAlbum/
├── src/                  # React frontend source
│   ├── App.jsx           # Main app component
│   └── App.css           # Stylesheet
├── server/
│   └── index.js          # Express backend + SQLite
├── public/               # PWA assets (icons, service worker)
├── scripts/              # Debug & load test scripts
├── tests/                # Playwright E2E tests
├── android/              # Capacitor Android project
├── .env.example          # Environment variable template
├── capacitor.config.json # Capacitor config
├── vite.config.js        # Vite config
└── playwright.config.js  # Test config
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev (frontend + backend) |
| `npm run build` | Build production frontend |
| `npm start` | Start backend server only |
| `npm run test:ui` | Run Playwright E2E tests |
| `npm run test:load` | Run load tests |

---

## Why?

I noticed that many young people do care about their grandparents and little siblings — they just lack a **lightweight, pressure-free way** to say "I'm okay today" or "I'm a bit tired."

No video calls needed, no social media posts. Just letting the people who care about you know how you're doing today.

---

## Contributing

PRs and issues are welcome! Whether it's fixing a bug, adding a feature, or correcting a typo — thank you!

---

## License

[MIT](./LICENSE) — Use it however you like, as long as it makes you happy.

---

<p align="center">
  <i>If this little project warms your heart, a Star would make my day 🌟</i>
</p>

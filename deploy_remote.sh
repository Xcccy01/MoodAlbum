#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/home/ubuntu/family-care-app
ARCHIVE=/home/ubuntu/family-care-deploy.tar.gz
SUDO_PASS="${SUDO_PASSWORD:?请先设置环境变量 SUDO_PASSWORD}"
DATABASE_URL="${DATABASE_URL:?请先设置环境变量 DATABASE_URL}"
DATABASE_MIGRATION_URL="${DATABASE_MIGRATION_URL:-$DATABASE_URL}"
SESSION_SECRET="${SESSION_SECRET:-$(head -c 48 /dev/urandom | base64 | tr -d '\n')}"
PLATFORM_ADMIN_SECRET="${PLATFORM_ADMIN_SECRET:-$(head -c 48 /dev/urandom | base64 | tr -d '\n')}"

rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
tar -xzf "$ARCHIVE" -C "$APP_DIR"
cd "$APP_DIR"

cat > .env <<ENVEOF
DATABASE_URL=$DATABASE_URL
SESSION_SECRET=$SESSION_SECRET
PLATFORM_ADMIN_SECRET=$PLATFORM_ADMIN_SECRET
RUN_MIGRATIONS=false
PORT=8787
ENVEOF

npm install
npm run build
DATABASE_MIGRATION_URL="$DATABASE_MIGRATION_URL" DATABASE_URL="$DATABASE_URL" npm run db:migrate
DATABASE_URL="$DATABASE_URL" RUN_MIGRATIONS=false npm run db:check

cat > /tmp/family-care-app.service <<'SERVICEEOF'
[Unit]
Description=Family Care Public App
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
SERVICEEOF

cat > /tmp/family-care-app.nginx <<'NGINXEOF'
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
NGINXEOF

echo "$SUDO_PASS" | sudo -S mv /tmp/family-care-app.service /etc/systemd/system/family-care-app.service
echo "$SUDO_PASS" | sudo -S mv /tmp/family-care-app.nginx /etc/nginx/sites-available/family-care-app
echo "$SUDO_PASS" | sudo -S rm -f /etc/nginx/sites-enabled/default
echo "$SUDO_PASS" | sudo -S ln -sf /etc/nginx/sites-available/family-care-app /etc/nginx/sites-enabled/family-care-app
echo "$SUDO_PASS" | sudo -S systemctl daemon-reload
echo "$SUDO_PASS" | sudo -S systemctl enable family-care-app
echo "$SUDO_PASS" | sudo -S systemctl restart family-care-app
echo "$SUDO_PASS" | sudo -S nginx -t
echo "$SUDO_PASS" | sudo -S systemctl restart nginx
echo "$SUDO_PASS" | sudo -S ufw allow 'Nginx Full' || true
echo "$SUDO_PASS" | sudo -S ufw --force enable || true
echo "$SUDO_PASS" | sudo -S systemctl status family-care-app --no-pager

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
  <img src="https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

<p align="center">
  <a href="./README_EN.md">🌐 English Version</a>
</p>

---

## 这是什么？

你有没有觉得，和家里的长辈或者小朋友之间，其实不需要每天打电话、不需要事无巨细地汇报生活——但你又确实想知道他们今天过得怎么样？

MoodAlbum 就是为这种 **"不用太紧密、但一直都在"** 的情感连接而生的。

它很简单：记录心情、打个卡、记个账。没有朋友圈的喧闹，没有微信群的压力，就像在冰箱上贴一张便利贴，轻轻地说一句"今天还不错"。

---

## 功能特色

### ❤️ · 心情记录

记录今天的心情——开心、有点累、想休息……还可以自定义心情。家人可以通过后台悄悄回复你的心情，像收到一封温柔的小纸条。

### 🌿  · 养生打卡

每日打卡，你会慢慢养出一棵小植物：从种子 🫘 到发芽 🌱，再到开花 🌸，最后长成大树 🌳。每天还会收到一条应季的养生小贴士。

### 📒 · 记账本

简单好用的记账本，买菜、水果、出行……自动生成饼图和柱状图，一眼看清这个月钱花在哪了。支持自定义分类。

### 🔔 · 管理后台

家人通过口令进入后台，查看心情动态并手动回复。不是冷冰冰的自动回复，是真真切切有人在看、在关心。

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
| 后端 | Express 4 + SQLite (WAL mode) |
| 移动端 | Capacitor 8 (Android) |
| 样式 | 手写 CSS, 毛玻璃风格 |
| 测试 | Playwright E2E + Autocannon 压测 |

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Xcccy01/MoodAlbum.git
cd MoodAlbum

# 装依赖
npm install

# 复制环境配置
cp .env.example .env
# 编辑 .env，设置你自己的 ADMIN_PASSCODE 和 SESSION_SECRET

# 启动开发模式（前后端同时跑）
npm run dev
```

打开 http://localhost:5173 就能看到啦~

---

## 部署教程

> 以腾讯云 / 阿里云轻量应用服务器为例，Ubuntu 系统，适合新手照着做。

### 第 1 步：准备服务器

买一台轻量应用服务器（腾讯云、阿里云都行），选 **Ubuntu 22.04** 系统，最低配就够用。

在安全组 / 防火墙中开放 **80 端口**（HTTP）。

### 第 2 步：安装环境

SSH 连上服务器后：

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Nginx
sudo apt-get install -y nginx

# 确认版本
node -v   # 应该 >= 18
npm -v
```

### 第 3 步：上传代码

```bash
# 在服务器上
mkdir -p /home/ubuntu/family-care-app
cd /home/ubuntu/family-care-app

# 方式 1: 直接 git clone
git clone https://github.com/Xcccy01/MoodAlbum.git .

# 方式 2: 本地打包上传
# 本地执行: npm run build && tar -czf deploy.tar.gz package.json package-lock.json server/ dist/ .env.example
# 然后 scp deploy.tar.gz ubuntu@你的服务器IP:/home/ubuntu/family-care-app/
# 服务器上: tar -xzf deploy.tar.gz
```

### 第 4 步：配置环境变量

```bash
cd /home/ubuntu/family-care-app
cp .env.example .env
```

编辑 `.env`：

```env
ADMIN_PASSCODE=你的管理后台口令
SESSION_SECRET=随便打一串长长的随机字符（越乱越安全）
PORT=8787
```

懒得想随机字符串？跑这个：

```bash
head -c 48 /dev/urandom | base64 | tr -d '\n' && echo
```

### 第 5 步：安装依赖并启动

```bash
npm install --omit=dev
mkdir -p server/data

# 先试跑一下看看有没有问题
node server/index.js
# 看到 "listening on 8787" 就说明没问题，Ctrl+C 停掉
```

### 第 6 步：配置 Systemd 守护进程

这样服务器重启后 App 也会自动跑起来：

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

# 检查运行状态
sudo systemctl status family-care-app
```

### 第 7 步：配置 Nginx 反向代理

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

### 第 8 步：开防火墙

```bash
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

搞定！浏览器打开 `http://你的服务器IP` 就能用了。把链接发给家人吧~

### 打包 Android APK（可选）

如果想给老人装个手机 App：

```bash
# 先改 capacitor.config.json 里的 server.url 为你的服务器地址
npm run build
npx cap sync android
# 用 Android Studio 打开 android/ 目录，构建 APK
```

---

## 项目结构

```
MoodAlbum/
├── src/                  # React 前端源码
│   ├── App.jsx           # 主应用组件
│   └── App.css           # 样式表
├── server/
│   └── index.js          # Express 后端 + SQLite
├── public/               # PWA 资源 (icons, service worker)
├── scripts/              # 调试 & 压测脚本
├── tests/                # Playwright E2E 测试
├── android/              # Capacitor Android 工程
├── .env.example          # 环境变量模板
├── capacitor.config.json # Capacitor 配置
├── vite.config.js        # Vite 配置
└── playwright.config.js  # 测试配置
```

---

## 常用命令

| 命令 | 干啥的 |
|---|---|
| `npm run dev` | 本地开发（前后端同时启动） |
| `npm run build` | 构建生产版前端 |
| `npm start` | 只启动后端服务器 |
| `npm run test:ui` | 跑 Playwright E2E 测试 |
| `npm run test:load` | 跑压力测试 |

---

## 为什么做这个？

我发现很多年轻人和家里的老人、小孩之间，并不是不关心，而是缺少一个 **轻量的、没有社交压力的方式** 来表达"我今天还好"或者"我有点累"。

不需要视频通话，不需要发朋友圈，就只是——让关心你的人知道你今天怎么样就好了。

---

## 参与贡献

欢迎 PR 和 Issue！无论是修 bug、加功能、还是改个错别字，都非常感谢。

---

## 开源协议

[MIT](./LICENSE) — 随便用，开心就好。

---

<p align="center">
  <i>如果这个小项目暖到了你，点个 Star 让我也开心一下吧 🌟</i>
</p>

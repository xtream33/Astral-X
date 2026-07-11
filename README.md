<div align="center">
  <img src="Astralogo.png" alt="ASTRA-X" width="200"/>
  
  # 🌟 ASTRA-X BOT v6.6.6
  
  **Advanced WhatsApp AI Bot — Always Online 🌍**
  
  [![Version](https://img.shields.io/badge/Version-6.6.6-gold?style=for-the-badge)](.)
  [![Node](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](.)
  [![WhatsApp](https://img.shields.io/badge/WhatsApp-Bot-25D366?style=for-the-badge&logo=whatsapp)](.)
  [![Telegram](https://img.shields.io/badge/Telegram-Bot-2CA5E0?style=for-the-badge&logo=telegram)](.)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](.)
</div>

---

## ✨ Features

| Category | Commands |
|---|---|
| 🤖 **Gemini AI** | AI chat, image analysis, write, summarize, translate, code |
| 🌟 **ASTRA-X AI** | Web search, explain, story, math, AI images, news, quiz |
| 🎵 **Media & Downloads** | YouTube, TikTok, Instagram, Facebook, Twitter, SoundCloud |
| 📦 **APK Downloads** | Search, download, mod finder, safety scan, version check |
| 👥 **Group Management** | Promote, kick, warn, announce, antilink, antiflood |
| 🔒 **Privacy** | Ghost mode, hide online, disappear, anti-trace |
| 🛡️ **Protection** | Anti-spam, anti-badword, anti-delete, blacklist |
| 🎲 **Fun & Games** | Trivia, riddles, roast, ship, dice, 8ball, jokes |
| ⚽ **Sports** | Live scores, EPL, UCL, La Liga, Bundesliga tables |
| 🌍 **Utility** | Weather, currency, news, Bible, Quran, BMI, age |
| 🎨 **AI Images** | Generate images, portraits, anime, art, logos |
| 📲 **Telegram Pairing** | Pair WhatsApp from Telegram bot |

---

## 🚀 Quick Setup

### Requirements
- Node.js 18+
- Python 3 (for yt-dlp)
- ffmpeg (for audio conversion)

### Installation

```bash
# Clone or extract
git clone https://github.com/yourusername/astra-x.git
cd astra-x

# Install dependencies
npm install

# Install yt-dlp
pip install yt-dlp --break-system-packages

# Install ffmpeg (Termux)
pkg install ffmpeg -y

# Setup environment
cp .env.example .env
nano .env

# Run
node src/index.js
```

### Environment Variables (`.env`)

```env
# Server
PORT=3000
HOST=0.0.0.0

# Admin Panel
ADMIN_USER=admin
ADMIN_PASS=your_password
ADMIN_AUTH_KEY=your_key
SESSION_SECRET=your_secret_32chars

# Bot
BOT_PREFIX=.
BOT_OWNER=256747304196

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHANNEL_ID=-100xxxxxxxxxx
TELEGRAM_CHANNEL_INVITE=https://t.me/+your_invite

# Render Keep-Alive
RENDER_EXTERNAL_URL=https://your-bot.onrender.com
SELF_URL=http://localhost:3000

# AI (optional)
GEMINI_API_KEY=your_gemini_key
```

---

## 🌐 Web Panels

| Panel | URL |
|---|---|
| 🔗 Pairing Site | `https://your-bot.onrender.com/` |
| 🔐 Admin Panel | `https://your-bot.onrender.com/admin` |
| 🌟 Activation Portal | `https://your-bot.onrender.com/sub` |
| 💊 Health Check | `https://your-bot.onrender.com/health` |
| 🔑 Session Manager | `https://your-bot.onrender.com/admin/sessions` |

---

## 📲 Pairing Methods

**1. Web Pairing Site** — Visit your bot URL and enter your WhatsApp number

**2. Telegram Bot** — Message your Telegram bot, send your number, get the code

Both methods deliver the pairing code and Session ID automatically.

---

## 📞 Contact & Support

- 👨‍💻 **Developer:** Xtream Noor
- 📱 **WhatsApp:** +256747304196
- 🔗 **Telegram:** http://t.me/xtreammoder
- 📢 **Channel:** https://whatsapp.com/channel/0029Vb8BaxaBFLgMYofBAC3I

---

<div align="center">
  <b>© 2026 ASTRA-X TECH — Always Online 🌍</b><br>
  <i>Built with ❤️ by Xtream Noor</i>
</div>

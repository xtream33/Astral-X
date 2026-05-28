<div align="center">

<img src="Noorlogo.png" alt="NOOR-X Logo" width="350" style="border-radius:20px"/>

<br/>

# 🤖 NOOR-X WhatsApp Bot

### *The Most Advanced Self-Hosted WhatsApp Bot*

<br/>

![Version](https://img.shields.io/badge/Version-4.0.0-25d366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Termux%20%7C%20Linux-black?style=for-the-badge&logo=android&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-25d366?style=for-the-badge)

<br/>

[![WhatsApp Channel](https://img.shields.io/badge/Join%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029Vb7vchCCBtxK3Ria2k1i)
[![GitHub](https://img.shields.io/badge/Star%20on%20GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/xtream33/Noorx)

</div>

---

<div align="center">

## ✨ What is NOOR-X?

</div>

**NOOR-X** is a powerful, fully self-hosted WhatsApp bot built with **Node.js** and **Baileys**. It runs directly on your Android phone via **Termux** — no server, no monthly fees, no cloud. Just your phone running 24/7.

It comes with **92 commands**, a beautiful **web admin dashboard**, real-time stats, group management, media downloads, AI chat, and much more — all fully customizable.

---

<div align="center">

## 🌟 Feature Highlights

</div>

<table align="center">
<tr>
<td align="center">⬇️<br/><b>Downloads</b><br/>YouTube, TikTok,<br/>Instagram, Facebook,<br/>Twitter, 1000+ sites</td>
<td align="center">🛡️<br/><b>Group Protection</b><br/>Antilink, Antispam,<br/>Antiflood, Antibot,<br/>Antifake, Blacklist</td>
<td align="center">👥<br/><b>Group Management</b><br/>Welcome, Goodbye,<br/>Mute, Lock, Poll,<br/>Warn system</td>
</tr>
<tr>
<td align="center">👁️<br/><b>Smart Features</b><br/>ViewOnce unlock,<br/>Auto view status,<br/>Auto like status 💚</td>
<td align="center">🔐<br/><b>Admin Dashboard</b><br/>Live stats, User<br/>management, Ban,<br/>Broadcast, SSE</td>
<td align="center">⚙️<br/><b>Per-User Settings</b><br/>Custom prefix,<br/>Owner-only mode,<br/>Maintenance mode</td>
</tr>
</table>

---

<div align="center">

## 📋 Commands — 92 Total

</div>

<details>
<summary><b>📥 Downloads & Media</b> (click to expand)</summary>

| Command | Description |
|---------|-------------|
| `!dl <url>` | Download from 1000+ sites |
| `!dl <url> audio` | Audio only |
| `!ytmp4 <url>` | YouTube video |
| `!ytmp3 <url>` | YouTube audio / music |
| `!tiktok <url>` | TikTok (no watermark) |
| `!instagram <url>` | Instagram reels & posts |
| `!facebook <url>` | Facebook videos |
| `!twitter <url>` | Twitter / X videos |
| `!sticker` | Image or video → WhatsApp sticker |
| `!tomp3` | Reply to video → MP3 audio |

</details>

<details>
<summary><b>🛡️ Anti & Protection</b> (click to expand)</summary>

| Command | Description |
|---------|-------------|
| `!antilink` | Block links — warns 3x then kicks (toggle) |
| `!antispam` | Block repeated messages (toggle) |
| `!antiflood [n]` | Limit message speed (toggle) |
| `!antibadword` | Block bad words (toggle) |
| `!antifake <code>` | Allow only specific country e.g. `!antifake 256` |
| `!antibot` | Block bot numbers on join (toggle) |
| `!blacklist` | Manage blacklisted words |
| `!antilink reset` | Clear all warns |
| `!antilink reset @user` | Clear one user's warns |

> ✅ All anti-systems share a 3-warn kick system. Admins are always exempt.

</details>

<details>
<summary><b>👥 Group Management</b> (click to expand)</summary>

| Command | Description |
|---------|-------------|
| `!welcome` | Toggle welcome messages |
| `!setwelcome <msg>` | Set welcome text (`{name}` `{group}` `{count}`) |
| `!goodbye` | Toggle goodbye messages |
| `!setgoodbye <msg>` | Set goodbye text |
| `!mute` / `!unmute` | Only admins can send / everyone can send |
| `!lock` / `!unlock` | Lock / unlock group info |
| `!everyone [msg]` | Tag all members |
| `!promote @user` | Promote to admin |
| `!demote @user` | Remove admin |
| `!kick @user` | Remove from group |
| `!poll Q\|opt1\|opt2` | Create a WhatsApp poll |
| `!rules` | Show group rules |
| `!setrules <text>` | Set group rules |
| `!announce <msg>` | Pin announcement |
| `!warn @user [reason]` | Warn a member |
| `!warnings @user` | Check warn count |
| `!clearwarn @user` | Clear warns |

</details>

<details>
<summary><b>👁️ ViewOnce & Status</b> (click to expand)</summary>

| Command | Description |
|---------|-------------|
| `!viewonce` | Unlock view-once photos & videos for all (toggle) |
| `!autoviewstatus` | Auto view everyone's status (toggle) |
| `!autolikestatus` | Auto react 💚 to every status (toggle) |

</details>

<details>
<summary><b>⚙️ Bot Settings</b> (click to expand)</summary>

| Command | Description |
|---------|-------------|
| `!setprefix <symbol>` | Change YOUR bot prefix (e.g. `!setprefix .`) |
| `!setprefix reset` | Reset prefix to default |
| `!owneronly` | Only bot owner can use commands (toggle) |
| `!maintenance` | Maintenance mode — ignores everyone (toggle) |
| `!autoread` | Auto read all messages (toggle) |
| `!autoreact` | Auto react to commands (toggle) |
| `!autotyping` | Show typing indicator (toggle) |
| `!autorecording` | Show recording status (toggle) |
| `!afk [reason]` | Set AFK — bot auto-replies when tagged |

</details>

<details>
<summary><b>🎲 Fun & Games</b> (click to expand)</summary>

`!dice` `!flip` `!8ball` `!joke` `!quote` `!roast` `!compliment`
`!rps` `!rate` `!wyr` `!ship` `!truth` `!dare` `!trivia` `!wordgame`

</details>

<details>
<summary><b>🔤 Tools & Utility</b> (click to expand)</summary>

`!calc` `!reverse` `!upper` `!lower` `!count` `!repeat` `!translate`
`!weather` `!currency` `!qr` `!shorten` `!notes` `!reminder` `!broadcast`

</details>

---

<div align="center">

## 🚀 Installation

</div>

### Prerequisites

```bash
# Update Termux packages
pkg update && pkg upgrade

# Install Node.js, Git, and media tools
pkg install nodejs git yt-dlp ffmpeg
```

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/xtream33/Noorx.git
cd Noorx

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
nano .env
```

### Configure `.env`

```env
PORT=3000
ADMIN_USER=admin
ADMIN_PASS=yourpassword
ADMIN_AUTH_KEY=yoursecretkey
SESSION_SECRET=anylongrandomstring123456789
BOT_PREFIX=!
BOT_OWNER=yournumberwithcountrycode
```

```bash
# 4. Start the bot
npm start
```

---

<div align="center">

## 🌐 Web Dashboard

</div>

Once running, open your phone browser:

| URL | Page |
|-----|------|
| `http://localhost:3000` | 📱 Pairing Page |
| `http://localhost:3000/admin` | 🔐 Admin Dashboard |
| `http://localhost:3000/health` | 💊 Health Check |
| `http://localhost:3000/api/health` | 📊 JSON Stats |

### Admin Dashboard Features
- 📊 **Live stats** — users, messages, RAM, uptime (updates every 5s)
- 👥 **Session management** — view, ban, restrict, delete users
- 📢 **Broadcast** — send messages to all connected users
- 📈 **Command analytics** — top 15 commands with error tracking
- 🚫 **Restriction list** — manage banned users

---

<div align="center">

## 🔄 Keep Bot Running 24/7

</div>

```bash
# Install tmux (runs in background)
pkg install tmux

# Start a named session
tmux new -s noorx

# Start the bot inside tmux
npm start

# Detach (bot keeps running): Ctrl+B then D

# Come back later
tmux attach -t noorx
```

---

<div align="center">

## 🌍 Access Over Internet

</div>

```bash
# Install Cloudflare tunnel (free, no account needed)
pkg install cloudflared

# Start tunnel
cloudflared tunnel --url http://localhost:3000
```

You get a public URL like `https://xxxx.trycloudflare.com` that others can use to pair with your bot.

---

<div align="center">

## 📁 Project Structure

</div>

```
noorx/
├── src/
│   ├── commands/        # 92 bot commands
│   ├── routes/          # Admin dashboard
│   ├── tasks/           # Channel check task
│   └── utils/           # Core utilities
│       ├── socket.js    # WhatsApp connection engine
│       ├── settings.js  # Persistent settings store
│       ├── database.js  # In-memory database
│       └── stats.js     # Command statistics
├── public/
│   ├── index.html       # Pairing page
│   └── health.html      # Health page
├── data/                # Bot data (auto-created)
├── sessions/            # Auth sessions (auto-created)
├── .env                 # Your configuration
└── package.json
```

---

<div align="center">

## ⚠️ Requirements

</div>

| Requirement | Version |
|-------------|---------|
| Node.js | 18.0.0 or higher |
| npm | 8.0.0 or higher |
| yt-dlp | Latest (for downloads) |
| ffmpeg | Latest (for stickers/audio) |
| WhatsApp | Active account, max 4 linked devices |

---

<div align="center">

## 🤝 Support & Community

</div>

<div align="center">

[![WhatsApp Channel](https://img.shields.io/badge/WhatsApp%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029Vb7vchCCBtxK3Ria2k1i)

</div>

- 📣 Join our **WhatsApp Channel** for updates and announcements
- ⭐ **Star this repo** if you find it useful
- 🐛 **Open an issue** for bugs or feature requests
- 🍴 **Fork** and contribute to make it better

---

<div align="center">

## 📜 License

This project is licensed under the **MIT License** — free to use, modify and share.

<br/>

---

<img src="Noorlogo.png" alt="NOOR-X" width="80"/>

**NOOR-X Bot v4.0**

*Built with ❤️ · Always Online 🌍*

![Made with Node.js](https://img.shields.io/badge/Made%20with-Node.js-339933?style=flat-square&logo=nodedotjs)
![Powered by Baileys](https://img.shields.io/badge/Powered%20by-Baileys-25d366?style=flat-square&logo=whatsapp)
![Runs on Termux](https://img.shields.io/badge/Runs%20on-Termux-black?style=flat-square&logo=android)

</div>

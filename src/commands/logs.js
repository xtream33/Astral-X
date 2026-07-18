const fs   = require('fs');
const path = require('path');
module.exports = {
  name: 'logs', category: 'owner',
  description: 'Send last 30 lines of bot logs to you',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    const logPaths = [
      path.join(__dirname, '../../logs/bot.log'),
      path.join(__dirname, '../../bot.log'),
      path.join(process.cwd(), 'bot.log'),
    ];
    let content = null;
    for (const p of logPaths) {
      try { if (fs.existsSync(p)) { content = fs.readFileSync(p, 'utf8'); break; } } catch (_) {}
    }
    if (!content) return sock.sendMessage(jid, { text: '📋 No log file found.\n\nMake sure your logger writes to a file.\nCurrent runtime logs are only in terminal.' });
    const lines = content.trim().split('\n').slice(-30).join('\n');
    await sock.sendMessage(jid, { text: '📋 *Last 30 log lines:*\n\n' + lines });
  }
};

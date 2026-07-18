'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'ping',
  aliases: ['speed', 'latency', 'pong', 'alive2'],
  category: 'utility',
  description: 'Check bot response speed',
  execute: async (sock, msg) => {
    const jid   = msg.key.remoteJid;
    const start = Date.now();
    await sock.sendMessage(jid, { text: box('🏓 *PING*', '_Pinging..._') });
    const ms     = Date.now() - start;
    const status = ms < 300 ? '🟢 Excellent' : ms < 700 ? '🟡 Good' : '🔴 Slow';
    await sock.sendMessage(jid, {
      text: box('🏓 *PONG!*', '⚡ *Speed:*  *' + ms + 'ms*\n📶 *Status:* ' + status + '\n🟢 *Bot:*    Online'),
    }, { quoted: msg });
  },
};

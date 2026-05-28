'use strict';
const https = require('https');
const { box } = require('../utils/format');
module.exports = {
  name: 'shorten', aliases: ['short', 'tiny', 'tinyurl', 'shorturl'],
  category: 'utility', description: 'Shorten a URL. Usage: .shorten <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0] || !args[0].startsWith('http')) return sock.sendMessage(jid, { text: box('🔗 *URL SHORTENER*', '📌 *Usage:* .shorten <url>\n\n💡 *Example:*\n.shorten https://www.example.com/very/long/url') });
    await sock.sendMessage(jid, { text: box('🔗 *URL SHORTENER*', '_Shortening URL..._') });
    https.get('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(args[0]), res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        const short = data.trim();
        if (!short.startsWith('http')) return; // silent on failure
        await sock.sendMessage(jid, { text: box('🔗 *URL SHORTENER*', '📎 *Original:*\n_' + args[0].slice(0, 100) + (args[0].length > 100 ? '...' : '') + '_\n━━━━━━━━━━━━━━\n✂️ *Shortened:*\n' + short) }, { quoted: msg });
      });
    }).on('error', () => { /* silent */ });
  },
};

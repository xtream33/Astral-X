'use strict';
const { freeDownload } = require('../utils/freedownload');

module.exports = {
  name: 'facebook',
  aliases: ['fb', 'fbvid', 'fbdown', 'fbreels', 'facebookdl'],
  category: 'media',
  description: 'Download Facebook video. Usage: .facebook <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, {
      text:
        '📘 *Facebook Downloader*\n━━━━━━━━━━━━━━\n' +
        'Provide a Facebook video URL.\n\n' +
        '*Usage:* .facebook <Facebook URL>\n\n' +
        '_Powered by free services_ 📘',
    });
    if (!args[0].startsWith('http')) return sock.sendMessage(jid, { text: '❌ Provide a valid Facebook URL.' });
    await freeDownload(sock, jid, args[0], { audioOnly: false, quotedMsg: msg });
  },
};

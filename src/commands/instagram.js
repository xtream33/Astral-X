'use strict';
const { freeDownload } = require('../utils/freedownload');

module.exports = {
  name: 'instagram',
  aliases: ['ig', 'insta', 'reel', 'igvid', 'igdown', 'igdl'],
  category: 'media',
  description: 'Download Instagram reel/post. Usage: .instagram <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, {
      text:
        '📸 *Instagram Downloader*\n━━━━━━━━━━━━━━\n' +
        'Provide an Instagram URL.\n\n' +
        '*Usage:* .instagram <Instagram URL>\n' +
        '*Works with:* Reels, Posts, Stories\n\n' +
        '_Powered by free services — no login needed_ 📸',
    });
    if (!args[0].startsWith('http')) return sock.sendMessage(jid, { text: '❌ Provide a valid Instagram URL starting with *https://*' });
    await freeDownload(sock, jid, args[0], { audioOnly: false, quotedMsg: msg });
  },
};

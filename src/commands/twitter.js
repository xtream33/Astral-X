'use strict';
const { freeDownload } = require('../utils/freedownload');

module.exports = {
  name: 'twitter',
  aliases: ['tw', 'xvideo', 'tweet', 'xdown', 'twitterdl'],
  category: 'media',
  description: 'Download Twitter/X video. Usage: .twitter <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, {
      text:
        '🐦 *Twitter/X Downloader*\n━━━━━━━━━━━━━━\n' +
        'Provide a Twitter/X post URL.\n\n' +
        '*Usage:* .twitter <Twitter/X URL>\n\n' +
        '_Powered by free services_ 🐦',
    });
    if (!args[0].startsWith('http')) return sock.sendMessage(jid, { text: '❌ Provide a valid Twitter/X URL.' });
    await freeDownload(sock, jid, args[0], { audioOnly: false, quotedMsg: msg });
  },
};

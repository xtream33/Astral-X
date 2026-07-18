'use strict';
const { freeDownload } = require('../utils/freedownload');

module.exports = {
  name: 'tiktok',
  aliases: ['tt', 'tok', 'tkvideo', 'tikdown', 'tiktokdl'],
  category: 'media',
  description: 'Download TikTok video (no watermark). Usage: .tiktok <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, {
      text:
        '🎵 *TikTok Downloader*\n━━━━━━━━━━━━━━\n' +
        'Please provide a TikTok URL.\n\n' +
        '*Usage:* .tiktok <TikTok URL>\n' +
        '*Example:* .tiktok https://vm.tiktok.com/xxxx\n\n' +
        '_Downloads without watermark via free APIs_ ✨',
    });
    if (!args[0].startsWith('http')) return sock.sendMessage(jid, { text: '❌ Please provide a valid TikTok URL starting with *https://*' });
    const url = args[0];
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok') && !url.includes('vt.tiktok')) {
      return sock.sendMessage(jid, { text: '❌ That does not look like a TikTok URL. Please send a valid TikTok link. 🙏' });
    }
    await freeDownload(sock, jid, url, { audioOnly: false, quotedMsg: msg });
  },
};

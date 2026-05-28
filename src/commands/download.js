'use strict';
const { freeDownload, searchAndDownload } = require('../utils/freedownload');

module.exports = {
  name: 'download',
  aliases: ['dl', 'down', 'get', 'fetch', 'grab'],
  category: 'media',
  description: 'Smart downloader for any platform. Usage: .dl <url or name> [audio]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text:
        '⬇️ *ASTRA-X Smart Downloader*\n━━━━━━━━━━━━━━━━━━\n' +
        '🎵 *.song <name>*         → Search & download audio\n' +
        '🎬 *.play <name>*         → Search & download video\n' +
        '📺 *.ytmp4 <url/name>*   → YouTube video\n' +
        '🎵 *.ytmp3 <url/name>*   → YouTube audio\n' +
        '🎵 *.tiktok <url>*        → TikTok (no watermark)\n' +
        '📸 *.instagram <url>*     → Instagram reel/post\n' +
        '📘 *.facebook <url>*      → Facebook video\n' +
        '🐦 *.twitter <url>*       → Twitter/X video\n' +
        '⬇️ *.dl <url>*            → Auto-detect platform\n' +
        '⬇️ *.dl <url> audio*      → Audio only\n' +
        '━━━━━━━━━━━━━━━━━━\n' +
        '_All free — no API keys needed!_ 🌍',
    });

    const audioOnly = args[args.length - 1]?.toLowerCase() === 'audio';
    const input     = audioOnly ? args.slice(0, -1).join(' ') : args.join(' ');
    const isUrl     = input.startsWith('http');

    if (isUrl) {
      await freeDownload(sock, jid, input, { audioOnly, quotedMsg: msg });
    } else {
      await searchAndDownload(sock, jid, input, audioOnly, msg);
    }
  },
};

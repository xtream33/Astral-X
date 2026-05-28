'use strict';
const { freeDownload, searchAndDownload } = require('../utils/freedownload');

module.exports = {
  name: 'ytmp4',
  aliases: ['ytv', 'youtubemp4', 'ytvid', 'ytdown'],
  category: 'media',
  description: 'Download YouTube video (MP4). Usage: .ytmp4 <url or name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text:
        '🎬 *YouTube Video Downloader*\n━━━━━━━━━━━━━━\n' +
        'Provide a YouTube URL or video name.\n\n' +
        '*Usage:* .ytmp4 <URL or name>\n\n' +
        '*Examples:*\n' +
        '  • .ytmp4 https://youtu.be/60ItHLz5WEA\n' +
        '  • .ytmp4 Faded Alan Walker official video\n\n' +
        '_Powered by free services — no API key needed_ 🎬',
    });

    const input = args.join(' ');
    const isUrl = input.startsWith('http');

    if (isUrl) {
      await freeDownload(sock, jid, input, { audioOnly: false, quotedMsg: msg });
    } else {
      await searchAndDownload(sock, jid, input, false, msg);
    }
  },
};

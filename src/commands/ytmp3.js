'use strict';
const { freeDownload, searchAndDownload } = require('../utils/freedownload');

module.exports = {
  name: 'ytmp3',
  aliases: ['yta', 'youtubemp3', 'ytaudio', 'ytsong'],
  category: 'media',
  description: 'Download YouTube audio (MP3). Usage: .ytmp3 <url or song name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text:
        '🎵 *YouTube Audio Downloader*\n━━━━━━━━━━━━━━\n' +
        'Provide a YouTube URL or song name.\n\n' +
        '*Usage:* .ytmp3 <URL or song name>\n\n' +
        '*Examples:*\n' +
        '  • .ytmp3 https://youtu.be/60ItHLz5WEA\n' +
        '  • .ytmp3 Faded Alan Walker\n\n' +
        '_Powered by free services — no API key needed_ 🎶',
    });

    const input = args.join(' ');
    const isUrl = input.startsWith('http');

    if (isUrl) {
      await freeDownload(sock, jid, input, { audioOnly: true, quotedMsg: msg });
    } else {
      await searchAndDownload(sock, jid, input, true, msg);
    }
  },
};

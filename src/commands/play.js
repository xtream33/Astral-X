'use strict';
const { searchAndDownload } = require('../utils/freedownload');

module.exports = {
  name: 'play',
  aliases: ['video', 'watch', 'ytsearch', 'videosearch', 'stream'],
  category: 'media',
  description: 'Search & download a video. Usage: .play <name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text:
        '🎬 *Video Search & Download*\n━━━━━━━━━━━━━━\n' +
        'Provide a video name or keyword!\n\n' +
        '*Usage:* .play <video name>\n\n' +
        '*Examples:*\n' +
        '  • .play Faded Alan Walker official\n' +
        '  • .play Minecraft tutorial 2024\n' +
        '  • .play funny cats compilation\n\n' +
        '_Powered by free services_ 🎬',
    });
    await searchAndDownload(sock, jid, args.join(' '), false, msg);
  },
};

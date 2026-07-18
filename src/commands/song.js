'use strict';
const { searchAndDownload } = require('../utils/freedownload');

module.exports = {
  name: 'song',
  aliases: ['music', 'sing', 'track', 'banger', 'beat', 'mp3search', 'sc'],
  category: 'media',
  description: 'Search & download a song. Usage: .song <name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text:
        '🎵 *Song Downloader*\n━━━━━━━━━━━━━━\n' +
        'Tell me the song name! 😊\n\n' +
        '*Usage:* .song <song name or artist + title>\n\n' +
        '*Examples:*\n' +
        '  • .song Faded Alan Walker\n' +
        '  • .song Shape of You Ed Sheeran\n' +
        '  • .song Blinding Lights The Weeknd\n\n' +
        '_Searches YouTube — free, no API key needed_ 🎶',
    });
    await searchAndDownload(sock, jid, args.join(' '), true, msg);
  },
};

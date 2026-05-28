'use strict';
const { box } = require('../utils/format');
const https = require('https');

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'lyrics',
  aliases: ['lyric', 'lyr'],
  category: 'media',
  description: 'Get song lyrics. Usage: .lyrics <song name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text: box('🎵 *LYRICS*', '📌 *Usage:* .lyrics <song name>\n\n💡 *Examples:*\n.lyrics Faded Alan Walker\n.lyrics Shape of You Ed Sheeran\n.lyrics Blinding Lights'),
    });
    const query = args.join(' ');
    await sock.sendMessage(jid, { text: box('🎵 *LYRICS*', '_Searching for *' + query + '*..._') });
    try {
      const search = await fetchJSON('https://lyrist.vercel.app/api/' + encodeURIComponent(query));
      if (!search?.lyrics) throw new Error('none');
      const lyrics = search.lyrics.slice(0, 3800);
      const more   = search.lyrics.length > 3800 ? '\n\n_...lyrics truncated_' : '';
      await sock.sendMessage(jid, {
        text: box('🎵 *' + (search.title || query).toUpperCase() + '*',
          '🎤 *Artist:* ' + (search.artist || 'Unknown') + '\n━━━━━━━━━━━━━━\n\n' + lyrics + more),
      }, { quoted: msg });
    } catch (_) {
      try {
        const parts  = query.split(' ');
        const artist = parts[0], title = parts.slice(1).join(' ') || parts[0];
        const data   = await fetchJSON('https://api.lyrics.ovh/v1/' + encodeURIComponent(artist) + '/' + encodeURIComponent(title));
        if (!data?.lyrics) return; // silent
        await sock.sendMessage(jid, {
          text: box('🎵 *' + query.toUpperCase() + '*', data.lyrics.slice(0, 3800)),
        }, { quoted: msg });
      } catch (_2) { /* silent — no response if both sources fail */ }
    }
  },
};

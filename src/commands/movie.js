'use strict';
const { box } = require('../utils/format');
const { fetchBuffer } = require('../utils/ytdlp');

function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function stars(r) {
  const n = Math.round(parseFloat(r) / 2);
  return '⭐'.repeat(Math.min(n, 5)) + '☆'.repeat(Math.max(0, 5 - n));
}

module.exports = {
  name: 'movie',
  aliases: ['film', 'series', 'imdb', 'show'],
  category: 'utility',
  description: 'Get movie/series info. Usage: .movie <name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text: box('🎬 *MOVIE INFO*', '📌 *Usage:* .movie <name>\n\n💡 *Examples:*\n.movie Avengers\n.movie The Dark Knight\n.movie Breaking Bad'),
    });
    const query = args.join(' ');
    await sock.sendMessage(jid, { text: box('🎬 *MOVIE INFO*', '_Searching for *' + query + '*..._') });
    try {
      const data = await fetchJSON('https://www.omdbapi.com/?t=' + encodeURIComponent(query) + '&apikey=trilogy&plot=short');
      if (data.Response === 'False') return; // silent
      const body =
        '📁 *Type:*     ' + data.Type + '\n' +
        '🎭 *Genre:*    ' + data.Genre + '\n' +
        '🌍 *Language:* ' + data.Language + '\n' +
        '⏱️ *Runtime:*  ' + data.Runtime + '\n' +
        '⭐ *Rating:*   ' + data.imdbRating + '/10 ' + stars(data.imdbRating) + '\n' +
        '🗳️ *Votes:*    ' + data.imdbVotes + '\n' +
        '🎬 *Director:* ' + data.Director + '\n' +
        '🎭 *Actors:*   ' + data.Actors + '\n\n' +
        '📖 *Plot:*\n' + data.Plot;
      const caption = box('🎬 *' + data.Title.toUpperCase() + '* (' + data.Year + ')', body);
      if (data.Poster && data.Poster !== 'N/A') {
        try {
          const img = await fetchBuffer(data.Poster);
          await sock.sendMessage(jid, { image: img, caption }, { quoted: msg });
          return;
        } catch (_) {}
      }
      await sock.sendMessage(jid, { text: caption }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

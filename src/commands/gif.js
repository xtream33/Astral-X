'use strict';
const { fetchBuffer } = require('../utils/ytdlp');
const { box } = require('../utils/format');
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
module.exports = {
  name: 'gif', aliases: ['giphy', 'gifs', 'anime'],
  category: 'media', description: 'Search and send GIFs. Usage: .gif <query>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, { text: box('🎬 *GIF SEARCH*', '📌 *Usage:* .gif <query>\n\n💡 *Examples:*\n.gif funny cat\n.gif celebration\n.gif dancing') });
    await sock.sendMessage(jid, { text: box('🎬 *GIF SEARCH*', '_Searching for *' + query + '*..._') });
    const offset = Math.floor(Math.random() * 20);
    try {
      const data = await fetchJSON('https://tenor.googleapis.com/v2/search?q=' + encodeURIComponent(query) + '&key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=20&pos=' + offset);
      if (!data?.results?.length) throw new Error();
      const pick = data.results[Math.floor(Math.random() * data.results.length)];
      const gifUrl = pick.media_formats?.gif?.url || pick.media_formats?.tinygif?.url;
      if (!gifUrl) throw new Error();
      const buf = await fetchBuffer(gifUrl);
      await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n🎬 *' + (pick.title || query) + '*' }, { quoted: msg });
    } catch (_) {
      try {
        const data = await fetchJSON('https://api.giphy.com/v1/gifs/search?q=' + encodeURIComponent(query) + '&api_key=dc6zaTOxFJmzC&limit=20&offset=' + offset);
        if (!data?.data?.length) throw new Error();
        const pick = data.data[Math.floor(Math.random() * data.data.length)];
        const buf = await fetchBuffer(pick.images?.original?.url);
        await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n🎬 *' + query + '*' }, { quoted: msg });
      } catch (_2) { /* silent — no reply if both sources fail */ }
    }
  },
};

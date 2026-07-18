'use strict';
const { box } = require('../utils/format');
const https = require('https');
const http  = require('http');
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}
function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, res => {
      if ([301,302,303].includes(res.statusCode) && res.headers.location) return fetchBuf(res.headers.location).then(resolve).catch(reject);
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks))); res.on('error', reject);
    }).on('error', reject);
  });
}
module.exports = {
  name: 'wallpaper', aliases: ['wall', 'wp', 'bg', 'background'],
  category: 'media', description: 'Get HD wallpapers. Usage: .wallpaper <query>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim() || 'nature';
    await sock.sendMessage(jid, { text: box('🖼️ *WALLPAPER*', '_Searching for *' + query + '*..._') });
    try {
      const data = await fetchJSON('https://api.unsplash.com/photos/random?query=' + encodeURIComponent(query) + '&orientation=portrait&client_id=Uo_Y7AR5yUuI3-bQeOkeFLJwzCJDm3bvQ5gY5xQsKq8');
      if (!data?.urls) throw new Error();
      const buf    = await fetchBuf(data.urls.regular || data.urls.full);
      const author = data.user?.name || 'Unknown';
      const desc   = data.description || data.alt_description || query;
      await sock.sendMessage(jid, { image: buf, caption: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n🖼️ *' + desc.slice(0, 60) + '*\n📸 _Photo by ' + author + ' on Unsplash_\n🔍 Query: _' + query + '_' }, { quoted: msg });
    } catch (_) {
      try {
        const seed = Math.floor(Math.random() * 1000);
        const buf  = await fetchBuf('https://picsum.photos/seed/' + seed + '/1080/1920');
        if (!buf || buf.length < 1000) return; // silent
        await sock.sendMessage(jid, { image: buf, caption: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n🖼️ *Random Wallpaper*\n🔍 _' + query + '_' }, { quoted: msg });
      } catch (_2) { /* silent */ }
    }
  },
};

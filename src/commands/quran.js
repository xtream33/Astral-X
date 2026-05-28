'use strict';
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
  name: 'quran',
  aliases: ['quranverse', 'ayah', 'surah', 'islamic'],
  category: 'utility',
  description: 'Get Quran verse. Usage: .quran <surah>:<ayah>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text: box('☪️ *QURAN*', '📌 *Usage:* .quran <surah>:<ayah>\n\n💡 *Examples:*\n.quran 1:1\n.quran 2:255  _(Ayatul Kursi)_\n.quran 112:1\n.quran 36:1'),
    });
    const ref   = args.join('').replace(/[^\d:]/g, '');
    const parts = ref.split(':');
    const surah = parseInt(parts[0]) || 2;
    const ayah  = parseInt(parts[1]) || 255;
    await sock.sendMessage(jid, { text: box('☪️ *QURAN*', '_Fetching *' + surah + ':' + ayah + '*..._') });
    try {
      const [arData, enData, infoData] = await Promise.all([
        fetchJSON('https://api.alquran.cloud/v1/ayah/' + surah + ':' + ayah + '/ar.alafasy'),
        fetchJSON('https://api.alquran.cloud/v1/ayah/' + surah + ':' + ayah + '/en.asad'),
        fetchJSON('https://api.alquran.cloud/v1/surah/' + surah),
      ]);
      const arabic    = arData?.data?.text;
      const english   = enData?.data?.text;
      const surahName = infoData?.data?.englishName || ('Surah ' + surah);
      if (!arabic && !english) return; // silent
      await sock.sendMessage(jid, {
        text: box('☪️ *' + surahName + ' [' + surah + ':' + ayah + ']*',
          (arabic  ? '🕌 *Arabic:*\n' + arabic  + '\n\n' : '') +
          (english ? '📖 *English:*\n' + english : '')),
      }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

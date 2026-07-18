'use strict';
const { fetchBuffer } = require('../utils/ytdlp');

function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'country',
  aliases: ['nation', 'countryinfo', 'flag', 'geography'],
  category: 'education',
  description: 'Get country info and flag. Usage: .country <name>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const name = args.join(' ').trim();
    if (!name) return sock.sendMessage(jid, { text: '🌍 Usage: *.country <country name>*\n\nExamples:\n• .country Uganda\n• .country Japan\n• .country Nigeria' });
    await sock.sendMessage(jid, { text: '🌍 _Fetching info for *' + name + '*..._' });
    try {
      const data = await fetchJSON('https://restcountries.com/v3.1/name/' + encodeURIComponent(name) + '?fullText=false');
      if (!Array.isArray(data) || !data[0]) throw new Error('not found');
      const c      = data[0];
      const langs  = Object.values(c.languages || {}).join(', ') || 'N/A';
      const curr   = Object.values(c.currencies || {}).map(x => x.name + ' (' + x.symbol + ')').join(', ') || 'N/A';
      const region = c.region + (c.subregion ? ' / ' + c.subregion : '');
      const pop    = (c.population || 0).toLocaleString();
      const area   = (c.area || 0).toLocaleString();
      const borders = (c.borders || []).join(', ') || 'None';

      const caption =
        (c.flag || '🌍') + ' *' + c.name.common + '* (' + (c.name.official || c.name.common) + ')\n' +
        '━━━━━━━━━━━━━━\n' +
        '🏙️ *Capital:*    ' + (c.capital?.[0] || 'N/A') + '\n' +
        '🌍 *Region:*     ' + region + '\n' +
        '👥 *Population:* ' + pop + '\n' +
        '📐 *Area:*       ' + area + ' km²\n' +
        '🗣️ *Languages:*  ' + langs + '\n' +
        '💱 *Currency:*   ' + curr + '\n' +
        '📞 *Dial Code:*  +' + (c.idd?.root || '') + (c.idd?.suffixes?.[0] || '') + '\n' +
        '🚗 *Drive Side:* ' + (c.car?.side || 'N/A') + '\n' +
        '🌐 *TLD:*        ' + (c.tld?.[0] || 'N/A') + '\n' +
        '🗺️ *Borders:*    ' + borders + '\n' +
        '━━━━━━━━━━━━━━\n' +
        '_Powered by ASTRA-X_';

      // Try to send flag image
      if (c.flags?.png) {
        try {
          const buf = await fetchBuffer(c.flags.png);
          return await sock.sendMessage(jid, { image: buf, caption });
        } catch (_) {}
      }
      await sock.sendMessage(jid, { text: caption });
    } catch (_) {
      await sock.sendMessage(jid, { text: '❌ Country not found: *' + name + '*\n\nTry the full English name.' });
    }
  },
};

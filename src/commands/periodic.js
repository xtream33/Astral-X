'use strict';
const { ask } = require('../utils/gemini');

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
  name: 'periodic',
  aliases: ['element', 'atom', 'chemistry', 'chem'],
  category: 'education',
  description: 'Get periodic table element info. Usage: .periodic <name or symbol>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const q   = args.join(' ').trim();
    if (!q) return sock.sendMessage(jid, { text: '⚗️ Usage: *.periodic <element name or symbol>*\n\nExamples:\n• .periodic Gold\n• .periodic Au\n• .periodic Hydrogen\n• .periodic 79' });
    await sock.sendMessage(jid, { text: '⚗️ _Looking up element: *' + q + '*..._' });
    try {
      // Try API first
      const data = await fetchJSON('https://neelpatel05.pythonanywhere.com/element/atomicnumber?atomicnumber=' +
        encodeURIComponent(q)).catch(() => null);

      if (data && data.name) {
        await sock.sendMessage(jid, {
          text:
            '⚗️ *' + data.name + ' (' + data.symbol + ')*\n' +
            '━━━━━━━━━━━━━━\n' +
            '🔢 Atomic Number: *' + data.atomicnumber + '*\n' +
            '⚖️ Atomic Mass:   *' + data.atomicmass + '*\n' +
            '🗂️ Group:         *' + (data.groupblock || 'N/A') + '*\n' +
            '🌡️ Melting Point: *' + (data.meltingpoint || 'N/A') + ' K*\n' +
            '💧 Boiling Point: *' + (data.boilingpoint || 'N/A') + ' K*\n' +
            '🔬 Phase:         *' + (data.standardstate || 'N/A') + '*\n' +
            '━━━━━━━━━━━━━━\n' +
            '_Powered by ASTRA-X_',
        });
      } else {
        // Fallback to Gemini
        const reply = await ask(
          'Give detailed information about this chemical element: ' + q +
          '\n\nInclude: full name, symbol, atomic number, atomic mass, group, period, electron configuration, common uses, fun facts. Format clearly.'
        );
        await sock.sendMessage(jid, {
          text: '⚗️ *Element: ' + q + '*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
        }, { quoted: msg });
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Element not found: *' + q + '*\n\nTry the full name, symbol or atomic number.' });
    }
  },
};

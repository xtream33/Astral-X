'use strict';

function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'gold',
  aliases: ['goldprice', 'silver', 'silverprice', 'xau', 'xag', 'metals'],
  category: 'finance',
  description: 'Current gold & silver prices. Usage: .gold',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '🥇 _Fetching gold & silver prices..._' });
    try {
      // Free metals API
      const data = await fetchJSON('https://api.metals.live/v1/spot');
      const gold   = data?.find(m => m.gold)?.gold     || data?.gold;
      const silver = data?.find(m => m.silver)?.silver || data?.silver;

      const perGramG = gold   ? (gold   / 31.1035).toFixed(2) : 'N/A';
      const perGramS = silver ? (silver / 31.1035).toFixed(4) : 'N/A';

      await sock.sendMessage(jid, {
        text:
          '🥇 *Precious Metals Prices (USD)*\n' +
          '━━━━━━━━━━━━━━\n' +
          '🥇 *Gold*\n' +
          '   Per Troy Oz:  $' + (gold   ? Number(gold).toLocaleString('en-US', {maximumFractionDigits:2})   : 'N/A') + '\n' +
          '   Per Gram:     $' + perGramG + '\n\n' +
          '🥈 *Silver*\n' +
          '   Per Troy Oz:  $' + (silver ? Number(silver).toLocaleString('en-US', {maximumFractionDigits:2}) : 'N/A') + '\n' +
          '   Per Gram:     $' + perGramS + '\n' +
          '━━━━━━━━━━━━━━\n' +
          '🕐 Updated: ' + new Date().toUTCString() + '\n' +
          '_Powered by ASTRA-X_',
      });
    } catch (_) {
      // Fallback: goldapi.io free
      try {
        const data = await fetchJSON('https://www.goldapi.io/api/XAU/USD');
        const price = data?.price;
        const pg    = price ? (price / 31.1035).toFixed(2) : 'N/A';
        await sock.sendMessage(jid, {
          text:
            '🥇 *Gold Price (USD)*\n━━━━━━━━━━━━━━\n' +
            '💵 Per Troy Oz: $' + (price ? Number(price).toLocaleString() : 'N/A') + '\n' +
            '⚖️ Per Gram:    $' + pg + '\n' +
            '📊 Change 24h:  ' + (data?.ch ? (data.ch > 0 ? '📈 +' : '📉 ') + data.ch.toFixed(2) : 'N/A') + '\n' +
            '━━━━━━━━━━━━━━\n_Powered by ASTRA-X_',
        });
      } catch(e) {
        await sock.sendMessage(jid, { text: '❌ Could not fetch metals prices. Try again later.' });
      }
    }
  },
};

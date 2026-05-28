'use strict';
const { box } = require('../utils/format');
const { ask } = require('../utils/gemini');
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
  name: 'stock', aliases: ['stocks', 'share', 'shares', 'market', 'nasdaq'],
  category: 'finance', description: 'Get stock price. Usage: .stock <symbol>',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const symbol = (args[0] || '').toUpperCase().trim();
    if (!symbol) return sock.sendMessage(jid, { text: box('📊 *STOCK PRICE*', '📌 *Usage:* .stock <symbol>\n\n💡 *Examples:*\n.stock AAPL   (Apple)\n.stock GOOGL  (Google)\n.stock TSLA   (Tesla)\n.stock AMZN   (Amazon)') });
    await sock.sendMessage(jid, { text: box('📊 *STOCK PRICE*', '_Fetching *' + symbol + '* price..._') });
    try {
      const data = await fetchJSON('https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1d&range=1d');
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) throw new Error();
      const price = meta.regularMarketPrice, prev = meta.previousClose || meta.chartPreviousClose;
      const change = price && prev ? (price - prev).toFixed(2) : null;
      const pct = price && prev ? ((price - prev) / prev * 100).toFixed(2) : null;
      const sign = change >= 0 ? '📈 +' : '📉 ', clr = change >= 0 ? '🟢' : '🔴';
      const curr = meta.currency || 'USD';
      await sock.sendMessage(jid, { text: box('📊 *' + (meta.longName || symbol) + '*', '🏷️ *Symbol:* ' + symbol + '\n💵 *Price:*     ' + curr + ' ' + Number(price).toFixed(2) + '\n📊 *Change:*    ' + clr + ' ' + sign + change + ' (' + pct + '%)\n📈 *Day High:*  ' + curr + ' ' + (meta.regularMarketDayHigh?.toFixed(2) || '—') + '\n📉 *Day Low:*   ' + curr + ' ' + (meta.regularMarketDayLow?.toFixed(2)  || '—') + '\n📦 *Volume:*    ' + (meta.regularMarketVolume?.toLocaleString() || '—') + '\n🏢 *Exchange:*  ' + (meta.exchangeName || '—')) }, { quoted: msg });
    } catch (_) {
      try {
        const reply = await ask('Brief stock summary for ' + symbol + '. Include approximate price if known. Note data may not be current.');
        if (reply) await sock.sendMessage(jid, { text: box('📊 *STOCK: ' + symbol + '*', reply + '\n\n⚠️ _Data may not be real-time_') }, { quoted: msg });
      } catch (_2) { /* silent */ }
    }
  },
};

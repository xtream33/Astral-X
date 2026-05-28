'use strict';
const { box } = require('../utils/format');
function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}
function fmt(n) {
  if (!n && n !== 0) return 'N/A';
  if (Math.abs(n) >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
  if (Math.abs(n) >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
  if (Math.abs(n) >= 1000) return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return '$' + Number(n).toFixed(4);
}
module.exports = {
  name: 'crypto', aliases: ['bitcoin', 'btc', 'eth', 'coin', 'coinprice', 'cryptoprice'],
  category: 'finance', description: 'Live crypto prices. Usage: .crypto <coin>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const coin = (args[0] || '').toLowerCase().trim();
    if (!coin) return sock.sendMessage(jid, { text: box('💰 *CRYPTO PRICE*', '📌 *Usage:* .crypto <coin>\n\n💡 *Examples:*\n.crypto bitcoin\n.crypto ethereum\n.crypto BTC\n.crypto solana') });
    await sock.sendMessage(jid, { text: box('💰 *CRYPTO PRICE*', '_Fetching *' + coin.toUpperCase() + '* price..._') });
    try {
      let data = await fetchJSON('https://api.coingecko.com/api/v3/coins/' + coin + '?localization=false&tickers=false&community_data=false&developer_data=false').catch(() => null);
      if (!data?.name) {
        const list = await fetchJSON('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false');
        const found = list.find(c => c.symbol?.toLowerCase() === coin || c.name?.toLowerCase() === coin);
        if (!found) throw new Error('Coin not found');
        data = await fetchJSON('https://api.coingecko.com/api/v3/coins/' + found.id + '?localization=false&tickers=false&community_data=false&developer_data=false');
      }
      if (!data?.market_data) throw new Error('No market data');
      const p = data.market_data, chg = p.price_change_percentage_24h?.toFixed(2);
      const sign = chg >= 0 ? '📈 +' : '📉 ', clr = chg >= 0 ? '🟢' : '🔴';
      await sock.sendMessage(jid, { text: box('💰 *' + data.name + ' (' + data.symbol?.toUpperCase() + ')*', '💵 *Price:*       ' + fmt(p.current_price?.usd) + '\n📊 *24h Change:*  ' + clr + ' ' + sign + chg + '%\n📈 *24h High:*    ' + fmt(p.high_24h?.usd) + '\n📉 *24h Low:*     ' + fmt(p.low_24h?.usd) + '\n🏆 *Market Cap:*  ' + fmt(p.market_cap?.usd) + '\n📦 *Volume 24h:*  ' + fmt(p.total_volume?.usd) + '\n🚀 *All Time High:* ' + fmt(p.ath?.usd)) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('💰 *CRYPTO PRICE*', '❌ Coin not found: *' + coin + '*\n\nTry:\n.crypto bitcoin\n.crypto ethereum\n.crypto BTC') });
    }
  },
};

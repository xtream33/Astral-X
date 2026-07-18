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
  name: 'currency', aliases: ['convert', 'exchange', 'fx', 'rate'],
  category: 'finance', description: 'Convert currency. Usage: .currency <amount> <FROM> <TO>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args.length < 3) return sock.sendMessage(jid, { text: box('💱 *CURRENCY CONVERTER*', '📌 *Usage:* .currency <amount> <FROM> <TO>\n\n💡 *Examples:*\n.currency 100 USD UGX\n.currency 50 EUR GBP\n.currency 1000 KES USD\n\n_Supports 160+ currencies_') });
    const amount = parseFloat(args[0]), from = args[1].toUpperCase(), to = args[2].toUpperCase();
    if (isNaN(amount)) return sock.sendMessage(jid, { text: box('💱 *CURRENCY CONVERTER*', '❌ Invalid amount. Use a number.\n\nExample: .currency *100* USD UGX') });
    await sock.sendMessage(jid, { text: box('💱 *CURRENCY CONVERTER*', '_Converting *' + amount + ' ' + from + '* → *' + to + '*..._') });
    try {
      const data = await fetchJSON('https://api.exchangerate-api.com/v4/latest/' + from);
      const rate = data.rates?.[to];
      if (!rate) throw new Error('Currency not found: ' + to);
      const result = (amount * rate).toLocaleString('en-US', { maximumFractionDigits: 4 });
      await sock.sendMessage(jid, { text: box('💱 *CURRENCY CONVERTER*', '💰 *' + amount.toLocaleString() + ' ' + from + '*\n    = *' + result + ' ' + to + '*\n━━━━━━━━━━━━━━\n📊 *Rate:* 1 ' + from + ' = ' + rate.toFixed(6) + ' ' + to + '\n📅 *Updated:* ' + (data.date || 'Today')) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('💱 *CURRENCY CONVERTER*', '❌ Conversion failed.\n\nUse valid currency codes like:\nUSD  EUR  UGX  KES  GBP  JPY  ZAR\n\nError: ' + e.message) });
    }
  },
};

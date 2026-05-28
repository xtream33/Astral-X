'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'toss', aliases: ['cointoss', 'headstails', 'flipcoin', 'coinflip2'],
  category: 'fun', description: 'Toss a coin. Usage: .toss [count]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const n   = Math.min(parseInt(args[0]) || 1, 10);
    const results = Array.from({ length: n }, () => Math.random() < 0.5 ? '🪙 Heads' : '🥈 Tails');
    const heads = results.filter(r => r.includes('Heads')).length, tails = n - heads;
    const body  = n === 1
      ? '🪙 *' + results[0].split(' ')[1] + '!*'
      : '*Results:*\n' + results.map((r, i) => (i + 1) + '. ' + r).join('\n') + '\n━━━━━━━━━━━━━━\n📊 Heads: *' + heads + '*  |  Tails: *' + tails + '*';
    await sock.sendMessage(jid, { text: box('🪙 *COIN TOSS*', body) }, { quoted: msg });
  },
};

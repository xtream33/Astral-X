'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'howrich', aliases: ['rich', 'wealth', 'networth', 'howpoor'],
  category: 'fun', description: 'Check how rich you are 💰',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const name = args.join(' ').trim() || msg.pushName || 'You';
    const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pct = ((seed * 7919) % 100) + 1;
    const amount = (((seed * 1337) % 9999) + 1).toLocaleString();
    const level = pct >= 90 ? '💎 Billionaire' : pct >= 70 ? '🏆 Millionaire' : pct >= 50 ? '💼 Upper Middle Class' : pct >= 30 ? '🏠 Middle Class' : '😅 Broke (for now!)';
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    await sock.sendMessage(jid, { text: box('💰 *WEALTH METER*', '👤 *' + name + '*\n━━━━━━━━━━━━━━\n\n' + bar + ' ' + pct + '%\n\n🏷️ *Status:* ' + level + '\n💵 *Net Worth:* $' + amount + ',000\n\n_ASTRA-X Fortune Calculator™_ 😄') }, { quoted: msg });
  },
};

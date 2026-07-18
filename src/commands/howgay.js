'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'howgay', aliases: ['gay', 'rainbow', 'pride'],
  category: 'fun', description: 'Fun rainbow-o-meter! 🌈',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const name = args.join(' ').trim() || msg.pushName || 'You';
    const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const pct = ((seed * 6133) % 101);
    const bar = '🌈'.repeat(Math.round(pct / 10)) + '⬜'.repeat(10 - Math.round(pct / 10));
    await sock.sendMessage(jid, { text: box('🌈 *RAINBOW-O-METER*', '👤 *' + name + '*\n━━━━━━━━━━━━━━\n\n' + bar + '\n\n📊 Result: *' + pct + '%* fabulous!\n\n_ASTRA-X Fun Meter™ — just for laughs!_ 😄') }, { quoted: msg });
  },
};

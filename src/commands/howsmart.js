'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'howsmart', aliases: ['iq', 'smart', 'genius', 'brain'],
  category: 'fun', description: 'Check your IQ score 🧠',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const name = args.join(' ').trim() || msg.pushName || 'You';
    const seed = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const iq = ((seed * 9371) % 80) + 70;
    const lvl = iq >= 145 ? '🧬 Genius' : iq >= 130 ? '🎓 Gifted' : iq >= 115 ? '📚 Above Average' : iq >= 100 ? '✅ Average' : '😴 Below Average';
    const bar = '█'.repeat(Math.round((iq - 70) / 8)) + '░'.repeat(10 - Math.round((iq - 70) / 8));
    await sock.sendMessage(jid, { text: box('🧠 *IQ METER*', '👤 *' + name + '*\n━━━━━━━━━━━━━━\n\n' + bar + '\n\n📊 *IQ Score:* ' + iq + '\n🏷️ *Level:* ' + lvl + '\n\n_ASTRA-X IQ Institute™_ 😄') }, { quoted: msg });
  },
};

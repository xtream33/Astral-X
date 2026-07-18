'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'ship', category: 'fun', description: 'Ship two people. Usage: .ship @user1 @user2',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const m   = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const n1  = m[0] ? '@' + m[0].split('@')[0] : args[0];
    const n2  = m[1] ? '@' + m[1].split('@')[0] : args[1];
    if (!n1 || !n2) return sock.sendMessage(jid, { text: box('💘 *SHIP*', '📌 *Usage:* .ship @person1 @person2\n\nOr: .ship Name1 Name2') });
    const pct   = Math.floor(Math.random() * 101);
    const bar   = '❤️'.repeat(Math.round(pct / 10)) + '🖤'.repeat(10 - Math.round(pct / 10));
    const label = pct >= 80 ? '💍 Perfect match!' : pct >= 60 ? '💕 Great couple!' : pct >= 40 ? '💛 Could work!' : pct >= 20 ? '💔 Needs work...' : '😬 Not a match!';
    await sock.sendMessage(jid, { text: box('💘 *SHIP RESULT*', n1 + ' ❤️ ' + n2 + '\n━━━━━━━━━━━━━━\n\n' + bar + '\n\n💯 *' + pct + '%* — ' + label), mentions: m }, { quoted: msg });
  },
};

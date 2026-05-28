'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'dice', aliases: ['roll', 'rolldice', 'd6', 'die'],
  category: 'fun', description: 'Roll a dice. Usage: .dice [sides]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const sides = Math.min(parseInt(args[0]) || 6, 100);
    const faces = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'];
    const r = Math.floor(Math.random() * sides) + 1;
    const face = sides === 6 ? faces[r - 1] + ' ' : '';
    await sock.sendMessage(jid, { text: box('🎲 *DICE ROLL*', '🎲 Rolling a *d' + sides + '*...\n━━━━━━━━━━━━━━\n\n' + face + '*' + r + '*\n\n_Out of ' + sides + ' sides_') }, { quoted: msg });
  },
};

'use strict';
const { box } = require('../utils/format');
const ROASTS = [
  'I\'d agree with you but then we\'d both be wrong. 😂',
  'You\'re proof that even evolution makes mistakes. 🦕',
  'Talking to you is like reading terms & conditions. 📄',
  'You must have been born on a highway — that\'s where most accidents happen. 🛣️',
  'You\'re like a cloud — when you disappear, it\'s a beautiful day. ☀️',
  'I\'d roast you harder but my mom said I\'m not allowed to burn trash. 🗑️',
  'You have the perfect face for radio. 📻',
  'I\'ve seen better arguments in a kindergarten class. 👶',
  'You\'re not stupid. You just have bad luck thinking. 🍀',
  'If brains were petrol, you wouldn\'t have enough to power an ant\'s scooter. 🛵',
];
module.exports = {
  name: 'roast', aliases: ['burn', 'savage', 'diss', 'insult'],
  category: 'fun', description: 'Get roasted 🔥',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const name = args.join(' ').trim() || msg.pushName || 'you';
    await sock.sendMessage(jid, { text: box('🔥 *ROASTED!*', '🎯 *' + name + '*...\n━━━━━━━━━━━━━━\n\n' + ROASTS[Math.floor(Math.random() * ROASTS.length)] + '\n\n_😂 All in good fun!_') }, { quoted: msg });
  },
};

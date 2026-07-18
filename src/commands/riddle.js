'use strict';
const { box } = require('../utils/format');
const RIDDLES = [
  { q: 'I have cities, but no houses live there. Mountains, but no trees grow. Water, but no fish swim. Roads, but no cars drive. What am I?', a: 'A map 🗺️' },
  { q: 'The more you take, the more you leave behind. What am I?', a: 'Footsteps 👣' },
  { q: 'I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?', a: 'An echo 🔊' },
  { q: 'What has keys but no locks, space but no room, and you can enter but cannot go inside?', a: 'A keyboard ⌨️' },
  { q: 'I am always hungry, I must always be fed. The finger I touch turns red. What am I?', a: 'Fire 🔥' },
  { q: 'What can you catch but never throw?', a: 'A cold 🤧' },
  { q: 'I have hands but cannot clap. What am I?', a: 'A clock ⏰' },
  { q: 'What gets wetter as it dries?', a: 'A towel 🛁' },
  { q: 'I have a head and a tail but no body. What am I?', a: 'A coin 🪙' },
  { q: 'The more you have of it, the less you see. What is it?', a: 'Darkness 🌑' },
];
const pending = {};
module.exports = {
  name: 'riddle', aliases: ['puzzle', 'brainteaser', 'guess'],
  category: 'fun', description: 'Get a riddle. Use .riddle answer to reveal.',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args[0]?.toLowerCase() === 'answer' || args[0]?.toLowerCase() === 'reveal') {
      const last = pending[jid];
      if (!last) return sock.sendMessage(jid, { text: box('🧩 *RIDDLE*', '❓ No active riddle.\nUse *.riddle* to get one first!') });
      return sock.sendMessage(jid, { text: box('🧩 *RIDDLE — ANSWER*', '💡 *' + last + '*') }, { quoted: msg });
    }
    const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    pending[jid] = r.a;
    await sock.sendMessage(jid, { text: box('🧩 *RIDDLE*', r.q + '\n━━━━━━━━━━━━━━\n_Type *.riddle answer* to reveal_ 🤔') }, { quoted: msg });
  },
};

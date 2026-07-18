'use strict';
const { box } = require('../utils/format');
const ANSWERS = [
  '✅ Yes, definitely!', '✅ Without a doubt!', '✅ Most likely.',
  '✅ Signs point to yes.', '🔮 Ask again later.', '🤔 Cannot predict now.',
  '❌ Don\'t count on it.', '❌ My reply is no.', '❌ Very doubtful.',
  '🎱 It is certain!', '🎱 Outlook not so good.', '🤷 Who knows?',
];
module.exports = {
  name: '8ball', category: 'fun', description: 'Magic 8 ball. Usage: .8ball <question>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: box('🎱 *MAGIC 8 BALL*', '📌 *Usage:* .8ball <question>\n\n💡 *Example:*\n.8ball Will I win today?\n.8ball Should I go out tonight?') });
    await sock.sendMessage(jid, { text: box('🎱 *MAGIC 8 BALL*', '❓ _' + args.join(' ') + '_\n━━━━━━━━━━━━━━\n\n' + ANSWERS[Math.floor(Math.random() * ANSWERS.length)]) }, { quoted: msg });
  },
};

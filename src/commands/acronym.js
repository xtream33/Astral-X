'use strict';
const { ask } = require('../utils/gemini');

module.exports = {
  name: 'acronym',
  aliases: ['abbr', 'abbreviation', 'meaning', 'fullform', 'fullmeaning'],
  category: 'education',
  description: 'Get the full meaning of any acronym. Usage: .acronym <abbr>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const abbr = args.join(' ').trim().toUpperCase();
    if (!abbr) return sock.sendMessage(jid, { text: '🔤 Usage: *.acronym <abbreviation>*\n\nExamples:\n• .acronym NASA\n• .acronym HIV\n• .acronym PDF\n• .acronym LOL' });
    await sock.sendMessage(jid, { text: '🔤 _Looking up *' + abbr + '*..._' });
    try {
      const reply = await ask(
        'What does the acronym/abbreviation "' + abbr + '" stand for?\n\n' +
        'If it has multiple meanings in different fields (medical, tech, general, etc.), list all of them.\n' +
        'Also give a brief explanation of each. Be concise.'
      );
      await sock.sendMessage(jid, {
        text: '🔤 *' + abbr + '*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
    }
  },
};

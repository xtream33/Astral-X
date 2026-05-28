'use strict';
const { box } = require('../utils/format');
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'antibadword', aliases: ['nobadword', 'wordfilter'],
  category: 'anti', description: 'Toggle bad word filter. Usage: .antibadword on/off',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🤬 *ANTI BAD WORD*', '❌ This command only works in groups.') });
    const result = smartToggle('antibadword:' + jid, parseOnOff(args[0]));
    await sock.sendMessage(jid, { text: toggleMsg('Anti Bad Word', '🤬', result, 'Bad words auto-deleted & warned', 'Bad word filter disabled') });
  },
};

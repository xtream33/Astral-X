'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'antibot',
  aliases: ['nobot','blockbot'],
  category: 'anti',
  description: 'Toggle Anti Bot. Responds with already-on/off if no change needed.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, { text: '❌ This command only works inside groups. Please use it in a group chat. 🙏' });
    }
    const scopeKey = 'antibot:' + jid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle(scopeKey, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Bot', '🤖', result, 'Bot numbers blocked on join', 'Bot protection disabled'),
    });
  },
};

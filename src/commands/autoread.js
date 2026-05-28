'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autoread',
  aliases: ['autoreadmsgs'],
  category: 'auto',
  description: 'Toggle Auto Read. Responds with already-on/off if no change needed.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;

    const scopeKey = 'autoread:' + userId;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle(scopeKey, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto Read', '📖', result, 'Messages auto-read (blue ticks sent)', 'Messages no longer auto-read'),
    });
  },
};

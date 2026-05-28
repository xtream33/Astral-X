'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autotyping',
  aliases: ['autotyping','typingindicator'],
  category: 'auto',
  description: 'Toggle Auto Typing. Responds with already-on/off if no change needed.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;

    const scopeKey = 'autotyping:' + userId;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle(scopeKey, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto Typing', '✍️', result, 'Typing indicator shown while processing', 'Typing indicator disabled'),
    });
  },
};

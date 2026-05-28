'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autorecording',
  aliases: ['autorecord','recordindicator'],
  category: 'auto',
  description: 'Toggle Auto Recording. Responds with already-on/off if no change needed.',
  execute: async (sock, msg, args, userId) => {
    const jid = msg.key.remoteJid;

    const scopeKey = 'autorecording:' + userId;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle(scopeKey, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto Recording', '🎙️', result, 'Recording indicator shown while processing', 'Recording indicator disabled'),
    });
  },
};

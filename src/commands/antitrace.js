'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'antitrace',
  aliases: ['notrack','hidetrace','antispy'],
  category: 'privacy',
  description: 'Toggle anti-trace: removes metadata from forwarded media.',
  execute: async (sock, msg, args, userId) => {
    const jid    = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('antitrace:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Trace', '🕵️', result,
        'Metadata stripped from forwarded media\n┃ • Source of forwarded files is hidden',
        'Forwarded media sent with original metadata'
      ),
    });
  },
};

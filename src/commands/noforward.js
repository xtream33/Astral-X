'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'noforward',
  aliases: ['antiforward','blockforward','stopforward'],
  category: 'privacy',
  description: 'Toggle anti-forward tag. Usage: .noforward on / .noforward off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('noforward:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Forward Tag', '🚫', result,
        'Forward labels stripped from all bot messages\n┃ • Messages appear as original content',
        'Messages sent normally with forward labels'
      ),
    });
  },
};

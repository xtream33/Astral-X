'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'autoreact',
  aliases: ['autoemoji'],
  category: 'auto',
  description: 'Toggle auto-react. Usage: .autoreact on / .autoreact off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('autoreact:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Auto React', '❤️', result,
        'Bot reacts to every message automatically',
        'Auto-react disabled'
      ),
    });
  },
};

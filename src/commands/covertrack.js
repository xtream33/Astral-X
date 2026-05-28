'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'covertrack',
  aliases: ['hideread','coverviews','fakeread'],
  category: 'privacy',
  description: 'Toggle cover track. Usage: .covertrack on / .covertrack off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('covertrack:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Cover Track', '🫥', result,
        'Status views tracked silently\n┃ • Your name hidden from viewer lists',
        'Status viewing back to normal'
      ),
    });
  },
};

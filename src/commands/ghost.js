'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'ghost',
  aliases: ['invisible','hide','offline'],
  category: 'privacy',
  description: 'Toggle ghost mode. Usage: .ghost on / .ghost off',
  execute: async (sock, msg, args, userId) => {
    const jid     = msg.key.remoteJid;
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('ghost:' + userId, forceOn);
    try {
      await sock.sendPresenceUpdate(result.state ? 'unavailable' : 'available');
    } catch (_) {}
    await sock.sendMessage(jid, {
      text: toggleMsg('Ghost Mode', '👻', result,
        'You appear offline to everyone\n┃ • No typing/recording indicator\n┃ • Still receives & processes all messages',
        'You appear online normally\n┃ • Typing indicator active'
      ),
    });
  },
};

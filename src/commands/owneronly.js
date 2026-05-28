'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'owneronly',
  category: 'settings',
  description: 'Restrict bot to owner only. Usage: .owneronly on / .owneronly off',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Only the bot owner can use this command.' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('owneronly:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Owner Only Mode', '🔒', result,
        'Only YOU can use bot commands.\n┃ Everyone else is ignored.',
        'Anyone can now use bot commands.'
      ),
    });
  },
};

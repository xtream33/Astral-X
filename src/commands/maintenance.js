'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'maintenance',
  aliases: ['maintain'],
  category: 'owner',
  description: 'Toggle maintenance mode — only owner can use bot.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ This command is only available to the bot owner. 🙏' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('maintenance:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text:
        toggleMsg('Maintenance Mode', '🔧', result,
          'Bot is now in maintenance mode\n┃ • Only you can use commands',
          'Bot is back online for everyone 🎉'
        ),
    });
  },
};

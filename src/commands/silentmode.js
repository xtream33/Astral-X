'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'silentmode',
  aliases: ['silent','quietmode','hushmode'],
  category: 'privacy',
  description: 'Toggle silent mode: bot only responds to owner, ignores everyone else.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('silentmode:' + userId, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Silent Mode', '🤫', result,
        'Bot only responds to you\n┃ • All other users are silently ignored',
        'Bot responds to everyone normally 🎉'
      ),
    });
  },
};

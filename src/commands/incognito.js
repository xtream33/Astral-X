'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'incognito',
  aliases: ['stealth','hideme','anon','anonmode'],
  category: 'privacy',
  description: 'Incognito mode: ghost + no read receipts + hidden last seen all at once.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('incognito:' + userId, forceOn);

    try {
      if (result.state) {
        await sock.sendPresenceUpdate('unavailable');
        await sock.updateReadReceiptsPrivacy('none').catch(() => {});
        await sock.updateLastSeenPrivacy('none').catch(() => {});
        await sock.updateOnlinePrivacy('match_last_seen').catch(() => {});
      } else {
        await sock.sendPresenceUpdate('available');
        await sock.updateReadReceiptsPrivacy('all').catch(() => {});
        await sock.updateLastSeenPrivacy('contacts').catch(() => {});
        await sock.updateOnlinePrivacy('all').catch(() => {});
      }
    } catch (_) {}

    await sock.sendMessage(jid, {
      text:
        toggleMsg('Incognito Mode', '🕵️', result,
          'Ghost mode ON\n┃ • Read receipts hidden\n┃ • Last seen hidden\n┃ • Online status hidden',
          'All privacy settings restored to normal'
        ),
    });
  },
};

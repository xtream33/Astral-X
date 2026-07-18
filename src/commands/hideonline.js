'use strict';
module.exports = {
  name: 'hideonline',
  aliases: ['hideactive','noactive','offlinemode'],
  category: 'privacy',
  description: 'Hide your online status from specific people. !hideonline @user',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    try {
      await sock.updateOnlinePrivacy('match_last_seen');
      await sock.updateLastSeenPrivacy('contacts');
      await sock.sendMessage(jid, {
        text:
          '✅ *Online Status Hidden*\n━━━━━━━━━━━━━━\n' +
          '👻 Your online status is now hidden from non-contacts.\n\n' +
          '_Tip: For full stealth use *!ghost* or *!incognito*._ 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message });
    }
  },
};

'use strict';
module.exports = {
  name: 'online',
  aliases: ['onlineprivacy','onlinestatus','onlinesetting'],
  category: 'privacy',
  description: 'Control who sees your online status. !online all / match',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const opt = (args[0] || '').toLowerCase();
    if (!opt) {
      return sock.sendMessage(jid, {
        text:
          '🟢 *Online Status Privacy*\n━━━━━━━━━━━━━━\n' +
          '  • *!online all* — Everyone sees when you\'re online\n' +
          '  • *!online match* — Only people who can see your last seen\n\n' +
          '_Choose one of the options above._',
      });
    }
    const val = opt === 'all' ? 'all' : 'match_last_seen';
    try {
      await sock.updateOnlinePrivacy(val);
      await sock.sendMessage(jid, {
        text:
          '✅ *Online Status Privacy Updated*\n━━━━━━━━━━━━━━\n' +
          '🟢 Online visibility: *' + (val === 'all' ? 'Everyone' : 'Match Last Seen') + '*\n\n' +
          '_Changes take effect immediately._ 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message });
    }
  },
};

'use strict';
module.exports = {
  name: 'lastseen',
  aliases: ['lastseenprivacy','mylastseen','lsp'],
  category: 'privacy',
  description: 'Control who sees your last seen. !lastseen all / contacts / none',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const opt = (args[0] || '').toLowerCase();
    const map = { all: 'all', everyone: 'all', contacts: 'contacts', contact: 'contacts', none: 'none', off: 'none', nobody: 'none', noone: 'none' };
    const val = map[opt];
    if (!val) {
      return sock.sendMessage(jid, {
        text:
          '🔒 *Last Seen Privacy*\n━━━━━━━━━━━━━━\n' +
          'Choose who can see your last seen:\n\n' +
          '  • *!lastseen all* — Everyone can see\n' +
          '  • *!lastseen contacts* — Only your contacts\n' +
          '  • *!lastseen none* — Nobody can see\n\n' +
          '_Your current setting has not been changed._',
      });
    }
    try {
      await sock.updateLastSeenPrivacy(val);
      await sock.sendMessage(jid, {
        text:
          '✅ *Last Seen Privacy Updated*\n━━━━━━━━━━━━━━\n' +
          '🔒 Who can see your last seen: *' + val.toUpperCase() + '*\n\n' +
          '_Changes take effect immediately._ 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to update last seen privacy.\n_Error: ' + e.message + '_' });
    }
  },
};

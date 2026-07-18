'use strict';
module.exports = {
  name: 'statusview',
  aliases: ['statusprivacy','whoseestatus','statusvisibility'],
  category: 'privacy',
  description: 'Control who sees your WhatsApp status. !statusview all / contacts / none',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const opt = (args[0] || '').toLowerCase();
    const map = { all: 'all', everyone: 'all', contacts: 'contacts', contact: 'contacts', none: 'none', off: 'none', nobody: 'none' };
    const val = map[opt];
    if (!val) {
      return sock.sendMessage(jid, {
        text:
          '👁️ *Status Privacy*\n━━━━━━━━━━━━━━\n' +
          '  • *!statusview all* — Everyone can view your status\n' +
          '  • *!statusview contacts* — Only contacts\n' +
          '  • *!statusview none* — Nobody\n\n' +
          '_Your current setting has not been changed._',
      });
    }
    try {
      await sock.updateStatusPrivacy(val);
      await sock.sendMessage(jid, { text: '✅ Status visibility: *' + val.toUpperCase() + '*\n\n_Changes take effect immediately._ 😊' });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message });
    }
  },
};

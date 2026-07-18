'use strict';
module.exports = {
  name: 'groupsprivacy',
  aliases: ['groupadd','whocanadd','addprivacy','groupaddprivacy'],
  category: 'privacy',
  description: 'Control who can add you to groups. !groupsprivacy all / contacts / none',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const opt = (args[0] || '').toLowerCase();
    const map = { all: 'all', everyone: 'all', contacts: 'contacts', contact: 'contacts', none: 'none', off: 'none', nobody: 'none', noone: 'none' };
    const val = map[opt];
    if (!val) {
      return sock.sendMessage(jid, {
        text:
          '👥 *Groups Add Privacy*\n━━━━━━━━━━━━━━\n' +
          'Choose who can add you to groups:\n\n' +
          '  • *!groupsprivacy all* — Anyone can add you\n' +
          '  • *!groupsprivacy contacts* — Only your contacts\n' +
          '  • *!groupsprivacy none* — Nobody can add you\n\n' +
          '_Your current setting has not been changed._',
      });
    }
    try {
      await sock.updateGroupsAddPrivacy(val);
      await sock.sendMessage(jid, {
        text:
          '✅ *Groups Privacy Updated*\n━━━━━━━━━━━━━━\n' +
          '👥 Who can add you to groups: *' + val.toUpperCase() + '*\n\n' +
          '_Changes take effect immediately._ 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message });
    }
  },
};

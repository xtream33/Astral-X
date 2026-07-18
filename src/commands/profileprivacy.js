'use strict';
module.exports = {
  name: 'profileprivacy',
  aliases: ['ppprivacy', 'photoprivacy', 'ppvisibility'],
  category: 'privacy',
  description: 'Control who sees your profile photo. !profileprivacy all / contacts / none',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const opt = (args[0] || '').toLowerCase();
    const map = { all: 'all', everyone: 'all', contacts: 'contacts', contact: 'contacts', none: 'none', off: 'none', nobody: 'none' };
    const val = map[opt];
    if (!val) {
      return sock.sendMessage(jid, {
        text:
          '🖼️ *Profile Photo Privacy*\n━━━━━━━━━━━━━━\n' +
          '  • *!profileprivacy all* — Everyone can see your photo\n' +
          '  • *!profileprivacy contacts* — Only contacts\n' +
          '  • *!profileprivacy none* — Nobody\n\n' +
          '_Your current setting has not been changed._',
      });
    }
    try {
      // Baileys exposes updateProfilePicturePrivacy on newer builds; fall back gracefully
      if (typeof sock.updateProfilePicturePrivacy === 'function') {
        await sock.updateProfilePicturePrivacy(val);
      } else {
        // Older Baileys: use the privacy settings path
        await sock.query({
          tag: 'iq',
          attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'privacy' },
          content: [{ tag: 'privacy', attrs: {}, content: [
            { tag: 'category', attrs: { name: 'profile', value: val } }
          ]}],
        });
      }
      await sock.sendMessage(jid, { text: '✅ Profile photo visibility: *' + val.toUpperCase() + '*\n\n_Changes take effect immediately._ 😊' });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to update profile photo privacy.\n_Error: ' + e.message + '_\n\n_Tip: Try updating it manually in WhatsApp → Settings → Privacy → Profile Photo._' });
    }
  },
};

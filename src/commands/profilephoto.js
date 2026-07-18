module.exports = {
  name: 'profilephoto', aliases: ['pprivacy'],
  category: 'privacy', description: 'Control who sees your profile photo. !profilephoto all/contacts/none',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    const opt = (args[0] || '').toLowerCase();
    const map = { all: 'all', contacts: 'contacts', contact: 'contacts', none: 'none', off: 'none' };
    const val = map[opt];
    if (!val) return sock.sendMessage(jid, { text: '❌ Usage: !profilephoto all / contacts / none' });
    try {
      await sock.updateProfilePicturePrivacy(val);
      await sock.sendMessage(jid, { text: '🖼️ Profile photo privacy: *' + val + '*' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

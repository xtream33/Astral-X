module.exports = {
  name: 'revoke',
  aliases: ['revokelink', 'resetlink', 'newlink'],
  category: 'group',
  description: 'Revoke and regenerate the group invite link',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    try {
      await sock.groupRevokeInvite(jid);
      const newCode = await sock.groupInviteCode(jid);
      await sock.sendMessage(jid, {
        text: '🔄 *Invite link revoked!*\n\n🔗 *New link:*\nhttps://chat.whatsapp.com/' + newCode,
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed (bot must be admin): ' + e.message }); }
  },
};

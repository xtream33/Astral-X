module.exports = {
  name: 'grouplink',
  aliases: ['invitelink', 'getlink', 'link'],
  category: 'group',
  description: 'Get group invite link',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    try {
      const code = await sock.groupInviteCode(jid);
      await sock.sendMessage(jid, { text: '🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/' + code });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed (bot must be admin): ' + e.message }); }
  },
};

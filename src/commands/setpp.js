const { downloadMediaMessage } = require('@whiskeysockets/baileys');
module.exports = {
  name: 'setpp',
  aliases: ['setpfp', 'updatepp', 'changepic'],
  category: 'owner',
  description: 'Set bot profile picture. Reply to an image with !setpp',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    const quoted  = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg  = msg.message?.imageMessage || quoted?.imageMessage;
    if (!imgMsg) return sock.sendMessage(jid, { text: '❌ Reply to an image with !setpp' });
    try {
      const target = quoted ? { ...msg, message: quoted } : msg;
      const buf    = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      await sock.updateProfilePicture(sock.user.id, buf);
      await sock.sendMessage(jid, { text: '✅ Profile picture updated!' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

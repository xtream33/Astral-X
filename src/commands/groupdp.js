const { downloadMediaMessage } = require('@whiskeysockets/baileys');
module.exports = {
  name: 'groupdp',
  aliases: ['setgrouppp', 'groupphoto', 'setgrouppic'],
  category: 'group',
  description: 'Set group profile picture. Reply to image with !groupdp',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.message?.imageMessage || quoted?.imageMessage;
    if (!imgMsg) return sock.sendMessage(jid, { text: '❌ Reply to an image with !groupdp' });
    try {
      const target = quoted ? { ...msg, message: quoted } : msg;
      const buf    = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      await sock.updateProfilePicture(jid, buf);
      await sock.sendMessage(jid, { text: '✅ Group photo updated!' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

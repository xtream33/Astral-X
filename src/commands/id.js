module.exports = {
  name: 'id',
  aliases: ['myid', 'jid', 'getid', 'uid'],
  category: 'info',
  description: 'Show your WhatsApp JID and group ID',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    await sock.sendMessage(jid, {
      text:
        '🆔 *Your Info*\n' +
        '━━━━━━━━━━━━━\n' +
        '📱 *Number:* +' + sender.split('@')[0] + '\n' +
        '🔑 *JID:* ' + sender +
        (jid.endsWith('@g.us') ? '\n\n👥 *Group ID:*\n' + jid : ''),
    });
  },
};

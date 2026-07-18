module.exports = {
  name: 'del',
  aliases: ['delete', 'delmsg', 'unsend'],
  category: 'group',
  description: 'Delete a message. Reply to any message with !del',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const ctx    = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (!quoted || !ctx?.stanzaId) return sock.sendMessage(jid, { text: '❌ Reply to a message with !del to delete it.' });
    try {
      await sock.sendMessage(jid, {
        delete: {
          remoteJid:   jid,
          id:          ctx.stanzaId,
          fromMe:      false,
          participant: ctx.participant,
        },
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Could not delete: ' + e.message + '\n(Bot must be admin to delete others\' messages)' }); }
  },
};

module.exports = {
  name: 'forward',
  aliases: ['fwd'],
  category: 'group',
  description: 'Forward a replied message. Reply to msg and use !forward',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const ctx    = msg.message?.extendedTextMessage?.contextInfo;
    const quoted = ctx?.quotedMessage;
    if (!quoted) return sock.sendMessage(jid, { text: '❌ Reply to a message with !forward to resend it.' });
    try {
      await sock.sendMessage(jid, {
        forward: { key: { remoteJid: jid, id: ctx.stanzaId, fromMe: false, participant: ctx.participant }, message: quoted },
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

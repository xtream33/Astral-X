module.exports = {
  name: 'react',
  aliases: ['reaction', 'emoji', 'like'],
  category: 'fun',
  description: 'React to a message. Reply with !react ❤️',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const ctx = msg.message?.extendedTextMessage?.contextInfo;
    if (!ctx?.stanzaId) return sock.sendMessage(jid, { text: '❌ Reply to a message with !react <emoji>' });
    const emoji = args[0] || '❤️';
    try {
      await sock.sendMessage(jid, {
        react: {
          text: emoji,
          key: { remoteJid: jid, id: ctx.stanzaId, fromMe: false, participant: ctx.participant },
        },
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

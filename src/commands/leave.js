module.exports = {
  name: 'leave',
  aliases: ['leavegroup', 'exit', 'bye'],
  category: 'group',
  description: 'Bot leaves the group. !leave (owner only)',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    await sock.sendMessage(jid, { text: '👋 Goodbye! Bot is leaving the group...' });
    await new Promise(r => setTimeout(r, 2000));
    try { await sock.groupLeave(jid); } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

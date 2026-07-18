module.exports = {
  name: 'restart', category: 'owner', description: 'Restart the bot session',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '\u274c Owner only command.' });
    await sock.sendMessage(jid, { text: '\ud83d\udd04 *Restarting bot...* Back in a few seconds.' });
    setTimeout(() => process.exit(0), 2000);
  }
};
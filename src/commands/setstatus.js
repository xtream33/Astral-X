module.exports = {
  name: 'setstatus',
  aliases: ['setabout', 'status', 'about'],
  category: 'owner',
  description: 'Change bot about/status text. !setstatus Powered by ASTRA-X',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: !setstatus <text>' });
    const text = args.join(' ');
    try {
      await sock.updateProfileStatus(text);
      await sock.sendMessage(jid, { text: '✅ Status updated to:\n_' + text + '_' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

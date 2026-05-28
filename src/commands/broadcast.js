const { getAllSessions } = require('../utils/socket');
module.exports = {
  name: 'broadcast', category: 'owner',
  description: 'Broadcast a message to all your groups. Usage: !broadcast <message>',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: !broadcast <message>' });
    const text = args.join(' ');
    try {
      const groups = await sock.groupFetchAllParticipating();
      const jids   = Object.keys(groups);
      if (!jids.length) return sock.sendMessage(jid, { text: '❌ No groups found.' });
      await sock.sendMessage(jid, { text: '📢 Broadcasting to *' + jids.length + '* groups...' });
      let sent = 0;
      for (const g of jids) {
        try {
          await sock.sendMessage(g, { text: '📢 *BROADCAST*\n━━━━━━━━━━━━━━━\n' + text + '\n━━━━━━━━━━━━━━━\n_— ASTRA-X Bot_' });
          sent++;
          await new Promise(r => setTimeout(r, 1500));
        } catch (_) {}
      }
      await sock.sendMessage(jid, { text: '✅ Broadcast sent to *' + sent + '/' + jids.length + '* groups.' });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Broadcast failed: ' + e.message });
    }
  }
};

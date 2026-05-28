module.exports = {
  name: 'disappear',
  aliases: ['vanish', 'ephemeral', 'selfdelete'],
  category: 'privacy',
  description: 'Set disappearing messages in a group. !disappear 24h / 7d / 90d / off',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us'))
      return sock.sendMessage(jid, { text: '❌ This command only works in groups.' });

    const opt = (args[0] || '').toLowerCase();
    const map = { '24h': 86400, '1d': 86400, '7d': 604800, '1w': 604800, '90d': 7776000, '3m': 7776000, 'off': 0, '0': 0 };
    const exp = map[opt];

    if (exp === undefined) return sock.sendMessage(jid, {
      text: '⏱️ *Disappearing Messages*\n\n*Options:*\n!disappear 24h  → 24 hours\n!disappear 7d   → 7 days\n!disappear 90d  → 90 days\n!disappear off  → Turn off',
    });

    try {
      await sock.groupToggleEphemeral(jid, exp);
      const label = exp === 0 ? 'OFF' : exp === 86400 ? '24 hours' : exp === 604800 ? '7 days' : '90 days';
      await sock.sendMessage(jid, { text: '⏱️ *Disappearing messages set to:* ' + label });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message + '\n\nBot must be group admin.' });
    }
  },
};

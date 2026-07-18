module.exports = {
  name: 'groupinfo',
  aliases: ['ginfo', 'grpinfo', 'groupstats'],
  category: 'group',
  description: 'Show full group information',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    try {
      const meta    = await sock.groupMetadata(jid);
      const admins  = meta.participants.filter(p => p.admin).length;
      const members = meta.participants.length;
      const created = meta.creation ? new Date(meta.creation * 1000).toLocaleString() : '—';
      await sock.sendMessage(jid, {
        text:
          '📊 *Group Information*\n' +
          '━━━━━━━━━━━━━━━━━━\n' +
          '📌 *Name:* ' + meta.subject + '\n' +
          '🆔 *ID:* ' + jid + '\n' +
          '👥 *Members:* ' + members + '\n' +
          '👑 *Admins:* ' + admins + '\n' +
          '📅 *Created:* ' + created + '\n' +
          (meta.desc ? '📝 *Description:*\n' + meta.desc : ''),
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

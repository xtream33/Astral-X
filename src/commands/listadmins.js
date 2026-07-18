module.exports = {
  name: 'listadmins',
  aliases: ['admins', 'getadmins', 'showadmins'],
  category: 'group',
  description: 'List all group admins',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    try {
      const meta   = await sock.groupMetadata(jid);
      const admins = meta.participants.filter(p => p.admin);
      if (!admins.length) return sock.sendMessage(jid, { text: '❌ No admins found.' });
      const text = '👑 *Group Admins (' + admins.length + ')*\n━━━━━━━━━━━━━━\n' +
        admins.map((a, i) => (i + 1) + '. @' + a.id.split('@')[0] + (a.admin === 'superadmin' ? ' 👑' : '')).join('\n');
      await sock.sendMessage(jid, { text, mentions: admins.map(a => a.id) });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

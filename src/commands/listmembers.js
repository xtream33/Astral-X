module.exports = {
  name: 'listmembers',
  aliases: ['members', 'getmembers', 'showmembers', 'memberlist'],
  category: 'group',
  description: 'List all group members',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    try {
      const meta    = await sock.groupMetadata(jid);
      const members = meta.participants;
      // Split into chunks of 30
      for (let i = 0; i < members.length; i += 30) {
        const chunk = members.slice(i, i + 30);
        const text  = (i === 0 ? '👥 *Members (' + members.length + ')*\n━━━━━━━━━━━━━━\n' : '') +
          chunk.map((m, j) => (i + j + 1) + '. @' + m.id.split('@')[0] + (m.admin ? ' 👑' : '')).join('\n');
        await sock.sendMessage(jid, { text, mentions: chunk.map(m => m.id) });
        if (i + 30 < members.length) await new Promise(r => setTimeout(r, 1500));
      }
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

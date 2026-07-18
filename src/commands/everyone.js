'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'everyone', aliases: ['tagall', 'mentionall', 'all', '@all'],
  category: 'group', description: 'Tag all group members. Usage: .everyone [message]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('📣 *TAG ALL*', '❌ This command only works in groups.') });
    try {
      const meta    = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const caption = args.length ? args.join(' ') : '📢 *Attention everyone!*';
      const mention = members.map(m => '@' + m.split('@')[0]).join(' ');
      await sock.sendMessage(jid, { text: caption + '\n\n' + mention, mentions: members });
    } catch (_) { /* silent */ }
  },
};

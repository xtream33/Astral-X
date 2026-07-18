'use strict';
module.exports = {
  name: 'hidetag', aliases: ['ht', 'hiddentag', 'silentping'],
  category: 'group', description: 'Tag all members silently. Usage: .hidetag [message]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const { box } = require('../utils/format');
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('👁️ *HIDETAG*', '❌ This command only works in groups.') });
    try {
      const meta    = await sock.groupMetadata(jid);
      const members = meta.participants.map(p => p.id);
      const text    = args.join(' ') || '‎';
      await sock.sendMessage(jid, { text, mentions: members });
    } catch (_) { /* silent */ }
  },
};

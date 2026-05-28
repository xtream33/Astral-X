'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'announce', aliases: ['pin', 'broadcast2', 'groupannounce'],
  category: 'group', description: 'Post a group announcement. Usage: .announce <message>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('📢 *ANNOUNCEMENT*', '❌ This command only works in groups.') });
    if (!args.length) return sock.sendMessage(jid, { text: box('📢 *ANNOUNCEMENT*', '📌 *Usage:* .announce <message>\n\n💡 *Example:*\n.announce Meeting tomorrow at 5pm. All members must attend!') });
    await sock.sendMessage(jid, { text: box('📢 *ANNOUNCEMENT*', args.join(' ') + '\n\n— _Group Admin_') });
  },
};

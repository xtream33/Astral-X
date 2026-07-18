'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'add', aliases: ['addmember', 'adduser', 'invite'],
  category: 'group', description: 'Add someone to the group. Usage: .add <number>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('➕ *ADD MEMBER*', '❌ This command only works in groups.') });
    if (!args.length) return sock.sendMessage(jid, { text: box('➕ *ADD MEMBER*', '📌 *Usage:* .add <number>\n\n💡 *Example:*\n.add 256747304196') });
    const num = args[0].replace(/\D/g, '');
    const target = num + '@s.whatsapp.net';
    try {
      const result = await sock.groupParticipantsUpdate(jid, [target], 'add');
      const status = result?.[0]?.status;
      if (status === '200' || status === 200) {
        await sock.sendMessage(jid, { text: box('➕ *ADD MEMBER*', '✅ @' + num + ' has been added to the group! 🎉'), mentions: [target] });
      } else {
        await sock.sendMessage(jid, { text: box('➕ *ADD MEMBER*', '⚠️ Could not add @' + num + '.\n\n_They may have privacy settings on, or the number is invalid._'), mentions: [target] });
      }
    } catch (e) { await sock.sendMessage(jid, { text: box('➕ *ADD MEMBER*', '❌ Failed: ' + e.message) }); }
  },
};

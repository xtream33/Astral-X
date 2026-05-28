'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'kick', aliases: ['remove', 'removeuser', 'kickmember'],
  category: 'group', description: 'Remove a member from group. Usage: .kick @user',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🚫 *KICK*', '❌ This command only works in groups.') });
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned?.length) return sock.sendMessage(jid, { text: box('🚫 *KICK*', '📌 *Usage:* .kick @user\n\n_Tag the member you want to remove._') });
    try {
      await sock.groupParticipantsUpdate(jid, mentioned, 'remove');
      await sock.sendMessage(jid, { text: box('🚫 *KICK*', '✅ Kicked *' + mentioned.length + '* member(s) from the group.'), mentions: mentioned });
    } catch (e) { await sock.sendMessage(jid, { text: box('🚫 *KICK*', '❌ Failed: ' + e.message + '\n\n_Make sure the bot is an admin._') }); }
  },
};

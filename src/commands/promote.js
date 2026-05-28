'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'promote', aliases: ['makeadmin', 'admin'],
  category: 'group', description: 'Promote member to admin. Usage: .promote @user',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('👑 *PROMOTE*', '❌ This command only works in groups.') });
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned?.length) return sock.sendMessage(jid, { text: box('👑 *PROMOTE*', '📌 *Usage:* .promote @user\n\n_Tag the member you want to make admin._') });
    try {
      await sock.groupParticipantsUpdate(jid, mentioned, 'promote');
      await sock.sendMessage(jid, { text: box('👑 *PROMOTE*', '✅ Promoted *' + mentioned.length + '* member(s) to admin! 🎉'), mentions: mentioned });
    } catch (e) { await sock.sendMessage(jid, { text: box('👑 *PROMOTE*', '❌ Failed: ' + e.message + '\n\n_Make sure the bot is an admin._') }); }
  },
};

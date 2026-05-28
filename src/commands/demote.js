'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'demote', aliases: ['removeadmin', 'unadmin'],
  category: 'group', description: 'Remove admin rights from member. Usage: .demote @user',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('⬇️ *DEMOTE*', '❌ This command only works in groups.') });
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentioned?.length) return sock.sendMessage(jid, { text: box('⬇️ *DEMOTE*', '📌 *Usage:* .demote @user\n\n_Tag the admin you want to demote._') });
    try {
      await sock.groupParticipantsUpdate(jid, mentioned, 'demote');
      await sock.sendMessage(jid, { text: box('⬇️ *DEMOTE*', '✅ Demoted *' + mentioned.length + '* member(s) from admin.'), mentions: mentioned });
    } catch (e) { await sock.sendMessage(jid, { text: box('⬇️ *DEMOTE*', '❌ Failed: ' + e.message + '\n\n_Make sure the bot is an admin._') }); }
  },
};

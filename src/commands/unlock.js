'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'unlock', aliases: ['unlockgroup', 'unlockinfo'],
  category: 'group', description: 'Unlock group — everyone can edit info',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🔓 *UNLOCK GROUP*', '❌ This command only works in groups.') });
    try {
      await sock.groupSettingUpdate(jid, 'unlocked');
      await sock.sendMessage(jid, { text: box('🔓 *UNLOCK GROUP*', '✅ Group is now *unlocked*.\n\n_Everyone can edit group info._') });
    } catch (e) { await sock.sendMessage(jid, { text: box('🔓 *UNLOCK GROUP*', '❌ Failed: ' + e.message + '\n\n_Bot must be an admin._') }); }
  },
};

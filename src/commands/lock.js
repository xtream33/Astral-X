'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'lock', aliases: ['lockgroup', 'lockinfo'],
  category: 'group', description: 'Lock group — only admins can edit info',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🔒 *LOCK GROUP*', '❌ This command only works in groups.') });
    try {
      await sock.groupSettingUpdate(jid, 'locked');
      await sock.sendMessage(jid, { text: box('🔒 *LOCK GROUP*', '✅ Group is now *locked*.\n\n_Only admins can edit group info._') });
    } catch (e) { await sock.sendMessage(jid, { text: box('🔒 *LOCK GROUP*', '❌ Failed: ' + e.message + '\n\n_Bot must be an admin._') }); }
  },
};

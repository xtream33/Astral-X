'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'mute', aliases: ['mutegroup', 'silence', 'closegroup'],
  category: 'group', description: 'Mute group — only admins can send messages',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🔇 *MUTE GROUP*', '❌ This command only works in groups.') });
    try {
      await sock.groupSettingUpdate(jid, 'announcement');
      await sock.sendMessage(jid, { text: box('🔇 *MUTE GROUP*', '🔇 Group is now *muted*.\n\n_Only admins can send messages._') });
    } catch (e) { await sock.sendMessage(jid, { text: box('🔇 *MUTE GROUP*', '❌ Failed: ' + e.message + '\n\n_Bot must be an admin._') }); }
  },
};

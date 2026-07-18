'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'unmute', aliases: ['unmutegroup', 'opengroup', 'unsilence'],
  category: 'group', description: 'Unmute group — everyone can send messages',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🔊 *UNMUTE GROUP*', '❌ This command only works in groups.') });
    try {
      await sock.groupSettingUpdate(jid, 'not_announcement');
      await sock.sendMessage(jid, { text: box('🔊 *UNMUTE GROUP*', '🔊 Group is now *unmuted*.\n\n_Everyone can send messages._') });
    } catch (e) { await sock.sendMessage(jid, { text: box('🔊 *UNMUTE GROUP*', '❌ Failed: ' + e.message + '\n\n_Bot must be an admin._') }); }
  },
};

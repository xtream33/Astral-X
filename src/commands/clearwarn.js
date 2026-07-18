'use strict';
const { box } = require('../utils/format');
const settings = require('../utils/settings');
module.exports = {
  name: 'clearwarn', aliases: ['resetwarn', 'warnreset', 'clearwarns'],
  category: 'group', description: 'Clear warns for a user. Usage: .clearwarn @user or .clearwarn all',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🗑️ *CLEAR WARNS*', '❌ This command only works in groups.') });
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) {
      Object.keys(settings.all()).filter(k => k.startsWith('warns:' + jid + ':')).forEach(k => settings.del(k));
      return sock.sendMessage(jid, { text: box('🗑️ *CLEAR WARNS*', '✅ All warnings cleared for this group.\n\nEveryone starts fresh! 🎉') });
    }
    settings.del('warns:' + jid + ':' + target);
    await sock.sendMessage(jid, { text: box('🗑️ *CLEAR WARNS*', '✅ Warnings cleared for @' + target.split('@')[0] + '.\n\n_Fresh start!_ 😊'), mentions: [target] });
  },
};

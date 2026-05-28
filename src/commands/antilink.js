'use strict';
const { box } = require('../utils/format');
const settings = require('../utils/settings');
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');
module.exports = {
  name: 'antilink', aliases: ['nolinks', 'linkfilter'],
  category: 'anti', description: 'Toggle anti-link. Usage: .antilink on/off/reset',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: box('🔗 *ANTI LINK*', '❌ This command only works in groups.') });
    if (args[0]?.toLowerCase() === 'reset') {
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (mentioned) {
        settings.del('warns:' + jid + ':' + mentioned);
        return sock.sendMessage(jid, { text: box('🔗 *ANTI LINK*', '✅ Warnings cleared for @' + mentioned.split('@')[0] + '. Fresh start! 😊'), mentions: [mentioned] });
      }
      const keys = Object.keys(settings.all()).filter(k => k.startsWith('warns:' + jid + ':'));
      keys.forEach(k => settings.del(k));
      return sock.sendMessage(jid, { text: box('🔗 *ANTI LINK*', '✅ All anti-link warnings cleared for this group.') });
    }
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('antilink:' + jid, forceOn);
    await sock.sendMessage(jid, {
      text: toggleMsg('Anti Link', '🔗', result,
        '• Admins can post links freely\n┃ • Non-admins get warned (max 3)\n┃ • At 3 warns → auto removed',
        '• Members can now share links freely'
      ) + '\n\n_Reset warns: *.antilink reset*_',
    });
  },
};

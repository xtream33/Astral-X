'use strict';
const settings = require('../utils/settings');

module.exports = {
  name: 'mode',
  aliases: ['botmode', 'setmode'],
  category: 'settings',
  description: 'Set bot mode. Usage: .mode public / .mode private',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Only the bot owner can change the mode.' });

    const input = (args[0] || '').toLowerCase().trim();

    if (!input) {
      const current = settings.get('owneronly:' + userId) ? 'private' : 'public';
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 🔧 *BOT MODE*\n' +
          '┠───────────────────\n' +
          '┃ Current: *' + (current === 'private' ? '🔴 PRIVATE' : '🟢 PUBLIC') + '*\n' +
          '┠───────────────────\n' +
          '┃ • *' + (ctx.prefix||'!') + 'mode public*  → Anyone can use bot\n' +
          '┃ • *' + (ctx.prefix||'!') + 'mode private* → Only you can use bot\n' +
          '┗━━━━━━━━━━━━━━━━━▣',
      });
    }

    if (input === 'public') {
      settings.set('owneronly:' + userId, false);
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 🌍 *BOT MODE*\n' +
          '┠───────────────────\n' +
          '┃ Status: *🟢 PUBLIC MODE*\n' +
          '┠───────────────────\n' +
          '┃ ✅ Anyone can now use bot commands.\n' +
          '┗━━━━━━━━━━━━━━━━━▣',
      });
    }

    if (input === 'private') {
      settings.set('owneronly:' + userId, true);
      return sock.sendMessage(jid, {
        text:
          '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n' +
          '┏━━━━━━━━━━━━━━━━━▣\n' +
          '┃ 🔒 *BOT MODE*\n' +
          '┠───────────────────\n' +
          '┃ Status: *🔴 PRIVATE MODE*\n' +
          '┠───────────────────\n' +
          '┃ ✅ Only YOU can use bot commands.\n' +
          '┃ Everyone else is ignored.\n' +
          '┗━━━━━━━━━━━━━━━━━▣',
      });
    }

    return sock.sendMessage(jid, {
      text: '❌ Invalid option.\n\nUse:\n• *' + (ctx.prefix||'!') + 'mode public*\n• *' + (ctx.prefix||'!') + 'mode private*',
    });
  },
};

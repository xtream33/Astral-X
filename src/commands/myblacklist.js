'use strict';
module.exports = {
  name: 'myblacklist',
  aliases: ['blocklist','listblocked','viewblocked'],
  category: 'privacy',
  description: 'See your blocked contacts list.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    try {
      const blocked = await sock.fetchBlocklist();
      if (!blocked || !blocked.length) {
        return sock.sendMessage(jid, { text: '✅ Your blocked contacts list is currently *empty*. No one is blocked. 😊' });
      }
      const list = blocked.map((b, i) => '  ' + (i + 1) + '. +' + b.split('@')[0]).join('\n');
      await sock.sendMessage(jid, {
        text:
          '📵 *Blocked Contacts*\n━━━━━━━━━━━━━━\n' +
          list + '\n━━━━━━━━━━━━━━\n' +
          'Total: *' + blocked.length + ' blocked*\n\n' +
          '_Use !unblockuser @number to unblock someone._ 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to fetch blocked list: ' + e.message });
    }
  },
};

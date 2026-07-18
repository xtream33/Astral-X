'use strict';
const { smartToggle, toggleMsg, parseOnOff } = require('../utils/toggle');

module.exports = {
  name: 'readreceipts',
  aliases: ['bluecheck','readreceipt','bluetick','blueticks'],
  category: 'privacy',
  description: 'Toggle blue ticks. Usage: .readreceipts on / .readreceipts off',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 Owner only command. 🙏' });
    const forceOn = parseOnOff(args[0]);
    const result  = smartToggle('readreceipts:' + userId, forceOn);
    try {
      await sock.updateReadReceiptsPrivacy(result.state ? 'all' : 'none');
      await sock.sendMessage(jid, {
        text: toggleMsg('Read Receipts (Blue Ticks)', '✅', result,
          'Others can see when you\'ve read messages',
          'Others can\'t see when you\'ve read messages'
        ),
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message });
    }
  },
};

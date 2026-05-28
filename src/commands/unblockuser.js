'use strict';
module.exports = {
  name: 'unblockuser',
  aliases: ['shadowunblock','restoreuser'],
  category: 'privacy',
  description: 'Unblock a user. Mention or provide their number.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const numArg    = args[0] ? args[0].replace(/\D/g, '') + '@s.whatsapp.net' : null;
    const target    = mentioned || numArg;
    if (!target) {
      return sock.sendMessage(jid, { text: '❌ Please mention or provide the number to unblock.\n\n*Usage:* !unblockuser @user or !unblockuser 2567XXXXXXXX' });
    }
    try {
      await sock.updateBlockStatus(target, 'unblock');
      await sock.sendMessage(jid, {
        text: '✅ *User Unblocked*\n━━━━━━━━━━━━━━\n✔️ +' + target.split('@')[0] + ' can now message you again. 😊',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to unblock: ' + e.message });
    }
  },
};

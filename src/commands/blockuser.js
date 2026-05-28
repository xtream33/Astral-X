'use strict';
module.exports = {
  name: 'blockuser',
  aliases: ['shadowblock','softblock'],
  category: 'privacy',
  description: 'Block a user without notification. Reply to or mention them.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                   || msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (!mentioned) {
      return sock.sendMessage(jid, { text: '❌ Please mention or reply to the user you want to block.\n\n*Usage:* !blockuser @user' });
    }
    try {
      await sock.updateBlockStatus(mentioned, 'block');
      await sock.sendMessage(jid, {
        text: '✅ *User Blocked*\n━━━━━━━━━━━━━━\n📵 @' + mentioned.split('@')[0] + ' has been blocked silently.\n\n_They cannot send you messages anymore._ 🙏',
        mentions: [mentioned],
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed to block user: ' + e.message });
    }
  },
};

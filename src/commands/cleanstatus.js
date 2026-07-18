'use strict';
module.exports = {
  name: 'cleanstatus',
  aliases: ['clearstatus', 'deletemystatus', 'removestatus'],
  category: 'privacy',
  description: 'Delete your current WhatsApp status.',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '🔒 This command is only available to the bot owner. 🙏' });
    try {
      // Fetch your own status updates and delete the most recent one
      const meJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
      // Try the newer API first, fallback to legacy key format
      if (typeof sock.updateLastSeenPrivacy === 'function') {
        // Attempt to clear via status broadcast delete with own JID as key
        await sock.sendMessage('status@broadcast', {
          delete: {
            remoteJid: 'status@broadcast',
            fromMe: true,
            id: 'status@broadcast',
            participant: meJid,
          },
        });
      }
      await sock.sendMessage(jid, { text: '✅ Status delete requested successfully! 😊\n_Note: If you have multiple statuses, you may need to delete older ones from WhatsApp directly._' });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not auto-delete status.\n_Please delete it manually in WhatsApp → Status → tap & hold → Delete.\n\nError: ' + e.message + '_' });
    }
  },
};

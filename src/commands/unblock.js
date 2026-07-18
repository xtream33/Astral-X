module.exports = {
  name: 'unblock', category: 'owner', description: 'Unblock a contact. !unblock @user',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '\u274c Owner only command.' });
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || (args[0] ? args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null);
    if (!target) return sock.sendMessage(jid, { text: '\u274c Tag a user or provide a number: !unblock 2567473...' });
    try { await sock.updateBlockStatus(target, 'unblock'); await sock.sendMessage(jid, { text: '\u2705 @' + target.split('@')[0] + ' has been unblocked.', mentions: [target] }); }
    catch (e) { sock.sendMessage(jid, { text: '\u274c Unblock failed: ' + e.message }); }
  }
};
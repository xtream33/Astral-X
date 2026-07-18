module.exports = {
  name: 'block', category: 'owner', description: 'Block a contact. !block @user',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '\u274c Owner only command.' });
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                || (args[0] ? args[0].replace(/[^0-9]/g,'') + '@s.whatsapp.net' : null);
    if (!target) return sock.sendMessage(jid, { text: '\u274c Tag a user or provide a number: !block @user' });
    try { await sock.updateBlockStatus(target, 'block'); await sock.sendMessage(jid, { text: '\u26d4 @' + target.split('@')[0] + ' has been blocked.', mentions: [target] }); }
    catch (e) { sock.sendMessage(jid, { text: '\u274c Block failed: ' + e.message }); }
  }
};
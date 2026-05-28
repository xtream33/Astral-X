const settings = require('../utils/settings');
module.exports = {
  name: 'afk', category: 'utility', description: 'Set AFK status. !afk [reason]',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    const sender = ctx.sender || msg.key.remoteJid;
    const reason = args.join(' ') || 'No reason given';
    settings.set('afk:' + userId + ':' + sender, true);
    settings.set('afkdata:' + userId + ':' + sender, JSON.stringify({ reason, since: Date.now() }));
    await sock.sendMessage(jid, { text: '\ud83d\udca4 *' + (msg.pushName || sender.split('@')[0]) + '* is now AFK\n_Reason: ' + reason + '_' });
  }
};
module.exports = {
  name: 'setname',
  aliases: ['changename', 'updatename', 'botname'],
  category: 'owner',
  description: 'Change bot display name. !setname ASTRA-X BOT',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;
    if (!ctx.isOwner) return sock.sendMessage(jid, { text: '❌ Owner only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: !setname <new name>' });
    const name = args.join(' ');
    try {
      await sock.updateProfileName(name);
      await sock.sendMessage(jid, { text: '✅ Bot name changed to: *' + name + '*' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

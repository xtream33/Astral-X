module.exports = {
  name: 'setgroupname',
  aliases: ['groupname', 'renamegrp', 'renamegroup'],
  category: 'group',
  description: 'Change group name. !setgroupname New Name',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: !setgroupname <new name>' });
    try {
      await sock.groupUpdateSubject(jid, args.join(' '));
      await sock.sendMessage(jid, { text: '✅ Group name updated to: *' + args.join(' ') + '*' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

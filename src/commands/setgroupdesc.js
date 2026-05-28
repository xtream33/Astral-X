module.exports = {
  name: 'setgroupdesc',
  aliases: ['groupdesc', 'groupdescription', 'setdesc'],
  category: 'group',
  description: 'Change group description. !setgroupdesc text here',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '❌ Usage: !setgroupdesc <description>' });
    try {
      await sock.groupUpdateDescription(jid, args.join(' '));
      await sock.sendMessage(jid, { text: '✅ Group description updated!' });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message }); }
  },
};

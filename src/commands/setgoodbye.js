const settings = require('../utils/settings');
module.exports = {
  name: 'setgoodbye', category: 'group', description: 'Set goodbye message. Vars: {name} {group} {count}',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '\u274c Groups only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '\u274c Usage: !setgoodbye Bye {name} from {group}!' });
    settings.set('goodbye_msg:' + jid, args.join(' '));
    await sock.sendMessage(jid, { text: '\u2705 Goodbye message set!' });
  }
};
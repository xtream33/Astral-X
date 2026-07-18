const settings = require('../utils/settings');
module.exports = {
  name: 'setwelcome', category: 'group', description: 'Set welcome message. Vars: {name} {group} {count}',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '\u274c Groups only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '\u274c Usage: !setwelcome Welcome {name} to {group}!\nVars: {name} {group} {count}' });
    settings.set('welcome_msg:' + jid, args.join(' '));
    await sock.sendMessage(jid, { text: '\u2705 Welcome message set!\n_Preview:_\n' + args.join(' ') });
  }
};
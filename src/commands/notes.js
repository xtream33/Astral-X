const settings = require('../utils/settings');
module.exports = {
  name: 'notes', aliases: ['note', 'save', 'getnote'], category: 'utility',
  description: '!notes save <name> <text> | !notes get <name> | !notes list | !notes del <name>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const [sub, name, ...rest] = args;
    const prefix = 'note:' + jid + ':';
    if (!sub || sub === 'list') {
      const keys = Object.keys(settings.all()).filter(k => k.startsWith(prefix)).map(k => k.replace(prefix,''));
      return sock.sendMessage(jid, { text: keys.length ? '\ud83d\udcd2 *Notes:*\n' + keys.map(k => '\u25c7 ' + k).join('\n') + '\n\n_Use !notes get <name>_' : '\u274c No notes saved.' });
    }
    if (sub === 'save' || sub === 'add') {
      if (!name || !rest.length) return sock.sendMessage(jid, { text: '\u274c Usage: !notes save <name> <text>' });
      settings.set(prefix + name, rest.join(' '));
      return sock.sendMessage(jid, { text: '\u2705 Note *' + name + '* saved!' });
    }
    if (sub === 'get' || sub === 'show') {
      if (!name) return sock.sendMessage(jid, { text: '\u274c Usage: !notes get <name>' });
      const note = settings.get(prefix + name);
      return sock.sendMessage(jid, { text: note ? '\ud83d\udcd2 *' + name + ':*\n' + note : '\u274c Note not found: ' + name });
    }
    if (sub === 'del' || sub === 'delete' || sub === 'remove') {
      if (!name) return sock.sendMessage(jid, { text: '\u274c Usage: !notes del <name>' });
      settings.del(prefix + name);
      return sock.sendMessage(jid, { text: '\ud83d\uddd1\ufe0f Note *' + name + '* deleted.' });
    }
    sock.sendMessage(jid, { text: '\u274c Unknown sub-command. Use: save | get | list | del' });
  }
};
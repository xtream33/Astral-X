const settings = require('../utils/settings');
module.exports = {
  name: 'setrules', category: 'group', description: 'Set group rules',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '\u274c Groups only.' });
    if (!args.length) return sock.sendMessage(jid, { text: '\u274c Usage: !setrules 1. No spam\n2. No links\n3. Respect everyone' });
    settings.set('rules:' + jid, args.join(' '));
    await sock.sendMessage(jid, { text: '\u2705 Rules updated!' });
  }
};
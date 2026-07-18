const settings = require('../utils/settings');
module.exports = {
  name: 'warnings', aliases: ['warncount'], category: 'group', description: 'Check warns for a user or list all warns',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '\u274c Groups only.' });
    const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) {
      const all = Object.entries(settings.all()).filter(([k]) => k.startsWith('warns:' + jid + ':')).map(([k,v]) => '@' + k.split(':')[2].split('@')[0] + ': ' + v + '/3');
      return sock.sendMessage(jid, { text: all.length ? '\u26a0\ufe0f *Group Warns:*\n' + all.join('\n') : '\u2705 No active warns.' });
    }
    const count = settings.get('warns:' + jid + ':' + target) || 0;
    await sock.sendMessage(jid, { text: '\u26a0\ufe0f @' + target.split('@')[0] + ' has *' + count + '/3* warns.', mentions: [target] });
  }
};
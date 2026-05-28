const settings = require('../utils/settings');
module.exports = {
  name: 'bio', category: 'user',
  description: 'Set your bot bio shown in !profile',
  execute: async (sock, msg, args, userId) => {
    const jid    = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const num    = sender.split('@')[0];
    if (!args.length) {
      const bio = settings.get(`bio:${userId}:${num}`) || 'No bio set';
      return sock.sendMessage(jid, { text: '📝 Your bio: ' + bio });
    }
    if (args.join(' ').length > 150) return sock.sendMessage(jid, { text: '❌ Bio too long. Max 150 characters.' });
    settings.set(`bio:${userId}:${num}`, args.join(' '));
    await sock.sendMessage(jid, { text: '✅ Bio updated: ' + args.join(' ') });
  }
};

const crypto = require('crypto');
module.exports = {
  name: 'uuid', aliases: ['guid', 'generateid', 'uniqueid', 'randomid'],
  category: 'utility', description: 'Generate a unique UUID v4',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const count = Math.min(parseInt(args[0]) || 1, 10);
    const ids   = Array.from({ length: count }, () => crypto.randomUUID());
    await sock.sendMessage(jid, { text: '🆔 *UUID' + (count > 1 ? 's' : '') + ' Generated:*\n\n```' + ids.join('\n') + '```' });
  },
};

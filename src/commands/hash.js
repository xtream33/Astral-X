const crypto = require('crypto');
module.exports = {
  name: 'hash', aliases: ['md5', 'sha256', 'sha1', 'encrypt', 'checksum'],
  category: 'utility', description: 'Hash a text string. !hash md5 hello or !hash sha256 text',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: '🔒 *Usage:* !hash <algorithm> <text>\n\nAlgorithms: md5 sha1 sha256 sha512' });
    const algo = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    const supported = ['md5', 'sha1', 'sha256', 'sha512'];
    if (!supported.includes(algo)) return sock.sendMessage(jid, { text: '❌ Supported: ' + supported.join(', ') });
    try {
      const hash = crypto.createHash(algo).update(text).digest('hex');
      await sock.sendMessage(jid, { text: '🔒 *Hash (' + algo.toUpperCase() + ')*\n\nInput: ' + text + '\n\nResult:\n```' + hash + '```' });
    } catch (_) { await sock.sendMessage(jid, { text: '❌ Hash failed.' }); }
  },
};

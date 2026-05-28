module.exports = {
  name: 'base64', aliases: ['b64', 'encode', 'decode'],
  category: 'utility', description: 'Encode or decode base64. !base64 encode Hello World',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: '🔢 *Usage:*\n!base64 encode <text>\n!base64 decode <text>' });
    const action = args[0].toLowerCase();
    const text   = args.slice(1).join(' ');
    try {
      if (action === 'encode') {
        const result = Buffer.from(text).toString('base64');
        await sock.sendMessage(jid, { text: '🔢 *Base64 Encoded:*\n```' + result + '```' });
      } else if (action === 'decode') {
        const result = Buffer.from(text, 'base64').toString('utf8');
        await sock.sendMessage(jid, { text: '🔓 *Base64 Decoded:*\n```' + result + '```' });
      } else {
        await sock.sendMessage(jid, { text: '❌ Use: *encode* or *decode*' });
      }
    } catch (_) {
      await sock.sendMessage(jid, { text: '❌ Invalid base64 input.' });
    }
  },
};

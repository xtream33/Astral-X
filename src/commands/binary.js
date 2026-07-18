module.exports = {
  name: 'binary', aliases: ['bin', 'tobinary', 'frombinary', 'bits'],
  category: 'utility', description: 'Convert text to binary or binary to text. !binary encode Hello',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: '💻 *Usage:*\n!binary encode <text>\n!binary decode <binary>' });
    const action = args[0].toLowerCase();
    const text   = args.slice(1).join(' ');
    if (action === 'encode') {
      const result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
      await sock.sendMessage(jid, { text: '💻 *Binary:*\n```' + result + '```' });
    } else {
      try {
        const result = text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
        await sock.sendMessage(jid, { text: '💻 *Decoded:* ' + result });
      } catch (_) { await sock.sendMessage(jid, { text: '❌ Invalid binary input.' }); }
    }
  },
};

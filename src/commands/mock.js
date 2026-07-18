module.exports = {
  name: 'mock', aliases: ['spongebob', 'alternating', 'crazycaps', 'mocking'],
  category: 'fun', description: 'Convert text to mocking SpongeBob case. !mock hello world',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const text = args.join(' ');
    if (!text) return sock.sendMessage(jid, { text: '🧽 *Usage:* !mock <text>' });
    const mocked = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
    await sock.sendMessage(jid, { text: '🧽 ' + mocked });
  },
};

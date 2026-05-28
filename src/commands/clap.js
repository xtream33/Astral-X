module.exports = {
  name: 'clap', aliases: ['clapback', 'claptext'],
  category: 'fun', description: 'Add 👏 between every word. !clap your text here',
  execute: async (sock, msg, args) => {
    if (!args.length) return sock.sendMessage(msg.key.remoteJid, { text: '❌ !clap your text here' });
    await sock.sendMessage(msg.key.remoteJid, { text: args.join(' 👏 ') + ' 👏' });
  },
};

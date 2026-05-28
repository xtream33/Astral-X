const { fetchBuffer } = require('../utils/ytdlp');
module.exports = {
  name: 'cat', aliases: ['kitty', 'meow', 'catpic', 'catphoto', 'feline'],
  category: 'fun', description: 'Get a random cute cat photo 🐱',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    try {
      const buf = await fetchBuffer('https://cataas.com/cat?width=400');
      await sock.sendMessage(jid, { image: buf, caption: '🐱 *Random Cat!* Meow~ 🐾' });
    } catch (_) { await sock.sendMessage(jid, { text: '🐱 Kitty is hiding today. Try again!' }); }
  },
};

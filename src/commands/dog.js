'use strict';
const https = require('https');
const { fetchBuffer } = require('../utils/ytdlp');
const { box } = require('../utils/format');
module.exports = {
  name: 'dog', aliases: ['puppy', 'woof', 'dogpic', 'dogphoto', 'canine'],
  category: 'fun', description: 'Random cute dog photo 🐶',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: box('🐶 *DOGGO*', '_Fetching a good boy..._') });
    https.get('https://dog.ceo/api/breeds/image/random', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const { message: url } = JSON.parse(data);
          if (!url) throw new Error();
          const buf = await fetchBuffer(url);
          await sock.sendMessage(jid, { image: buf, caption: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n🐶 *Random Doggo!*\n_Woof woof!_ 🐾' }, { quoted: msg });
        } catch (_) { /* silent — no response if fetch fails */ }
      });
    }).on('error', () => { /* silent */ });
  },
};

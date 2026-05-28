'use strict';
const { box } = require('../utils/format');
const { fetchBuffer } = require('../utils/ytdlp');

function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'meme',
  aliases: ['randommeme', 'funnymeme'],
  category: 'fun',
  description: 'Get a random meme. Usage: .meme',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '😂 Fetching a meme...' });
    try {
      const subs = ['memes','dankmemes','funny','me_irl','AdviceAnimals'];
      const sub  = subs[Math.floor(Math.random() * subs.length)];
      const data = await fetchJSON('https://meme-api.com/gimme/' + sub);
      if (!data?.url) throw new Error('no meme');
      const buf = await fetchBuffer(data.url);
      const ext = data.url.split('.').pop().toLowerCase();
      if (['jpg','jpeg','png','webp'].includes(ext)) {
        await sock.sendMessage(jid, {
          image: buf,
          caption: box('😂 *' + (data.title || 'RANDOM MEME') + '*', '👍 ' + (data.ups || 0) + ' upvotes\n📌 r/' + sub),
        });
      } else if (['gif'].includes(ext)) {
        await sock.sendMessage(jid, { video: buf, gifPlayback: true, caption: '😂 ' + (data.title || 'Meme') });
      } else {
        await sock.sendMessage(jid, { image: buf, caption: '😂 ' + (data.title || 'Meme') });
      }
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not fetch meme. Try again!' });
    }
  },
};

'use strict';
const { box } = require('../utils/format');

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

const FALLBACK = [
  { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
  { q: 'In the middle of every difficulty lies opportunity.', a: 'Albert Einstein' },
  { q: 'It does not matter how slowly you go as long as you do not stop.', a: 'Confucius' },
  { q: 'Life is what happens when you\'re busy making other plans.', a: 'John Lennon' },
  { q: 'The future belongs to those who believe in the beauty of their dreams.', a: 'Eleanor Roosevelt' },
  { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: 'Believe you can and you\'re halfway there.', a: 'Theodore Roosevelt' },
];

module.exports = {
  name: 'quote',
  aliases: ['quotes', 'inspire', 'motivation', 'inspo'],
  category: 'fun',
  description: 'Get an inspirational quote. Usage: .quote',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    try {
      const data = await fetchJSON('https://api.quotable.io/random');
      const q = data?.content, a = data?.author;
      if (!q) throw new Error('none');
      await sock.sendMessage(jid, {
        text: box('💬 *QUOTE*', '_"' + q + '"_\n\n— *' + a + '*'),
      });
    } catch (_) {
      const pick = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
      await sock.sendMessage(jid, {
        text: box('💬 *QUOTE*', '_"' + pick.q + '"_\n\n— *' + pick.a + '*'),
      });
    }
  },
};

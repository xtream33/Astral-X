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

const FALLBACK_FACTS = [
  'Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.',
  'A group of flamingos is called a flamboyance.',
  'Bananas are slightly radioactive due to the potassium-40 they contain.',
  'The average person walks about 100,000 miles in their lifetime.',
  'Octopuses have three hearts and blue blood.',
  'A day on Venus is longer than a year on Venus.',
  'The shortest war in history lasted only 38 to 45 minutes — between Britain and Zanzibar in 1896.',
  'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.',
  'There are more possible games of chess than atoms in the observable universe.',
  'The Eiffel Tower grows about 6 inches taller in summer due to thermal expansion.',
];

module.exports = {
  name: 'fact',
  aliases: ['facts', 'randomfact', 'funfact', 'didfactknow'],
  category: 'fun',
  description: 'Get a random interesting fact. Usage: .fact',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    try {
      const data = await fetchJSON('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
      const fact  = data?.text || FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
      await sock.sendMessage(jid, {
        text: box('🧠 *RANDOM FACT*', fact),
      });
    } catch (_) {
      const fact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
      await sock.sendMessage(jid, {
        text: box('🧠 *RANDOM FACT*', fact),
      });
    }
  },
};

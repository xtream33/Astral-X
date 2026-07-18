'use strict';
const { box } = require('../utils/format');

function fetchJSON(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

const RANDOMS = ['John 3:16','Psalm 23:1','Proverbs 3:5','Romans 8:28','Philippians 4:13','Isaiah 40:31','Jeremiah 29:11','Matthew 5:14','Psalm 46:1','Joshua 1:9'];

module.exports = {
  name: 'bible',
  aliases: ['verse', 'bibleverse', 'scripture', 'kjv'],
  category: 'utility',
  description: 'Get Bible verse. Usage: .bible <Book Chapter:Verse>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text: box('✝️ *BIBLE*', '📌 *Usage:* .bible <reference>\n\n💡 *Examples:*\n.bible John 3:16\n.bible Psalm 23:1\n.bible Genesis 1:1\n\n_No reference? A random verse will be picked!_'),
    });
    const ref = args.length ? args.join(' ') : RANDOMS[Math.floor(Math.random() * RANDOMS.length)];
    await sock.sendMessage(jid, { text: box('✝️ *BIBLE*', '_Fetching *' + ref + '*..._') });
    try {
      const data = await fetchJSON('https://bible-api.com/' + encodeURIComponent(ref) + '?translation=kjv');
      if (!data?.text) return; // silent
      await sock.sendMessage(jid, {
        text: box('✝️ *' + data.reference + '*', '_"' + data.text.trim() + '"_'),
      }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

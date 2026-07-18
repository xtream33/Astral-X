'use strict';
const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d.trim()));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X', 'Accept': 'application/json' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'tinyurl',
  aliases: ['shorten2', 'shorturl', 'miniurl'],
  category: 'utility',
  description: 'Shorten a URL. Usage: .tinyurl <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    let url   = args[0] || '';
    if (!url) return sock.sendMessage(jid, { text: '🔗 Usage: .tinyurl <url>\n💡 Example: .tinyurl https://google.com' });
    if (!url.startsWith('http')) url = 'https://' + url;
    try {
      const short = await fetchText('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(url));
      if (!short.startsWith('http')) throw new Error('Invalid response');
      await sock.sendMessage(jid, {
        text: '🔗 *URL Shortened*\n\n📎 Original:\n_' + url + '_\n\n✅ Short URL:\n*' + short + '*',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not shorten URL: ' + e.message });
    }
  },
};

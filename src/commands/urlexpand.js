'use strict';
const https = require('https');
const http  = require('http');

function expandUrl(shortUrl) {
  return new Promise((resolve, reject) => {
    const lib = shortUrl.startsWith('https') ? https : http;
    const req = lib.get(shortUrl, { headers: { 'User-Agent': 'ASTRA-X' } }, res => {
      const final = res.headers.location || shortUrl;
      req.destroy();
      resolve({ original: shortUrl, expanded: final, status: res.statusCode });
    });
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

module.exports = {
  name: 'urlexpand',
  aliases: ['expandurl', 'unshorten', 'longurl'],
  category: 'utility',
  description: 'Expand a shortened URL to see the real link. Usage: .urlexpand <url>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const url = args[0] || '';
    if (!url) return sock.sendMessage(jid, { text: '🔍 Usage: .urlexpand <short-url>\n💡 Example: .urlexpand https://bit.ly/abc123' });
    try {
      const result = await expandUrl(url);
      const changed = result.expanded !== result.original;
      await sock.sendMessage(jid, {
        text: '🔍 *URL Expander*\n\n' +
              '📎 Short URL:\n_' + result.original + '_\n\n' +
              (changed
                ? '✅ Expanded URL:\n*' + result.expanded + '*'
                : '⚠️ This URL does not redirect — it may already be a full URL.'),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not expand URL: ' + e.message });
    }
  },
};

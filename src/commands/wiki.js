'use strict';
const https = require('https');
const { box } = require('../utils/format');
module.exports = {
  name: 'wiki', aliases: ['wikipedia', 'search', 'lookup', 'explain'],
  category: 'utility', description: 'Wikipedia summary. Usage: .wiki <topic>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: box('📚 *WIKIPEDIA*', '📌 *Usage:* .wiki <topic>\n\n💡 *Examples:*\n.wiki Albert Einstein\n.wiki black holes\n.wiki World War 2') });
    const query = args.join(' ');
    await sock.sendMessage(jid, { text: box('📚 *WIKIPEDIA*', '_Searching for *' + query + '*..._') });
    https.get('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(query), { headers: { 'User-Agent': 'ASTRA-X Bot' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const j = JSON.parse(data);
          if (j.type === 'disambiguation' || !j.extract) return; // silent
          const extract = j.extract.slice(0, 800) + (j.extract.length > 800 ? '...' : '');
          const link = j.content_urls?.desktop?.page || '';
          await sock.sendMessage(jid, { text: box('📚 *' + j.title.toUpperCase() + '*', extract + (link ? '\n\n🔗 ' + link : '')) }, { quoted: msg });
        } catch (_) { /* silent */ }
      });
    }).on('error', () => { /* silent */ });
  },
};

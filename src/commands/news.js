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

module.exports = {
  name: 'news',
  aliases: ['headline', 'headlines', 'trending', 'breakingnews'],
  category: 'utility',
  description: 'Get latest news. Usage: .news [topic]',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || 'world';
    await sock.sendMessage(jid, { text: box('📰 *NEWS*', '_Fetching *' + topic + '* news..._') });
    try {
      const data     = await fetchJSON('https://gnews.io/api/v4/search?q=' + encodeURIComponent(topic) + '&lang=en&max=5&apikey=6c59f00e0af30d69f6c25c39cb4a8ccb');
      const articles = data?.articles;
      if (!articles?.length) throw new Error('none');
      let body = '';
      articles.forEach((a, i) => {
        body += (i + 1) + '. *' + a.title + '*\n';
        body += '   📅 ' + new Date(a.publishedAt).toLocaleDateString() + ' | 📰 ' + (a.source?.name || 'Unknown') + '\n';
        body += '   🔗 ' + a.url + '\n\n';
      });
      await sock.sendMessage(jid, { text: box('📰 *NEWS: ' + topic.toUpperCase() + '*', body.trim()) }, { quoted: msg });
    } catch (_) {
      try {
        const data = await fetchJSON('https://api.currentsapi.services/v1/search?keywords=' + encodeURIComponent(topic) + '&language=en&apiKey=U4D_lR3PEfzPGF3bT-yMC7i1fJjFW0-HHTEifFkdkqGfDAP1');
        const news = data?.news?.slice(0, 5);
        if (!news?.length) return; // silent
        let body = '';
        news.forEach((a, i) => {
          body += (i + 1) + '. *' + a.title + '*\n';
          body += '   📰 ' + (a.author || 'Unknown') + '\n';
          body += '   🔗 ' + a.url + '\n\n';
        });
        await sock.sendMessage(jid, { text: box('📰 *NEWS: ' + topic.toUpperCase() + '*', body.trim()) }, { quoted: msg });
      } catch (_2) { /* silent */ }
    }
  },
};

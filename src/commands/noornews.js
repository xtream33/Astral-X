'use strict';
const https = require('https');
const { box } = require('../utils/format');

// RSS-based news (no API key needed) from public RSS feeds
function fetchRSSNews(topic) {
  return new Promise((resolve, reject) => {
    // Use RSS2JSON free service or BBC RSS
    const rssUrl = topic
      ? 'https://feeds.bbci.co.uk/news/rss.xml'
      : 'https://feeds.bbci.co.uk/news/rss.xml';
    const url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl) + '&count=5';
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// GNews API (100 free requests/day, no credit card needed)
function gNewsSearch(topic) {
  const key = process.env.GNEWS_API_KEY || '';
  if (!key) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const url = 'https://gnews.io/api/v4/search?q=' + encodeURIComponent(topic) + '&max=5&apikey=' + key;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = {
  name: 'noornews',
  aliases: ['nnews', 'noorheadlines', 'nheadlines', 'noorbreaking'],
  category: 'astra-x-ai',
  description: 'Get latest news headlines. Usage: .noornews [topic]',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || 'top news';

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📰 *ᴀsᴛʀᴀ-x ɴᴇᴡs*\n┠─────────────────────\n┃ _Fetching latest news..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      let newsText = '';

      // Try GNews if API key present
      const gnews = await gNewsSearch(topic).catch(() => null);
      if (gnews && gnews.articles && gnews.articles.length > 0) {
        newsText += '🗞️ *Search: ' + topic + '*\n━━━━━━━━━━━━━━\n\n';
        gnews.articles.slice(0, 5).forEach((a, i) => {
          newsText += (i + 1) + '. *' + a.title + '*\n   _' + (a.source?.name || '') + ' • ' + new Date(a.publishedAt).toLocaleDateString() + '_\n\n';
        });
      } else {
        // Fallback: BBC RSS via rss2json
        const rss = await fetchRSSNews(topic);
        if (rss.items && rss.items.length > 0) {
          newsText += '📰 *BBC News Headlines*\n━━━━━━━━━━━━━━\n\n';
          rss.items.slice(0, 5).forEach((item, i) => {
            newsText += (i + 1) + '. *' + item.title + '*\n   _' + new Date(item.pubDate).toLocaleDateString() + '_\n\n';
          });
          if (topic !== 'top news') newsText += '💡 _Set GNEWS_API_KEY in .env for topic search._';
        } else {
          newsText = '❌ Could not fetch news at this time. Try again later.';
        }
      }

      await sock.sendMessage(jid, {
        text: box('📰 *ASTRA-X NEWS*', newsText.trim()),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('📰 *ASTRA-X NEWS*', '❌ News fetch failed: ' + e.message) });
    }
  },
};

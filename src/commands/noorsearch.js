'use strict';
const https = require('https');
const { box } = require('../utils/format');

function ddgSearch(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(query) + '&format=json&no_html=1&skip_disambig=1';
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
  name: 'noorsearch',
  aliases: ['nsearch', 'noorweb', 'websearch', 'nweb'],
  category: 'astra-x-ai',
  description: 'Search the web instantly. Usage: .noorsearch <query>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🔎 *ASTRA-X SEARCH*',
        '❓ Please provide a search query!\n\n📌 *Usage:* .noorsearch <query>\n\n💡 *Examples:*\n.noorsearch latest iPhone\n.noorsearch how does WiFi work\n.noorsearch Uganda capital city'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🔎 *ᴀsᴛʀᴀ-x sᴇᴀʀᴄʜ*\n┠─────────────────────\n┃ _Searching the web..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      const data = await ddgSearch(query);
      let result = '';

      if (data.AbstractText) {
        result += '📖 *Summary:*\n' + data.AbstractText.slice(0, 600) + (data.AbstractText.length > 600 ? '...' : '');
        if (data.AbstractURL) result += '\n\n🔗 *Source:* ' + data.AbstractURL;
      }

      if (data.Answer) {
        result += (result ? '\n\n' : '') + '✅ *Quick Answer:*\n' + data.Answer;
      }

      if (!result && data.RelatedTopics && data.RelatedTopics.length > 0) {
        result += '🔍 *Related Results:*\n';
        const topics = data.RelatedTopics.filter(t => t.Text).slice(0, 4);
        topics.forEach((t, i) => {
          result += '\n' + (i + 1) + '. ' + t.Text.slice(0, 120) + (t.Text.length > 120 ? '...' : '');
        });
      }

      if (!result) {
        result = '🌐 No direct answer found. Try:\n\n🔗 https://duckduckgo.com/?q=' + encodeURIComponent(query);
      }

      await sock.sendMessage(jid, {
        text: box('🔎 *ASTRA-X SEARCH*', '🔍 Query: _' + query + '_\n━━━━━━━━━━━━━━\n\n' + result),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🔎 *ASTRA-X SEARCH*', '❌ Search failed: ' + e.message) });
    }
  },
};

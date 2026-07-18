'use strict';
const https = require('https');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

// Wikipedia summary (free, no key needed)
function wikiSummary(topic) {
  return new Promise((resolve, reject) => {
    const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(topic);
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

// DuckDuckGo abstract (free)
function ddgAbstract(topic) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(topic) + '&format=json&no_html=1&skip_disambig=1';
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
  name: 'noorexplain',
  aliases: ['nexplain', 'noorinfo', 'ninfo', 'nwiki'],
  category: 'astra-x-ai',
  description: 'Explain any topic using free sources. Usage: .noorexplain <topic>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || getQuotedText(msg);

    if (!topic) return sock.sendMessage(jid, {
      text: box('📖 *ASTRA-X EXPLAIN*',
        '❓ Please provide a topic!\n\n📌 *Usage:* .noorexplain <topic>\n\n💡 *Examples:*\n.noorexplain black holes\n.noorexplain photosynthesis\n.noorexplain how planes fly'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📖 *ᴀsᴛʀᴀ-x ᴇxᴘʟᴀɪɴ*\n┠─────────────────────\n┃ _Looking up *' + topic + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      let explanation = '';
      let source = '';

      // Try Wikipedia first
      try {
        const wiki = await wikiSummary(topic);
        if (wiki.extract && wiki.type !== 'disambiguation') {
          explanation = wiki.extract.slice(0, 900) + (wiki.extract.length > 900 ? '...' : '');
          source = '📚 Wikipedia';
          if (wiki.content_urls?.desktop?.page) source += ': ' + wiki.content_urls.desktop.page;
        }
      } catch (_) {}

      // Fallback to DuckDuckGo
      if (!explanation) {
        const ddg = await ddgAbstract(topic);
        if (ddg.AbstractText) {
          explanation = ddg.AbstractText.slice(0, 900);
          source = '🦆 DuckDuckGo' + (ddg.AbstractURL ? ': ' + ddg.AbstractURL : '');
        }
      }

      if (!explanation) {
        explanation = '❌ No explanation found for *' + topic + '*.\n\nTry a simpler or more specific term.';
        source = '';
      }

      const body = '📌 Topic: _' + topic + '_\n━━━━━━━━━━━━━━\n\n' + explanation + (source ? '\n\n🔗 *Source:* ' + source : '');
      await sock.sendMessage(jid, {
        text: box('📖 *ASTRA-X EXPLAIN*', body),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('📖 *ASTRA-X EXPLAIN*', '❌ Error: ' + e.message) });
    }
  },
};

'use strict';
const https = require('https');
const { box } = require('../utils/format');
module.exports = {
  name: 'define', aliases: ['dict', 'dictionary', 'definition', 'whatis'],
  category: 'utility', description: 'Dictionary definition. Usage: .define <word>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: box('📖 *DICTIONARY*', '📌 *Usage:* .define <word>\n\n💡 *Examples:*\n.define serendipity\n.define eloquent\n.define ephemeral') });
    const word = args[0].toLowerCase().replace(/[^a-z]/g, '');
    await sock.sendMessage(jid, { text: box('📖 *DICTIONARY*', '_Looking up *' + word + '*..._') });
    https.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', async () => {
        try {
          const json = JSON.parse(data);
          if (!Array.isArray(json) || !json[0]) throw new Error();
          const entry = json[0], meanings = entry.meanings?.slice(0, 3) || [];
          if (!meanings.length) throw new Error();
          let body = '🔤 *' + entry.word + '*' + (entry.phonetic ? '  _' + entry.phonetic + '_' : '') + '\n━━━━━━━━━━━━━━\n';
          meanings.forEach(m => {
            body += '\n📌 *' + m.partOfSpeech + '*\n';
            m.definitions?.slice(0, 2).forEach((d, i) => {
              body += (i + 1) + '. ' + d.definition + '\n';
              if (d.example) body += '   _"' + d.example + '"_\n';
            });
          });
          await sock.sendMessage(jid, { text: box('📖 *DICTIONARY*', body.trim()) }, { quoted: msg });
        } catch (_) {
          await sock.sendMessage(jid, { text: box('📖 *DICTIONARY*', '❌ No definition found for *' + word + '*\n\nTry a different word or check the spelling.') });
        }
      });
    }).on('error', async () => sock.sendMessage(jid, { text: box('📖 *DICTIONARY*', '❌ Dictionary service unreachable. Try again.') }));
  },
};

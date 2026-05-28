'use strict';

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

module.exports = {
  name: 'synonym',
  aliases: ['syn', 'antonym', 'ant', 'thesaurus', 'similar'],
  category: 'education',
  description: 'Get synonyms and antonyms. Usage: .synonym <word>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const word = args[0]?.toLowerCase().trim();
    if (!word) return sock.sendMessage(jid, { text: '📚 Usage: *.synonym <word>*\n\nExample: .synonym happy' });
    await sock.sendMessage(jid, { text: '📚 _Looking up *' + word + '*..._' });
    try {
      const data = await fetchJSON('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word));
      if (!Array.isArray(data) || !data[0]) throw new Error('not found');

      const entry    = data[0];
      const meanings = entry.meanings || [];
      let text = '📚 *' + word.toUpperCase() + '*\n━━━━━━━━━━━━━━\n';

      meanings.slice(0, 3).forEach(m => {
        const syns = m.synonyms?.slice(0, 8) || [];
        const ants = m.antonyms?.slice(0, 5) || [];
        text += '\n🔹 *' + m.partOfSpeech + '*\n';
        if (m.definitions?.[0]) text += '📖 _' + m.definitions[0].definition + '_\n';
        if (syns.length) text += '✅ *Synonyms:* ' + syns.join(', ') + '\n';
        if (ants.length) text += '❌ *Antonyms:* ' + ants.join(', ') + '\n';
      });

      text += '\n_Powered by ASTRA-X_';
      await sock.sendMessage(jid, { text });
    } catch (_) {
      // Fallback to datamuse
      try {
        const [syns, ants] = await Promise.all([
          fetchJSON('https://api.datamuse.com/words?rel_syn=' + encodeURIComponent(word) + '&max=10'),
          fetchJSON('https://api.datamuse.com/words?rel_ant=' + encodeURIComponent(word) + '&max=5'),
        ]);
        const synList = syns.map(w => w.word).join(', ') || 'None found';
        const antList = ants.map(w => w.word).join(', ') || 'None found';
        await sock.sendMessage(jid, {
          text:
            '📚 *' + word.toUpperCase() + '*\n━━━━━━━━━━━━━━\n\n' +
            '✅ *Synonyms:* ' + synList + '\n' +
            '❌ *Antonyms:* ' + antList + '\n\n' +
            '_Powered by ASTRA-X_',
        });
      } catch(e) {
        await sock.sendMessage(jid, { text: '❌ Word not found: *' + word + '*' });
      }
    }
  },
};

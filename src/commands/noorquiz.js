'use strict';
const https = require('https');
const { box } = require('../utils/format');

function pollinationsQuiz(topic) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(
      'Generate a fun, interesting quiz question about: ' + topic + '\n\n' +
      'Format EXACTLY like this:\n' +
      'QUESTION: [the question]\n' +
      'A) [option]\nB) [option]\nC) [option]\nD) [option]\n' +
      'ANSWER: [letter]\n' +
      'FUN FACT: [one interesting related fact]\n\n' +
      'Make it educational and engaging.'
    );
    const url = 'https://text.pollinations.ai/' + encoded;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

module.exports = {
  name: 'noorquiz',
  aliases: ['nquiz', 'noorq', 'nq', 'noortrivia'],
  category: 'astra-x-ai',
  description: 'AI-generated quiz on any topic. Usage: .noorquiz <topic>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || 'general knowledge';

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🧩 *ᴀsᴛʀᴀ-x ǫᴜɪᴢ*\n┠─────────────────────\n┃ _Generating quiz on *' + topic + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      const result = await pollinationsQuiz(topic);
      if (!result || result.length < 20) throw new Error('Quiz generation failed.');
      await sock.sendMessage(jid, {
        text: box('🧩 *ASTRA-X QUIZ*', '📚 Topic: _' + topic + '_\n━━━━━━━━━━━━━━\n\n' + result.slice(0, 900) + '\n\n💡 _Reply with your answer!_'),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🧩 *ASTRA-X QUIZ*', '❌ Error: ' + e.message) });
    }
  },
};

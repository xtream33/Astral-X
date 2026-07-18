'use strict';
const { ask }      = require('../utils/gemini');
const settings     = require('../utils/settings');

module.exports = {
  name: 'quiz',
  aliases: ['trivia', 'quizme', 'test'],
  category: 'education',
  description: 'Get a random quiz question. Usage: .quiz [topic]',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || 'general knowledge';
    await sock.sendMessage(jid, { text: '🧠 _Generating quiz question on *' + topic + '*..._' });
    try {
      const reply = await ask(
        'Generate 1 multiple choice quiz question about: ' + topic + '\n\n' +
        'Format it exactly like this:\n' +
        '❓ Question: [the question]\n\n' +
        'A) [option]\n' +
        'B) [option]\n' +
        'C) [option]\n' +
        'D) [option]\n\n' +
        '✅ Answer: [correct letter and full answer]\n' +
        '💡 Explanation: [brief explanation why]'
      );
      await sock.sendMessage(jid, {
        text: '🧠 *Quiz: ' + topic + '*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
    }
  },
};

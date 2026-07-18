'use strict';
const { box } = require('../utils/format');
const active = new Map();
module.exports = {
  name: 'trivia', aliases: ['quiz2', 'qna', 'triviatime'],
  category: 'fun', description: 'Answer trivia! Usage: .trivia [easy|medium|hard]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (active.has(jid)) return sock.sendMessage(jid, { text: box('🧠 *TRIVIA*', '❓ A question is already active!\nAnswer it first, then start a new one.') });
    const diff = ['easy', 'medium', 'hard'].includes(args[0]) ? args[0] : 'medium';
    await sock.sendMessage(jid, { text: box('🧠 *TRIVIA*', '_Fetching a *' + diff + '* question..._') });
    try {
      const res  = await fetch('https://opentdb.com/api.php?amount=1&type=multiple&difficulty=' + diff, { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      if (data.response_code !== 0 || !data.results?.[0]) return; // silent
      const q = data.results[0];
      const dec = s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'");
      const correct = dec(q.correct_answer);
      const opts = [...q.incorrect_answers.map(dec), correct].sort(() => Math.random() - 0.5);
      const letters = ['A', 'B', 'C', 'D'];
      const correctLetter = letters[opts.indexOf(correct)];
      active.set(jid, { correct, correctLetter, tout: null });
      await sock.sendMessage(jid, { text: box('🧠 *TRIVIA [' + diff.toUpperCase() + ']*', '📂 _' + dec(q.category) + '_\n━━━━━━━━━━━━━━\n\n' + dec(q.question) + '\n\n' + opts.map((o, i) => letters[i] + ') ' + o).join('\n') + '\n━━━━━━━━━━━━━━\n_Reply A, B, C or D — 30 seconds!_') });
      const tout = setTimeout(async () => {
        active.delete(jid);
        await sock.sendMessage(jid, { text: box('🧠 *TRIVIA — TIME\'S UP!*', '⏰ Time is up!\n\n✅ *Answer:* ' + correctLetter + ') ' + correct) }).catch(() => {});
      }, 30000);
      active.get(jid).tout = tout;
      const listener = async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const m of messages) {
          if (m.key.remoteJid !== jid || m.key.fromMe) continue;
          const ans = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim().toUpperCase();
          if (!letters.includes(ans)) continue;
          const t = active.get(jid); if (!t) return;
          clearTimeout(t.tout); active.delete(jid); sock.ev.off('messages.upsert', listener);
          const correct2 = ans === t.correctLetter;
          await sock.sendMessage(jid, { text: box('🧠 *TRIVIA — ' + (correct2 ? 'CORRECT! 🎉' : 'WRONG! ❌') + '*', (correct2 ? '🏆 Well done!' : '❌ Not quite!') + '\n\n✅ *Answer:* ' + t.correctLetter + ') ' + t.correct) }).catch(() => {});
        }
      };
      sock.ev.on('messages.upsert', listener);
    } catch (_) { /* silent */ }
  },
};

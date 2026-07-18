'use strict';
const { ask } = require('../utils/gemini');
const { box } = require('../utils/format');
function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || null;
}
module.exports = {
  name: 'math', aliases: ['solve', 'calculate', 'equation', 'maths'],
  category: 'education', description: 'Solve any math problem. Usage: .math <problem>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const prob = args.join(' ').trim() || getQuotedText(msg);
    if (!prob) return sock.sendMessage(jid, { text: box('🧮 *MATH SOLVER*', '📌 *Usage:* .math <problem>\n\n💡 *Examples:*\n.math 2x + 5 = 15\n.math area of circle radius 7\n.math derivative of x^3 + 2x\n.math 15% of 4500') });
    await sock.sendMessage(jid, { text: box('🧮 *MATH SOLVER*', '_Solving..._') });
    try {
      const reply = await ask('Solve this math problem step by step: ' + prob + '\n\nShow all working steps clearly. Give the final answer at the end.');
      if (!reply) return; // silent
      await sock.sendMessage(jid, { text: box('🧮 *MATH SOLVER*', '📋 *Problem:* _' + prob + '_\n━━━━━━━━━━━━━━\n\n' + reply) }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

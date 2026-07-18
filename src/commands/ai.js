'use strict';
const { ask }  = require('../utils/gemini');
const { box }  = require('../utils/format');

module.exports = {
  name: 'ai',
  aliases: ['ask', 'chat', 'gpt', 'gemini', 'noor'],
  category: 'ai',
  description: 'Ask Gemini AI anything. Usage: .ai <question>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const q   = args.join(' ').trim();
    if (!q) return sock.sendMessage(jid, {
      text: box('🤖 *AI — ASTRA-X*',
        '❓ Please provide a question!\n\n📌 *Usage:* .ai <your question>\n\n💡 *Example:*\n.ai What is the capital of Uganda?'
      ),
    });
    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🤖 *ᴀsᴛʀᴀ-x ᴀɪ*\n┠─────────────────────\n┃ _Thinking..._\n┗━━━━━━━━━━━━━━━━━━━▣' });
    try {
      const reply = await ask(q, 'You are ASTRA-X, a helpful, friendly and intelligent WhatsApp AI assistant. Be concise, clear and use emojis where appropriate.');
      await sock.sendMessage(jid, {
        text: box('🤖 *ᴀsᴛʀᴀ-x ᴀɪ*', reply),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🤖 *ᴀsᴛʀᴀ-x ᴀɪ*', '❌ AI Error: ' + e.message) });
    }
  },
};

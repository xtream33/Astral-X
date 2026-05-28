'use strict';
const { ask } = require('../utils/gemini');
const { box } = require('../utils/format');

module.exports = {
  name: 'deepseek',
  aliases: ['ds', 'think', 'reason'],
  category: 'ai',
  description: 'Ask DeepSeek AI to reason through a problem. Usage: .deepseek <question>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const q   = args.join(' ').trim();
    if (!q) return sock.sendMessage(jid, {
      text: box('🧠 *DeepSeek AI*', '❓ Please provide a question!\n\n📌 *Usage:* .deepseek <question>\n💡 *Example:*\n.deepseek Explain quantum entanglement'),
    });
    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🧠 *DeepSeek Reasoning*\n┠─────────────────────\n┃ _Thinking deeply..._\n┗━━━━━━━━━━━━━━━━━━━▣' });
    try {
      const reply = await ask(q, 'You are DeepSeek, an advanced reasoning AI. Think step by step, analyze deeply, and provide thorough, well-structured answers. Use logical reasoning and show your thought process.');
      await sock.sendMessage(jid, { text: box('🧠 *DeepSeek AI*', reply) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🧠 *DeepSeek AI*', '❌ Error: ' + e.message) });
    }
  },
};

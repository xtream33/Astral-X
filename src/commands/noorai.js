'use strict';
const https = require('https');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

// Free AI: pollinations.ai text model (no API key required)
function pollinationsAI(prompt) {
  return new Promise((resolve, reject) => {
    const encodedPrompt = encodeURIComponent(
      'You are ASTRA-X AI, a smart, friendly WhatsApp assistant. Answer clearly and concisely. Use emojis where suitable.\n\nUser: ' + prompt + '\n\nASTRA-X AI:'
    );
    const url = 'https://text.pollinations.ai/' + encodedPrompt;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

module.exports = {
  name: 'noorai',
  aliases: ['nai', 'noorask', 'nask', 'noorbot'],
  category: 'astra-x-ai',
  description: 'Chat with ASTRA-X AI (free, no API key). Usage: .noorai <question>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const q   = args.join(' ').trim() || getQuotedText(msg);

    if (!q) return sock.sendMessage(jid, {
      text: box('🤖 *ASTRA-X AI*',
        '❓ Ask me anything!\n\n📌 *Usage:* .noorai <question>\n\n💡 *Examples:*\n.noorai what is quantum computing\n.noorai write me a motivational quote\n.noorai explain DNA in simple terms'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🤖 *ᴀsᴛʀᴀ-x ᴀɪ*\n┠─────────────────────\n┃ _Thinking..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      const reply = await pollinationsAI(q);
      if (!reply || reply.length < 5) throw new Error('Empty response from AI.');
      await sock.sendMessage(jid, {
        text: box('🤖 *ASTRA-X AI*', '❓ _' + q.slice(0, 80) + (q.length > 80 ? '...' : '') + '_\n━━━━━━━━━━━━━━\n\n' + reply.slice(0, 1200)),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🤖 *ASTRA-X AI*', '❌ AI Error: ' + e.message + '\n\nTry again in a moment.') });
    }
  },
};

'use strict';
const { ask } = require('../utils/gemini');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

const MAP = {
  improve:   { emoji:'✍️', label:'IMPROVE TEXT',    usage:'Reply to a message with *.improve* or type: *.improve <text>*', prompt:'Rewrite and improve this text. Make it clearer, more professional and better written. Keep the same meaning and language. Only return the improved text, nothing else:' },
  summarize: { emoji:'📄', label:'SUMMARY',          usage:'Reply to a long message with *.summarize*', prompt:'Summarize the following text into clear, short bullet points. Keep only the most important information:' },
  grammar:   { emoji:'📝', label:'GRAMMAR CHECK',    usage:'Reply to a message with *.grammar* or type: *.grammar <text>*', prompt:'Fix all grammar, spelling and punctuation errors in this text. Only return the corrected text, nothing else:' },
  formal:    { emoji:'👔', label:'FORMAL VERSION',   usage:'Reply to a message with *.formal* or type: *.formal <text>*', prompt:'Rewrite this text in a formal, professional tone. Only return the rewritten text:' },
  casual:    { emoji:'😊', label:'CASUAL VERSION',   usage:'Reply to a message with *.casual* or type: *.casual <text>*', prompt:'Rewrite this text in a casual, friendly and conversational tone. Only return the rewritten text:' },
};

const C = MAP['summarize'];

module.exports = {
  name: 'summarize',
  category: 'ai',
  description: C.usage,
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const text = args.join(' ').trim() || getQuotedText(msg);
    if (!text) return sock.sendMessage(jid, { text: box(C.emoji + ' *' + C.label + '*', C.usage) });
    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ ' + C.emoji + ' *' + C.label + '*\n┠─────────────────────\n┃ _Processing..._\n┗━━━━━━━━━━━━━━━━━━━▣' });
    try {
      const reply = await ask(C.prompt + '\n\n' + text);
      await sock.sendMessage(jid, { text: box(C.emoji + ' *' + C.label + '*', reply) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box(C.emoji + ' *' + C.label + '*', '❌ Error: ' + e.message) });
    }
  },
};

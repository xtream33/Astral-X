'use strict';
const { ask } = require('../utils/gemini');
const { box } = require('../utils/format');
function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || null;
}
module.exports = {
  name: 'spell', aliases: ['spelling', 'spellcheck', 'correct'],
  category: 'education', description: 'Spell check. Usage: .spell <text>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const text = args.join(' ').trim() || getQuotedText(msg);
    if (!text) return sock.sendMessage(jid, { text: box('✏️ *SPELL CHECK*', '📌 *Usage:* .spell <word or sentence>\n\n💡 *Examples:*\n.spell recieve\n.spell I dont no wat to do') });
    await sock.sendMessage(jid, { text: box('✏️ *SPELL CHECK*', '_Checking..._') });
    try {
      const reply = await ask('Check the spelling of: "' + text + '"\n\nList each wrong word and its correction, then give the fully corrected text. If everything is correct, just say so. Be brief.');
      if (!reply) return;
      await sock.sendMessage(jid, { text: box('✏️ *SPELL CHECK*', '📋 *Input:* _' + text + '_\n━━━━━━━━━━━━━━\n\n' + reply) }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

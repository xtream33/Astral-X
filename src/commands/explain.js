'use strict';
const { ask, askWithImage, getImageFromMsg } = require('../utils/gemini');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

module.exports = {
  name: 'explain',
  aliases: ['whatmeans', 'describe', 'elaborate', 'breakdown'],
  category: 'education',
  description: 'Explain anything in simple terms. Reply text/image or type topic.',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || getQuotedText(msg);

    // Check for image
    const img = await getImageFromMsg(sock, msg).catch(() => null);
    if (img) {
      await sock.sendMessage(jid, { text: '🔬 _Explaining what\'s in this image..._' });
      try {
        const reply = await askWithImage(img.buf, img.mime,
          'Explain what is shown in this image in simple, easy to understand terms. Include key details.'
        );
        return await sock.sendMessage(jid, {
          text: '🔬 *Explanation*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
        }, { quoted: msg });
      } catch (e) {
        return await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
      }
    }

    if (!topic) return sock.sendMessage(jid, { text: '🔬 Usage: *.explain <topic>* or reply to text/image\n\nExamples:\n• .explain black holes\n• .explain how vaccines work\n• .explain quantum physics simply' });

    await sock.sendMessage(jid, { text: '🔬 _Explaining *' + topic + '*..._' });
    try {
      const reply = await ask(
        'Explain this in simple, easy-to-understand language as if talking to a 15 year old: ' + topic +
        '\n\nUse examples and analogies where helpful. Break it down clearly.'
      );
      await sock.sendMessage(jid, {
        text: '🔬 *Explanation: ' + topic + '*\n━━━━━━━━━━━━━━\n\n' + reply + '\n\n_Powered by ASTRA-X_',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Error: ' + e.message });
    }
  },
};

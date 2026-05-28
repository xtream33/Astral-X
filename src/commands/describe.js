'use strict';
const { askWithImage, getImageFromMsg } = require('../utils/gemini');
const { box } = require('../utils/format');

module.exports = {
  name: 'describe',
  aliases: ['analyze', 'analyse', 'vision', 'whatisthis', 'see', 'look', 'caption'],
  category: 'ai',
  description: 'Gemini AI analyses any image. Reply image with .describe',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const prompt = args.join(' ').trim() || 'Describe this image in full detail. Mention objects, people, text, colors, mood and any interesting details.';
    const img    = await getImageFromMsg(sock, msg).catch(() => null);
    if (!img) return sock.sendMessage(jid, {
      text: box('👁️ *IMAGE ANALYSIS*',
        '📷 Reply to an image with *.describe*\n\n💡 You can also add a question:\n_.describe what is the person wearing?_'
      ),
    });
    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 👁️ *IMAGE ANALYSIS*\n┠─────────────────────\n┃ _Analyzing image..._\n┗━━━━━━━━━━━━━━━━━━━▣' });
    try {
      const reply = await askWithImage(img.buf, img.mime, prompt);
      await sock.sendMessage(jid, {
        text: box('👁️ *IMAGE ANALYSIS*', reply),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('👁️ *IMAGE ANALYSIS*', '❌ Error: ' + e.message) });
    }
  },
};

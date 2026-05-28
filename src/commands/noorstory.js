'use strict';
const https = require('https');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

function pollinationsStory(prompt) {
  return new Promise((resolve, reject) => {
    const sys = 'You are a creative story writer. Write engaging short stories (under 400 words) with a beginning, middle, plot twist, and satisfying ending. Use vivid descriptions.';
    const encoded = encodeURIComponent(sys + '\n\nWrite a short story about: ' + prompt);
    const url = 'https://text.pollinations.ai/' + encoded;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

module.exports = {
  name: 'noorstory',
  aliases: ['nstory', 'noorwrite', 'ntale', 'noortale'],
  category: 'astra-x-ai',
  description: 'Generate a creative story. Usage: .noorstory <topic>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const topic = args.join(' ').trim() || getQuotedText(msg);

    if (!topic) return sock.sendMessage(jid, {
      text: box('📖 *ASTRA-X STORY*',
        '❓ Please give a story topic!\n\n📌 *Usage:* .noorstory <topic>\n\n💡 *Examples:*\n.noorstory a lost kid in a magical forest\n.noorstory two rivals becoming best friends\n.noorstory a robot who discovers emotions'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📖 *ᴀsᴛʀᴀ-x sᴛᴏʀʏ*\n┠─────────────────────\n┃ _Writing your story..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      const story = await pollinationsStory(topic);
      if (!story || story.length < 20) throw new Error('Story generation failed.');
      await sock.sendMessage(jid, {
        text: box('📖 *ASTRA-X STORY*', '✍️ Topic: _' + topic + '_\n━━━━━━━━━━━━━━\n\n' + story.slice(0, 1400)),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('📖 *ASTRA-X STORY*', '❌ Error: ' + e.message) });
    }
  },
};

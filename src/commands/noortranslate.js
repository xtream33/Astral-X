'use strict';
const https = require('https');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

// MyMemory free translation API (no key, 1000 words/day free)
function myMemoryTranslate(text, targetLang) {
  return new Promise((resolve, reject) => {
    const langPairs = {
      french:'fr', spanish:'es', arabic:'ar', swahili:'sw', german:'de',
      portuguese:'pt', italian:'it', chinese:'zh', japanese:'ja', korean:'ko',
      russian:'ru', hindi:'hi', turkish:'tr', dutch:'nl', polish:'pl',
      luganda:'lg', somali:'so', hausa:'ha', yoruba:'yo', amharic:'am',
      fr:'fr', es:'es', ar:'ar', sw:'sw', de:'de', pt:'pt', it:'it',
      zh:'zh', ja:'ja', ko:'ko', ru:'ru', hi:'hi', tr:'tr', nl:'nl',
    };
    const code = langPairs[targetLang.toLowerCase()] || targetLang.toLowerCase();
    const url  = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text.slice(0, 500)) + '&langpair=en|' + code;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

module.exports = {
  name: 'noortranslate',
  aliases: ['ntranslate', 'ntrans', 'noortrans', 'noor-translate'],
  category: 'astra-x-ai',
  description: 'Translate text to any language. Usage: .noortranslate <lang> <text>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const lang = args[0];
    const text = args.slice(1).join(' ').trim() || getQuotedText(msg);

    if (!lang || !text) return sock.sendMessage(jid, {
      text: box('🌍 *ASTRA-X TRANSLATE*',
        '❓ Provide a language and text!\n\n📌 *Usage:* .noortranslate <language> <text>\n\n💡 *Examples:*\n.noortranslate French Hello how are you\n.noortranslate Swahili Good morning friends\n.noortranslate Arabic I love you\n.noortranslate Spanish Thank you very much\n\n🌐 *Supports 50+ languages!*'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🌍 *ᴀsᴛʀᴀ-x ᴛʀᴀɴsʟᴀᴛᴇ*\n┠─────────────────────\n┃ _Translating to ' + lang + '..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      const res = await myMemoryTranslate(text, lang);
      if (!res.responseData?.translatedText) throw new Error('Translation failed.');
      const translated = res.responseData.translatedText;
      const body = '🔤 *Original:*\n_' + text.slice(0, 200) + '_\n\n🌍 *' + lang.charAt(0).toUpperCase() + lang.slice(1) + ':*\n' + translated;
      await sock.sendMessage(jid, {
        text: box('🌍 *ASTRA-X TRANSLATE*', body),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🌍 *ASTRA-X TRANSLATE*', '❌ Translation error: ' + e.message) });
    }
  },
};

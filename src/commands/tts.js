'use strict';
const { box } = require('../utils/format');
const https = require('https');
const http  = require('http');
function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || null;
}
function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, res => {
      if ([301,302,303].includes(res.statusCode) && res.headers.location) return fetchBuf(res.headers.location).then(resolve).catch(reject);
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve(Buffer.concat(chunks))); res.on('error', reject);
    }).on('error', reject);
  });
}
module.exports = {
  name: 'tts', aliases: ['speak', 'voice', 'say', 'texttospeech'],
  category: 'media', description: 'Text to speech. Usage: .tts <text>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const text = args.join(' ').trim() || getQuotedText(msg);
    if (!text) return sock.sendMessage(jid, { text: box('🔊 *TEXT TO SPEECH*', '📌 *Usage:* .tts <text>\n\n💡 *Example:*\n.tts Hello, how are you today?\n\nOr reply to a message with *.tts*') });
    await sock.sendMessage(jid, { text: box('🔊 *TEXT TO SPEECH*', '_Converting to speech..._') });
    try {
      const url = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text.slice(0, 200));
      const buf = await fetchBuf(url);
      if (!buf || buf.length < 100) return; // silent on empty response
      await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
    } catch (_) { /* silent */ }
  },
};

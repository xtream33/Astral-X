'use strict';
const https  = require('https');
const http   = require('http');
const { execSync } = require('child_process');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end',  () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function getImageUrl(msg) {
  const m = msg.message;
  if (!m) return null;
  const img = m.imageMessage || m.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
  return img?.url || null;
}

module.exports = {
  name: 'ocr',
  aliases: ['readimage', 'extracttext', 'imagetext', 'imgtext', 'readtext'],
  category: 'utility',
  description: 'Extract text from an image. Reply to an image with .ocr',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;

    // Get quoted or direct image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.message?.imageMessage || quoted?.imageMessage;

    if (!imgMsg) {
      return sock.sendMessage(jid, { text: '📷 Reply to an image with *.ocr* to extract text from it.' });
    }

    await sock.sendMessage(jid, { text: '🔍 Reading text from image...' });

    try {
      const stream   = await sock.downloadMediaMessage(imgMsg.url ? msg : { message: quoted });
      const b64      = Buffer.isBuffer(stream) ? stream.toString('base64') : Buffer.from(stream).toString('base64');

      // OCR.space free API
      const payload  = 'base64Image=data:image/jpeg;base64,' + encodeURIComponent(b64) +
                       '&language=eng&isOverlayRequired=false&detectOrientation=true&scale=true&OCREngine=2';
      const result   = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.ocr.space',
          path:     '/parse/image',
          method:   'POST',
          headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'apikey': 'helloworld' },
        }, res => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });

      const text = result?.ParsedResults?.[0]?.ParsedText?.trim();
      if (!text) return sock.sendMessage(jid, { text: '❌ No text found in this image.' });

      await sock.sendMessage(jid, {
        text: '📝 *Extracted Text:*\n━━━━━━━━━━━━━━\n\n' + text,
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ OCR failed: ' + e.message });
    }
  },
};

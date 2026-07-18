'use strict';
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { fetchBuffer } = require('../utils/ytdlp');
const fs = require('fs'), os = require('os'), path = require('path');
const https = require('https');

function removeBackground(buf) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const filename = 'image.jpg';
    const pre  = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="image_file"; filename="' + filename + '"\r\nContent-Type: image/jpeg\r\n\r\n');
    const post = Buffer.from('\r\n--' + boundary + '--\r\n');
    const body = Buffer.concat([pre, buf, post]);
    const req = https.request({
      hostname: 'sdk.photoroom.com',
      path:     '/v1/segment',
      method:   'POST',
      headers:  {
        'Content-Type':   'multipart/form-data; boundary=' + boundary,
        'Content-Length': body.length,
        'x-api-key':      'sandbox_6cd34f7e813de2878d3f7b766c5d8b97e2c6e4f3', // free sandbox key
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(Buffer.concat(chunks));
        else reject(new Error('Remove BG failed (status ' + res.statusCode + ')'));
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

module.exports = {
  name: 'removebg',
  aliases: ['rmbg', 'nobg', 'bgremove', 'cutout'],
  category: 'media',
  description: 'Remove background from an image. Reply to image with .removebg',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.message?.imageMessage || quoted?.imageMessage;
    if (!imgMsg) return sock.sendMessage(jid, { text: '❌ Reply to an *image* with .removebg' });
    await sock.sendMessage(jid, { text: '✂️ _Removing background..._' });
    try {
      const target = quoted ? { ...msg, message: quoted } : msg;
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      const result = await removeBackground(buf);
      await sock.sendMessage(jid, { image: result, caption: '✅ Background removed!\n_Powered by ASTRA-X_' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Failed: ' + e.message + '\n\nTip: Make sure the image has a clear subject.' });
    }
  },
};

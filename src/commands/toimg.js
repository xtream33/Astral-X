'use strict';
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

module.exports = {
  name: 'toimg',
  aliases: ['stickertoimg', 'webptoimg', 'unpack'],
  category: 'media',
  description: 'Convert a sticker/webp to image. Reply to sticker with .toimg',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const stkMsg = msg.message?.stickerMessage || quoted?.stickerMessage;
    if (!stkMsg) return sock.sendMessage(jid, { text: '❌ Reply to a *sticker* with .toimg' });

    await sock.sendMessage(jid, { text: '⏳ Converting sticker to image...' });
    const target = quoted ? { ...msg, message: quoted } : msg;
    const tmpIn  = path.join(os.tmpdir(), 'toimg_' + Date.now() + '.webp');
    const tmpOut = path.join(os.tmpdir(), 'toimg_' + Date.now() + '.png');
    try {
      const buf = await downloadMediaMessage(target, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      fs.writeFileSync(tmpIn, buf);
      exec(`ffmpeg -i "${tmpIn}" "${tmpOut}" -y`, { timeout: 20000 }, async (err) => {
        try {
          if (err && !fs.existsSync(tmpOut)) return sock.sendMessage(jid, { text: '❌ Conversion failed. Make sure ffmpeg is installed:\n```pkg install ffmpeg```' });
          await sock.sendMessage(jid, { image: fs.readFileSync(tmpOut), caption: '🖼️ Sticker converted to image' }, { quoted: msg });
        } finally {
          try { fs.unlinkSync(tmpIn); } catch(_) {}
          try { fs.unlinkSync(tmpOut); } catch(_) {}
        }
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ Error: ' + e.message }); }
  },
};

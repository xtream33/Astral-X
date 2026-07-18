'use strict';
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const { box } = require('../utils/format');
module.exports = {
  name: 'sticker', aliases: ['s', 'stik'],
  category: 'media', description: 'Convert image/video to sticker. Reply to media with .sticker',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = msg.message?.imageMessage || quoted?.imageMessage;
    const vidMsg = msg.message?.videoMessage  || quoted?.videoMessage;
    if (!imgMsg && !vidMsg) return sock.sendMessage(jid, { text: box('🖼️ *STICKER MAKER*', '📌 *How to use:*\nReply to an *image or short video* with *.sticker*\n\n⚠️ *Requires ffmpeg:*\n`pkg install ffmpeg`') });
    await sock.sendMessage(jid, { text: box('🖼️ *STICKER MAKER*', '_Creating sticker..._') });
    const isVideo   = !!vidMsg;
    const targetMsg = quoted ? { ...msg, message: quoted } : msg;
    const tmpIn     = path.join(os.tmpdir(), 'stk_in_'  + Date.now());
    const tmpOut    = path.join(os.tmpdir(), 'stk_out_' + Date.now() + '.webp');
    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      fs.writeFileSync(tmpIn, buffer);
      const cmd = isVideo
        ? `ffmpeg -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,fps=15" -loop 0 -an -t 6 "${tmpOut}" -y 2>&1`
        : `ffmpeg -i "${tmpIn}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000" "${tmpOut}" -y 2>&1`;
      exec(cmd, { timeout: 45000 }, async (err) => {
        try {
          if (err && !fs.existsSync(tmpOut)) {
            if (err.code === 127) return sock.sendMessage(jid, { text: box('🖼️ *STICKER MAKER*', '❌ ffmpeg not installed.\n\nInstall it with:\n`pkg install ffmpeg`') });
            return; // silent on other errors
          }
          await sock.sendMessage(jid, { sticker: fs.readFileSync(tmpOut) }, { quoted: msg });
        } finally {
          try { fs.unlinkSync(tmpIn); }  catch (_) {}
          try { fs.unlinkSync(tmpOut); } catch (_) {}
        }
      });
    } catch (_) { /* silent */ }
  },
};

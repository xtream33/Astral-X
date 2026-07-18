const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

module.exports = {
  name: 'tomp3',
  aliases: ['mp3', 'audio', 'toaudio'],
  category: 'media',
  description: 'Convert a replied video to MP3 audio',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const target = quoted || msg.message;

    if (!target?.videoMessage && !target?.audioMessage)
      return sock.sendMessage(jid, { text: '❌ Reply to a *video or audio* with !tomp3\n\nRequires ffmpeg:\n```pkg install ffmpeg```' });

    await sock.sendMessage(jid, { text: '🎵 Converting to MP3...' });

    const targetMsg = quoted ? { ...msg, message: quoted } : msg;

    try {
      const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
      const tmpIn  = path.join(os.tmpdir(), 'mp3in_'  + Date.now());
      const tmpOut = path.join(os.tmpdir(), 'mp3out_' + Date.now() + '.mp3');
      fs.writeFileSync(tmpIn, buffer);

      exec(`ffmpeg -i "${tmpIn}" -vn -ar 44100 -ac 2 -b:a 192k "${tmpOut}" -y 2>&1`, { timeout: 60000 }, async (err) => {
        try {
          if (err || !fs.existsSync(tmpOut)) {
            if (err?.code === 127) return sock.sendMessage(jid, { text: '❌ ffmpeg not installed.\n```pkg install ffmpeg```' });
            return sock.sendMessage(jid, { text: '❌ Conversion failed.' });
          }
          await sock.sendMessage(jid, { audio: fs.readFileSync(tmpOut), mimetype: 'audio/mpeg', ptt: false });
        } finally {
          try { fs.unlinkSync(tmpIn);  } catch (_) {}
          try { fs.unlinkSync(tmpOut); } catch (_) {}
        }
      });
    } catch (e) { await sock.sendMessage(jid, { text: '❌ ' + e.message }); }
  },
};

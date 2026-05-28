'use strict';
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { box } = require('../utils/format');
const TEMP  = path.join(__dirname, '../../sessions/.shazam_tmp');
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true });
function postJSON(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}
module.exports = {
  name: 'shazam', aliases: ['identify', 'whatsong', 'detectsong', 'recognize'],
  category: 'media', description: 'Identify a song from audio. Reply to audio with .shazam',
  execute: async (sock, msg) => {
    const jid    = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const audioMsg = msg.message?.audioMessage || quoted?.audioMessage || msg.message?.videoMessage || quoted?.videoMessage;
    if (!audioMsg) return sock.sendMessage(jid, { text: box('🎵 *SHAZAM*', '📌 *How to use:*\nReply to any *audio or voice note* with *.shazam*\n\n_I will identify the song for you!_ 🎶') });
    await sock.sendMessage(jid, { text: box('🎵 *SHAZAM*', '_Listening and identifying..._\n_Please wait..._ 🎵') });
    try {
      const buf = await sock.downloadMediaMessage(audioMsg.url ? msg : { message: quoted });
      const tmpF = path.join(TEMP, Date.now() + '.mp3');
      fs.writeFileSync(tmpF, buf);
      const boundary = '----AstraXBoundary' + Date.now();
      const body = '--' + boundary + '\r\nContent-Disposition: form-data; name="audio"; filename="audio.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n' + buf.toString('binary') + '\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="api_token"\r\n\r\ntest\r\n--' + boundary + '--\r\n';
      try { fs.unlinkSync(tmpF); } catch (_) {}
      const result = await postJSON({ hostname: 'api.audd.io', path: '/', method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': Buffer.byteLength(body, 'binary') } }, Buffer.from(body, 'binary'));
      const song = result?.result;
      if (!song) return; // silent — no response if not identified
      await sock.sendMessage(jid, { text: box('🎵 *SONG IDENTIFIED!*', '🎶 *Title:* ' + song.title + '\n🎤 *Artist:* ' + song.artist + '\n💿 *Album:* ' + (song.album || 'Unknown') + '\n📅 *Year:* ' + (song.release_date?.split('-')[0] || 'Unknown') + (song.song_link ? '\n🔗 ' + song.song_link : '')) }, { quoted: msg });
    } catch (_) { /* silent — no response on failure */ }
  },
};

'use strict';
/**
 * ASTRA-X Download Utility
 * Primary:  yt-dlp (handles YouTube, TikTok, Instagram, Facebook, Twitter, SoundCloud + 1000 sites)
 * Fallback: tikwm.com for TikTok (confirmed working on this server)
 * The original ytdlp.js handles all multi-attempt retry logic
 */

const { ytdlpDownload, sendFile, fetchBuffer, getSongInfo, sendInfoCard } = require('./ytdlp');
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const crypto = require('crypto');

function tmpFile(ext) {
  return path.join(os.tmpdir(), 'astrax_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex') + '.' + ext);
}

function detectPlatform(url) {
  if (/youtu\.be|youtube\.com/i.test(url))                return 'youtube';
  if (/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url))    return 'tiktok';
  if (/instagram\.com/i.test(url))                        return 'instagram';
  if (/facebook\.com|fb\.watch|fb\.com/i.test(url))      return 'facebook';
  if (/twitter\.com|x\.com/i.test(url))                  return 'twitter';
  if (/soundcloud\.com/i.test(url))                       return 'soundcloud';
  return 'other';
}

// TikTok fallback via tikwm (confirmed 200 on this server)
function tikwmDownload(url) {
  return new Promise((resolve, reject) => {
    const body = 'url=' + encodeURIComponent(url) + '&count=12&cursor=0&web=1&hd=1';
    const parsed = new URL('https://www.tikwm.com/api/');
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 20000,
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0 && json.data) {
            resolve(json.data.hdplay || json.data.play);
          } else {
            reject(new Error(json.msg || 'tikwm failed'));
          }
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('tikwm timeout')); });
    req.write(body);
    req.end();
  });
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36', 'Referer': 'https://www.tiktok.com/' },
      timeout: 120000,
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Master download — tries yt-dlp first (handles 1000+ sites),
 * falls back to tikwm for TikTok if yt-dlp fails
 */
async function freeDownload(sock, jid, url, opts = {}) {
  const { audioOnly = false, quotedMsg = null } = opts;
  const platform = detectPlatform(url);

  // Always try yt-dlp first — it handles everything
  const ytdlpOk = await ytdlpDownload(sock, jid, url, {
    audioOnly,
    maxSizeMB: 45,
    query: null,
    showInfo: false,
  });

  if (ytdlpOk) return true;

  // yt-dlp failed — try platform-specific fallbacks
  if (platform === 'tiktok') {
    try {
      await sock.sendMessage(jid, { text: '🔄 _Trying alternate TikTok source..._' });
      const dlUrl = await tikwmDownload(url);
      const buf   = await downloadBuffer(dlUrl);
      const tmp   = tmpFile('mp4');
      fs.writeFileSync(tmp, buf);
      await sendFile(sock, jid, tmp);
      return true;
    } catch (_) {}
  }

  // All fallbacks failed — silent (ytdlpDownload already sent the error message)
  return false;
}

/**
 * Search + download — tries YouTube first, then SoundCloud for audio
 */
async function searchAndDownload(sock, jid, query, audioOnly, quotedMsg) {
  await sock.sendMessage(jid, {
    text: (audioOnly ? '🎵' : '🎬') + ' _Searching for *' + query + '*..._'
  });

  // Try YouTube search
  const info = await getSongInfo(query);
  if (info) {
    await sendInfoCard(sock, jid, info, audioOnly ? 'audio' : 'video');
    const ok = await ytdlpDownload(sock, jid, null, {
      audioOnly,
      maxSizeMB: 45,
      query,
      showInfo: false,
    });
    if (ok) return true;
  }

  // Fallback: try SoundCloud for audio
  if (audioOnly) {
    await sock.sendMessage(jid, { text: '🔄 _Trying SoundCloud..._' });
    const scInfo = await getSongInfo('scsearch1:' + query);
    if (scInfo) {
      await sendInfoCard(sock, jid, scInfo, 'audio');
      return ytdlpDownload(sock, jid, null, {
        audioOnly: true,
        maxSizeMB: 45,
        query: 'scsearch1:' + query,
        showInfo: false,
      });
    }
  }

  // All failed
  await sock.sendMessage(jid, {
    text: '❌ *Nothing found for:* _' + query + '_\n\nTry:\n• Different spelling\n• Artist + song name\n• A direct URL',
  });
  return false;
}

module.exports = {
  freeDownload,
  searchAndDownload,
  detectPlatform,
  ytdlpDownload,
  sendFile,
  fetchBuffer,
  getSongInfo,
  sendInfoCard,
};

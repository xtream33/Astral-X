'use strict';
/**
 * ASTRA-X Free Download Utility
 * Uses free public APIs/scrapers — no API key needed
 * Platforms: YouTube, Instagram, Facebook, Twitter/X, TikTok, SoundCloud
 */

const https  = require('https');
const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const lib     = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(opts.headers || {}),
      },
      timeout: opts.timeout || 30000,
    };
    lib.get(url, options, res => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpGet(res.headers.location, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Request timed out')));
  });
}

function httpPost(url, data, opts = {}) {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const lib     = url.startsWith('https') ? https : http;
    const body    = typeof data === 'string' ? data : JSON.stringify(data);
    const ct      = opts.json ? 'application/json' : 'application/x-www-form-urlencoded';
    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (url.startsWith('https') ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Content-Type': ct,
        'Content-Length': Buffer.byteLength(body),
        'Accept': '*/*',
        ...(opts.headers || {}),
      },
      timeout: opts.timeout || 30000,
    };
    const req = lib.request(options, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        return httpPost(res.headers.location, data, opts).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.write(body);
    req.end();
  });
}

function parseJSON(buf) {
  try { return JSON.parse(buf.toString()); } catch (_) { return null; }
}

// ── Download buffer from direct URL ─────────────────────────────────────────

async function downloadBuffer(url, referer) {
  const headers = {};
  if (referer) headers['Referer'] = referer;
  const res = await httpGet(url, { headers, timeout: 120000 });
  if (res.status !== 200) throw new Error('HTTP ' + res.status);
  return res.body;
}

// ── Save buffer to temp file ─────────────────────────────────────────────────

function saveTmp(buf, ext) {
  const name = 'astrax_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex') + '.' + ext;
  const fp   = path.join(os.tmpdir(), name);
  fs.writeFileSync(fp, buf);
  return fp;
}

// ── Send file via WhatsApp sock ──────────────────────────────────────────────

async function sendFile(sock, jid, filePath, caption, quotedMsg) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const ext    = path.extname(filePath).toLowerCase().replace('.', '');
  const buffer = fs.readFileSync(filePath);
  const opts   = quotedMsg ? { quoted: quotedMsg } : {};
  try {
    if (['mp3', 'm4a', 'ogg', 'wav', 'opus', 'aac', 'flac'].includes(ext)) {
      await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false }, opts);
    } else if (['mp4', 'mkv', 'webm', 'mov', 'avi', '3gp'].includes(ext)) {
      try {
        await sock.sendMessage(jid, { video: buffer, caption: caption || '✅ *Download Complete!*', mimetype: 'video/mp4' }, opts);
      } catch (_) {
        await sock.sendMessage(jid, { document: buffer, mimetype: 'video/mp4', fileName: 'video.mp4', caption: caption || '✅ *Download Complete!*' }, opts);
      }
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      await sock.sendMessage(jid, { image: buffer, caption: caption || '✅ Done!' }, opts);
    } else {
      await sock.sendMessage(jid, { document: buffer, mimetype: 'application/octet-stream', fileName: path.basename(filePath), caption: caption || '' }, opts);
    }
    return true;
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ Could not send file: ' + e.message });
    return false;
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ── YOUTUBE DOWNLOADERS ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Method 1: cobalt.tools public API (open-source, free, no key)
async function cobaltDownload(url, audioOnly) {
  const apiUrl  = 'https://co.wuk.sh/api/json';
  const payload = JSON.stringify({
    url,
    vCodec:      'h264',
    vQuality:    '720',
    aFormat:     'mp3',
    isAudioOnly: audioOnly,
    isNoTTWatermark: true,
    isTTFullAudio: false,
  });
  const res  = await httpPost(apiUrl, payload, {
    json: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    timeout: 25000,
  });
  const data = parseJSON(res.body);
  if (!data) throw new Error('Invalid response');
  if (data.status === 'error') throw new Error(data.text || 'Cobalt error');
  // status: stream | redirect | picker
  if (data.url) return data.url;
  if (data.picker) return data.picker[0]?.url;
  throw new Error('No download URL in response');
}

// Method 2: yt5s / y2mate-style API
async function y2mateInfo(url) {
  const apiUrl = 'https://www.yt-download.org/api/button/mp4/' + extractYTId(url);
  const res    = await httpGet(apiUrl, { timeout: 20000 });
  const html   = res.body.toString();
  const match  = html.match(/href="(https:\/\/[^"]+\.googlevideo\.com[^"]+)"/);
  if (match) return match[1];
  throw new Error('y2mate: no link found');
}

// Method 3: ytapi.org (free, no key)
async function ytapiOrg(url, audioOnly) {
  const vidId  = extractYTId(url);
  if (!vidId) throw new Error('Cannot extract YouTube video ID');
  const apiUrl = 'https://ytapi.org/api/?id=' + vidId + '&format=' + (audioOnly ? 'mp3' : 'mp4');
  const res    = await httpGet(apiUrl, { timeout: 20000 });
  const data   = parseJSON(res.body);
  if (data && data.url) return data.url;
  throw new Error('ytapi.org: no url');
}

// Method 4: noembed for metadata + invidious for download
async function invidiousDownload(url, audioOnly) {
  const vidId    = extractYTId(url);
  if (!vidId) throw new Error('No YouTube ID');
  // Try multiple Invidious public instances
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.privacyredirect.com',
    'https://yt.drgnz.club',
  ];
  for (const base of instances) {
    try {
      const apiUrl = base + '/api/v1/videos/' + vidId;
      const res    = await httpGet(apiUrl, { timeout: 15000 });
      const data   = parseJSON(res.body);
      if (!data || !data.adaptiveFormats) continue;
      if (audioOnly) {
        const fmt = data.adaptiveFormats.find(f => f.type && f.type.includes('audio/mp4'))
                 || data.adaptiveFormats.find(f => f.type && f.type.includes('audio/'));
        if (fmt && fmt.url) return fmt.url;
      } else {
        const fmt = data.formatStreams
          ? data.formatStreams.find(f => f.resolution === '720p' || f.resolution === '480p' || f.resolution === '360p')
          : null;
        if (fmt && fmt.url) return fmt.url;
      }
    } catch (_) {}
  }
  throw new Error('Invidious: no instance worked');
}

function extractYTId(url) {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// YouTube: search via Invidious (free, no key)
async function ytSearch(query) {
  const instances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.privacyredirect.com',
  ];
  for (const base of instances) {
    try {
      const url = base + '/api/v1/search?q=' + encodeURIComponent(query) + '&type=video&page=1';
      const res = await httpGet(url, { timeout: 12000 });
      const data = parseJSON(res.body);
      if (Array.isArray(data) && data.length > 0) {
        const v = data[0];
        return {
          title:     v.title,
          videoId:   v.videoId,
          url:       'https://www.youtube.com/watch?v=' + v.videoId,
          uploader:  v.author,
          duration:  v.lengthSeconds,
          thumbnail: v.videoThumbnails?.[0]?.url || null,
          views:     v.viewCount,
        };
      }
    } catch (_) {}
  }
  return null;
}

// Main YouTube downloader — tries multiple methods
async function downloadYouTube(url, audioOnly) {
  const errors = [];
  // 1. Cobalt
  try { return await cobaltDownload(url, audioOnly); } catch (e) { errors.push('cobalt: ' + e.message); }
  // 2. Invidious direct stream
  try { return await invidiousDownload(url, audioOnly); } catch (e) { errors.push('invidious: ' + e.message); }
  // 3. ytapi.org
  try { return await ytapiOrg(url, audioOnly); } catch (e) { errors.push('ytapi: ' + e.message); }
  throw new Error('All YouTube methods failed: ' + errors.join(' | '));
}

// ════════════════════════════════════════════════════════════════════════════
// ── INSTAGRAM DOWNLOADER ─────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Method 1: cobalt (also handles Instagram)
async function cobaltInstagram(url) {
  return cobaltDownload(url, false);
}

// Method 2: instasave API (free scraper)
async function instaSaveAPI(url) {
  const apiUrl = 'https://api.instasave.buzz/api/instagram?url=' + encodeURIComponent(url);
  const res    = await httpGet(apiUrl, { timeout: 20000 });
  const data   = parseJSON(res.body);
  if (data && data.url) return data.url;
  if (data && Array.isArray(data.data) && data.data[0]?.url) return data.data[0].url;
  throw new Error('instasave: no url');
}

// Method 3: snapinsta-style (web scrape)
async function snapsaveDownload(url) {
  const payload = 'url=' + encodeURIComponent(url) + '&lang=en';
  const res     = await httpPost('https://snapsave.app/action.php', payload, {
    headers: {
      'Referer': 'https://snapsave.app/',
      'Origin':  'https://snapsave.app',
    },
    timeout: 20000,
  });
  const html  = res.body.toString();
  const match = html.match(/href="(https:\/\/[^"]+(?:\.mp4|\.jpg|cdninstagram[^"]+))[^"]*"/i);
  if (match) return match[1];
  throw new Error('snapsave: no link found');
}

async function downloadInstagram(url) {
  const errors = [];
  try { return await cobaltInstagram(url); } catch (e) { errors.push('cobalt: ' + e.message); }
  try { return await instaSaveAPI(url); } catch (e) { errors.push('instasave: ' + e.message); }
  try { return await snapsaveDownload(url); } catch (e) { errors.push('snapsave: ' + e.message); }
  throw new Error('Instagram download failed: ' + errors.join(' | '));
}

// ════════════════════════════════════════════════════════════════════════════
// ── FACEBOOK DOWNLOADER ──────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Method 1: cobalt
async function cobaltFacebook(url) {
  return cobaltDownload(url, false);
}

// Method 2: getfvid.com free scraper
async function getfvidDownload(url) {
  // First get token
  const pageRes = await httpGet('https://www.getfvid.com/', { timeout: 15000 });
  const pageHtml = pageRes.body.toString();
  const tokenMatch = pageHtml.match(/name="_token"\s+value="([^"]+)"/);
  const token = tokenMatch ? tokenMatch[1] : '';

  const payload = 'url=' + encodeURIComponent(url) + '&_token=' + encodeURIComponent(token);
  const res = await httpPost('https://www.getfvid.com/downloader', payload, {
    headers: { 'Referer': 'https://www.getfvid.com/', 'Origin': 'https://www.getfvid.com' },
    timeout: 25000,
  });
  const html  = res.body.toString();
  const match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i);
  if (match) return decodeURIComponent(match[1]);
  throw new Error('getfvid: no mp4 link');
}

// Method 3: fdown.net style
async function fbdownNet(url) {
  const apiUrl = 'https://fdownloader.net/api/ajaxSearch';
  const payload = 'q=' + encodeURIComponent(url) + '&lang=en';
  const res = await httpPost(apiUrl, payload, {
    headers: { 'Referer': 'https://fdownloader.net/', 'X-Requested-With': 'XMLHttpRequest' },
    timeout: 20000,
  });
  const data = parseJSON(res.body);
  if (data && data.data) {
    const html  = data.data;
    const match = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i);
    if (match) return decodeURIComponent(match[1]).replace(/&amp;/g, '&');
  }
  throw new Error('fdownloader: no link');
}

async function downloadFacebook(url) {
  const errors = [];
  try { return await cobaltFacebook(url); } catch (e) { errors.push('cobalt: ' + e.message); }
  try { return await fbdownNet(url); } catch (e) { errors.push('fdown: ' + e.message); }
  try { return await getfvidDownload(url); } catch (e) { errors.push('getfvid: ' + e.message); }
  throw new Error('Facebook download failed: ' + errors.join(' | '));
}

// ════════════════════════════════════════════════════════════════════════════
// ── TWITTER / X DOWNLOADER ───────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Method 1: cobalt (handles twitter well)
async function cobaltTwitter(url) {
  return cobaltDownload(url, false);
}

// Method 2: twitsave.com
async function twitSave(url) {
  const apiUrl = 'https://twitsave.com/info?url=' + encodeURIComponent(url);
  const res    = await httpGet(apiUrl, { timeout: 20000 });
  const html   = res.body.toString();
  const match  = html.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/i);
  if (match) return match[1].replace(/&amp;/g, '&');
  throw new Error('twitsave: no mp4 found');
}

// Method 3: twittervid.com style
async function xDownAPI(url) {
  const apiUrl = 'https://api.vxtwitter.com/Twitter/status/' + url.split('/').pop().split('?')[0];
  const res    = await httpGet(apiUrl, { timeout: 15000 });
  const data   = parseJSON(res.body);
  if (data && data.media_extended) {
    const vid = data.media_extended.find(m => m.type === 'video');
    if (vid && vid.url) return vid.url;
  }
  throw new Error('vxtwitter: no video');
}

async function downloadTwitter(url) {
  const errors = [];
  try { return await cobaltTwitter(url); } catch (e) { errors.push('cobalt: ' + e.message); }
  try { return await xDownAPI(url); } catch (e) { errors.push('vxtwitter: ' + e.message); }
  try { return await twitSave(url); } catch (e) { errors.push('twitsave: ' + e.message); }
  throw new Error('Twitter/X download failed: ' + errors.join(' | '));
}

// ════════════════════════════════════════════════════════════════════════════
// ── TIKTOK DOWNLOADER ────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

// Method 1: cobalt (no watermark!)
async function cobaltTikTok(url) {
  return cobaltDownload(url, false);
}

// Method 2: tikwm.com (free, no watermark)
async function tikwmDownload(url) {
  const payload = 'url=' + encodeURIComponent(url) + '&count=12&cursor=0&web=1&hd=1';
  const res     = await httpPost('https://www.tikwm.com/api/', payload, {
    headers: { 'Referer': 'https://www.tikwm.com/', 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 25000,
  });
  const data = parseJSON(res.body);
  if (data && data.code === 0 && data.data) {
    return data.data.hdplay || data.data.play;
  }
  throw new Error('tikwm: ' + (data?.msg || 'no video'));
}

// Method 3: ssstik.io style
async function ssstikDownload(url) {
  const pageRes  = await httpGet('https://ssstik.io/en', { timeout: 15000 });
  const pageHtml = pageRes.body.toString();
  const ttMatch  = pageHtml.match(/tt:\s*'([^']+)'/);
  const tt       = ttMatch ? ttMatch[1] : '';
  const payload  = 'id=' + encodeURIComponent(url) + '&locale=en&tt=' + encodeURIComponent(tt);
  const res      = await httpPost('https://ssstik.io/abc?url=dl', payload, {
    headers: {
      'Referer': 'https://ssstik.io/en',
      'HX-Request': 'true',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 25000,
  });
  const html  = res.body.toString();
  const match = html.match(/href="(https:\/\/[^"]+(?:\.mp4|tikcdn)[^"]*)"/i);
  if (match) return match[1];
  throw new Error('ssstik: no link');
}

async function downloadTikTok(url) {
  const errors = [];
  try { return await cobaltTikTok(url); } catch (e) { errors.push('cobalt: ' + e.message); }
  try { return await tikwmDownload(url); } catch (e) { errors.push('tikwm: ' + e.message); }
  try { return await ssstikDownload(url); } catch (e) { errors.push('ssstik: ' + e.message); }
  throw new Error('TikTok download failed: ' + errors.join(' | '));
}

// ════════════════════════════════════════════════════════════════════════════
// ── METADATA FETCHERS ─────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function fmtDuration(s) {
  if (!s) return '—';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0')
           : m + ':' + String(sec).padStart(2,'0');
}
function fmtViews(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return String(n);
}

async function getYTMeta(url) {
  try {
    const vidId = extractYTId(url);
    if (!vidId) return null;
    // noembed.com — free, no key, gets basic metadata
    const res  = await httpGet('https://noembed.com/embed?url=' + encodeURIComponent(url), { timeout: 10000 });
    const data = parseJSON(res.body);
    if (data && data.title) {
      return {
        title:    data.title,
        uploader: data.author_name,
        thumbnail: 'https://img.youtube.com/vi/' + vidId + '/hqdefault.jpg',
        source:   'YouTube',
      };
    }
  } catch (_) {}
  return null;
}

async function getTikTokMeta(url) {
  try {
    const payload = 'url=' + encodeURIComponent(url) + '&count=12&cursor=0&web=1&hd=1';
    const res     = await httpPost('https://www.tikwm.com/api/', payload, {
      headers: { 'Referer': 'https://www.tikwm.com/' },
      timeout: 15000,
    });
    const data = parseJSON(res.body);
    if (data?.code === 0 && data.data) {
      return {
        title:     data.data.title,
        uploader:  data.data.author?.nickname,
        thumbnail: data.data.cover,
        duration:  data.data.duration,
        views:     data.data.play_count,
        likes:     data.data.digg_count,
        source:    'TikTok',
      };
    }
  } catch (_) {}
  return null;
}

// ── Send info card ─────────────────────────────────────────────────────────────
async function sendInfoCard(sock, jid, meta, type) {
  try {
    const emoji   = type === 'audio' ? '🎵' : '🎬';
    const caption =
      emoji + ' *' + (meta.title || 'Unknown') + '*\n' +
      '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n' +
      '👤 *Channel:* ' + (meta.uploader || '—') + '\n' +
      (meta.duration ? '⏱️ *Duration:* ' + fmtDuration(meta.duration) + '\n' : '') +
      (meta.views ? '👁️ *Views:* ' + fmtViews(meta.views) + '\n' : '') +
      '🌐 *Source:* ' + (meta.source || 'Online') + '\n' +
      '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n' +
      '_⏳ Downloading now, please wait..._';

    if (meta.thumbnail) {
      const imgBuf = await downloadBuffer(meta.thumbnail).catch(() => null);
      if (imgBuf) {
        await sock.sendMessage(jid, { image: imgBuf, caption });
        return;
      }
    }
    await sock.sendMessage(jid, { text: caption });
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════════════════════
// ── MAIN DISPATCHER ───────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════

function detectPlatform(url) {
  if (/youtu\.be|youtube\.com/.test(url))     return 'youtube';
  if (/tiktok\.com|vm\.tiktok|vt\.tiktok/.test(url)) return 'tiktok';
  if (/instagram\.com/.test(url))             return 'instagram';
  if (/facebook\.com|fb\.watch|fb\.com/.test(url)) return 'facebook';
  if (/twitter\.com|x\.com/.test(url))        return 'twitter';
  if (/soundcloud\.com/.test(url))            return 'soundcloud';
  return 'unknown';
}

/**
 * Master download function — auto-detects platform and uses free APIs
 * @param {object}  sock       - WhatsApp socket
 * @param {string}  jid        - Chat JID
 * @param {string}  url        - Media URL
 * @param {object}  opts       - { audioOnly, quotedMsg }
 */
async function freeDownload(sock, jid, url, opts = {}) {
  const { audioOnly = false, quotedMsg = null } = opts;
  const platform = detectPlatform(url);

  try {
    let dlUrl = null;
    let meta  = null;
    let ext   = audioOnly ? 'mp3' : 'mp4';

    if (platform === 'youtube') {
      meta  = await getYTMeta(url);
      if (meta) await sendInfoCard(sock, jid, meta, audioOnly ? 'audio' : 'video');
      dlUrl = await downloadYouTube(url, audioOnly);
    } else if (platform === 'tiktok') {
      meta  = await getTikTokMeta(url);
      if (meta) await sendInfoCard(sock, jid, meta, 'video');
      dlUrl = await downloadTikTok(url);
      ext   = 'mp4';
    } else if (platform === 'instagram') {
      await sock.sendMessage(jid, { text: '📸 _Fetching Instagram media..._' });
      dlUrl = await downloadInstagram(url);
      ext   = dlUrl.includes('.jpg') || dlUrl.includes('image') ? 'jpg' : 'mp4';
    } else if (platform === 'facebook') {
      await sock.sendMessage(jid, { text: '📘 _Fetching Facebook video..._' });
      dlUrl = await downloadFacebook(url);
    } else if (platform === 'twitter') {
      await sock.sendMessage(jid, { text: '🐦 _Fetching Twitter/X video..._' });
      dlUrl = await downloadTwitter(url);
    } else {
      // Generic: try cobalt for unknown platforms
      await sock.sendMessage(jid, { text: '🌐 _Fetching media..._' });
      dlUrl = await cobaltDownload(url, audioOnly);
    }

    if (!dlUrl) throw new Error('No download link obtained');

    await sock.sendMessage(jid, { text: '📥 _Downloading... please hold on!_' });
    const buf    = await downloadBuffer(dlUrl, url);
    const tmpFile = saveTmp(buf, ext);
    await sendFile(sock, jid, tmpFile, '✅ *Download Complete!*\n_Powered by ASTRA-X_ 🌍', quotedMsg);
    return true;

  } catch (e) {
    await sock.sendMessage(jid, {
      text:
        '❌ *Download failed*\n\n' +
        '_' + (e.message || 'Unknown error').slice(0, 180) + '_\n\n' +
        '*Tips:*\n' +
        '• Make sure the URL is public (not private/restricted)\n' +
        '• Try again in a minute — servers may be busy\n' +
        '• For YouTube audio, try: *.song <title>*',
    });
    return false;
  }
}

// ── YouTube search + download (for .song / .play commands) ─────────────────

async function searchAndDownload(sock, jid, query, audioOnly, quotedMsg) {
  await sock.sendMessage(jid, { text: (audioOnly ? '🎵' : '🎬') + ' _Searching for *' + query + '*..._' });

  // Try Invidious search
  const result = await ytSearch(query).catch(() => null);
  if (!result) {
    await sock.sendMessage(jid, { text: '❌ No results found for: *' + query + '*\nTry a different search term.' });
    return false;
  }

  // Show info card
  const meta = {
    title:    result.title,
    uploader: result.uploader,
    duration: result.duration,
    views:    result.views,
    thumbnail: result.thumbnail,
    source:   'YouTube',
  };
  await sendInfoCard(sock, jid, meta, audioOnly ? 'audio' : 'video');

  return freeDownload(sock, jid, result.url, { audioOnly, quotedMsg });
}

module.exports = {
  freeDownload,
  searchAndDownload,
  downloadYouTube,
  downloadTikTok,
  downloadInstagram,
  downloadFacebook,
  downloadTwitter,
  sendFile,
  downloadBuffer,
  saveTmp,
  ytSearch,
  sendInfoCard,
  detectPlatform,
};

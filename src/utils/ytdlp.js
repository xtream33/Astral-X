'use strict';
const { exec, execSync } = require('child_process');
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

// ── Find yt-dlp regardless of how Termux sets PATH ────────────────────────
const YTDLP_PATHS = [
  '/data/data/com.termux/files/usr/bin/yt-dlp',
  '/usr/local/bin/yt-dlp',
  '/usr/bin/yt-dlp',
];
const YTDLP = YTDLP_PATHS.find(p => fs.existsSync(p)) || 'yt-dlp';

// ── Find ffmpeg ────────────────────────────────────────────────────────────
const FFMPEG_PATHS = [
  '/data/data/com.termux/files/usr/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
];
const FFMPEG = FFMPEG_PATHS.find(p => fs.existsSync(p)) || 'ffmpeg';

const ENV = {
  ...process.env,
  PATH: [
    process.env.PATH || '',
    '/data/data/com.termux/files/usr/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
  ].join(':'),
};

// ── Cookies file path (optional — place cookies.txt in bot root) ───────────
const COOKIES_FILE = path.join(__dirname, '../../cookies.txt');
const HAS_COOKIES  = fs.existsSync(COOKIES_FILE);

// ── Download a URL to a buffer ─────────────────────────────────────────────
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

// ── Get song/video info ────────────────────────────────────────────────────
function getSongInfo(query) {
  return new Promise(resolve => {
    // Don't double-wrap if query already has a search prefix (scsearch1:, ytsearch1:, etc.)
    const hasPrefix = query.startsWith('http') || /^[a-z]+search\d*:/.test(query);
    const target = hasPrefix ? `"${query}"` : `"ytsearch1:${query}"`;
    const cookieFlag = HAS_COOKIES ? `--cookies "${COOKIES_FILE}"` : '';
    const cmd = `"${YTDLP}" --dump-single-json --no-playlist --no-warnings --quiet ${cookieFlag} ${target} 2>/dev/null`;
    exec(cmd, { timeout: 30_000, env: ENV }, (err, stdout) => {
      if (err || !stdout.trim()) return resolve(null);
      try { resolve(JSON.parse(stdout.trim())); }
      catch (_) { resolve(null); }
    });
  });
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmtViews(n) {
  if (!n) return '—';
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return String(n);
}
function fmtDuration(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
}
function sourceLabel(url) {
  if (!url) return 'Online';
  if (url.includes('tiktok'))    return 'TikTok';
  if (url.includes('instagram')) return 'Instagram';
  if (url.includes('facebook') || url.includes('fb.watch')) return 'Facebook';
  if (url.includes('twitter') || url.includes('x.com'))    return 'Twitter/X';
  if (url.includes('youtu'))     return 'YouTube';
  if (url.includes('soundcloud'))return 'SoundCloud';
  if (url.includes('spotify'))   return 'Spotify';
  return 'Web';
}

// ── Send info card (thumbnail + details) ───────────────────────────────────
async function sendInfoCard(sock, jid, info, type = 'audio') {
  try {
    const emoji = type === 'audio' ? '🎵' : '🎬';
    const caption =
      emoji + ' *' + (info.title || 'Unknown') + '*\n' +
      '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n' +
      '👤 *Artist/Channel:* ' + (info.uploader || info.channel || '—') + '\n' +
      '⏱️ *Duration:* ' + fmtDuration(info.duration) + '\n' +
      '👁️ *Views:* ' + fmtViews(info.view_count) + '\n' +
      '❤️ *Likes:* ' + fmtViews(info.like_count) + '\n' +
      '📅 *Uploaded:* ' + (info.upload_date ? info.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '—') + '\n' +
      '🌐 *Source:* ' + sourceLabel(info.webpage_url || '') + '\n' +
      '┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n' +
      '_⏳ Please wait, downloading now..._';

    const thumb = info.thumbnail;
    if (thumb) {
      const imgBuf = await fetchBuffer(thumb).catch(() => null);
      if (imgBuf) {
        await sock.sendMessage(jid, { image: imgBuf, caption }).catch(() => {});
        return;
      }
    }
    await sock.sendMessage(jid, { text: caption }).catch(() => {});
  } catch (_) {}
}

// ── Build common bypass flags ──────────────────────────────────────────────
function bypassFlags(url = '') {
  const flags = [
    '--no-check-certificate',
    '--geo-bypass',
    '--force-ipv4',
    '--socket-timeout 30',
    '--age-limit 99',          // allow age-restricted content
    '--ignore-no-formats-error',
  ];
  const cookieFlag = HAS_COOKIES ? `--cookies "${COOKIES_FILE}"` : '';
  if (cookieFlag) flags.push(cookieFlag);

  if (url.includes('youtu') || !url.startsWith('http')) {
    flags.push('--extractor-retries 3');
    flags.push('--fragment-retries 5');
    // Multiple player clients — ios almost always bypasses age-restriction
    flags.push('--extractor-args "youtube:player_client=ios,web,android_embedded"');
    flags.push('--add-header "User-Agent:com.google.ios.youtube/19.29.1 CFNetwork/1408.0.4 Darwin/22.5.0"');
    flags.push('--add-header "Accept-Language:en-US,en;q=0.9"');
    // Skip NSIG issues
    flags.push('--no-check-formats');
  }
  return flags.join(' ');
}

// ── Friendly error ─────────────────────────────────────────────────────────
function friendlyError(out, audioOnly, maxSizeMB) {
  const msg = (out || '').toLowerCase();
  if (msg.includes('command not found') || msg.includes('no such file')) {
    return '❌ *yt-dlp not installed.*\n\nRun this in Termux:\n```pkg install yt-dlp ffmpeg```';
  }
  if (msg.includes('too large') || msg.includes('max-filesize')) {
    return `❌ *File too large* (limit: ${maxSizeMB}MB)\n\n_Try audio only: *!song <name>*_`;
  }
  if (msg.includes('private')) {
    return '🔒 *Private content.*\n\n_The uploader has restricted access._';
  }
  if (msg.includes('unavailable') || msg.includes('not available') || msg.includes('removed') || msg.includes('deleted')) {
    return '⚠️ *Content unavailable.*\n\n_This may have been removed or is region-blocked._';
  }
  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many request')) {
    return '⏳ *Rate limited.*\n\n_Please wait 1-2 minutes and try again._';
  }
  // Age-restricted: retry with iOS client (already has bypass flags)
  if (msg.includes('sign in') || msg.includes('login') || msg.includes('age-restricted') || msg.includes('age restricted')) {
    return null; // null = trigger retry with alternate client
  }
  if (msg.includes('403') || msg.includes('nsig') || msg.includes('blocked')) {
    return null; // trigger retry
  }
  return null; // generic: retry
}

// ── Extract the actual output filepath from yt-dlp stdout ─────────────────
// yt-dlp with --print after_move:filepath prints the path as the LAST non-error line
function extractFilePath(stdout) {
  if (!stdout) return null;
  const lines = (stdout || '').split('\n').map(l => l.trim()).filter(Boolean);
  // Walk from the end — find the first line that is an existing file path
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    // Must look like an absolute path and the file must exist
    if ((l.startsWith('/') || l.match(/^[A-Za-z]:\\/)) && fs.existsSync(l)) {
      return l;
    }
  }
  // Fallback: glob for any astrax_ temp file created in the last 5 minutes
  try {
    const tmp   = os.tmpdir();
    const now   = Date.now();
    const files = fs.readdirSync(tmp)
      .filter(f => f.startsWith('astrax_'))
      .map(f => ({ f, t: fs.statSync(path.join(tmp, f)).mtimeMs }))
      .filter(x => now - x.t < 5 * 60 * 1000)
      .sort((a, b) => b.t - a.t);
    if (files.length) return path.join(tmp, files[0].f);
  } catch (_) {}
  return null;
}

// ── Send the downloaded file ───────────────────────────────────────────────
async function sendFile(sock, jid, filePath) {
  if (!filePath || !fs.existsSync(filePath)) return false;
  const ext    = path.extname(filePath).toLowerCase().replace('.', '');
  const buffer = fs.readFileSync(filePath);
  try {
    if (['mp3','m4a','ogg','wav','opus','aac','flac'].includes(ext)) {
      await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false });
    } else if (['jpg','jpeg','png','webp','gif'].includes(ext)) {
      await sock.sendMessage(jid, { image: buffer, caption: '✅ *Download Complete!*' });
    } else if (['mp4','mkv','webm','mov','avi','flv','3gp'].includes(ext)) {
      try {
        await sock.sendMessage(jid, { video: buffer, caption: '✅ *Download Complete!*', mimetype: 'video/mp4' });
      } catch (_) {
        await sock.sendMessage(jid, { document: buffer, mimetype: 'video/mp4', fileName: 'video.mp4', caption: '✅ *Download Complete!*' });
      }
    } else {
      await sock.sendMessage(jid, { document: buffer, mimetype: 'application/octet-stream', fileName: path.basename(filePath) });
    }
    return true;
  } catch (e) {
    await sock.sendMessage(jid, { text: '❌ *Could not send the file.*\n_Error: ' + e.message + '_' });
    return false;
  } finally {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
}

// ── Main download function ─────────────────────────────────────────────────
async function ytdlpDownload(sock, jid, url, opts = {}) {
  const { audioOnly = false, maxSizeMB = 40, query = null, showInfo = false } = opts;

  // Show info card first if requested
  if (showInfo) {
    const info = await getSongInfo(query || url);
    if (info) await sendInfoCard(sock, jid, info, audioOnly ? 'audio' : 'video');
    else await sock.sendMessage(jid, { text: '⏳ Found it! Downloading now, please wait...' });
  }

  // Respect existing search prefixes (scsearch1:, ytsearch1:, etc.)
  const hasSearchPrefix = query && /^[a-z]+search\d*:/.test(query);
  const target      = query ? (hasSearchPrefix ? query : `ytsearch1:${query}`) : (url || '');
  const rawUrl      = url   || '';
  const stamp       = Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const outTemplate = path.join(os.tmpdir(), `astrax_${stamp}.%(ext)s`);

  const audioFmt = '-f bestaudio/best -x --audio-format mp3 --audio-quality 0';
  const videoFmt = '-f "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4][height<=720]/best[height<=480]/best[ext=mp4]/best"';
  const fmt      = audioOnly ? audioFmt : videoFmt;
  const bypass   = bypassFlags(rawUrl);
  const ffmpegFlag = fs.existsSync(FFMPEG) ? `--ffmpeg-location "${FFMPEG}"` : '';

  // Build a command variant
  const buildCmd = (extraFlags = '') => [
    `"${YTDLP}"`,
    fmt,
    bypass,
    ffmpegFlag,
    extraFlags,
    `--max-filesize ${maxSizeMB}m`,
    '--no-playlist',
    '--no-part',
    '--no-warnings',
    `--output "${outTemplate}"`,
    '--print after_move:filepath',
    `"${target}"`,
  ].filter(Boolean).join(' ') + ' 2>&1';

  // Attempt 1: standard command
  const result1 = await runCmd(buildCmd(), 180_000);
  if (result1.ok) {
    const fp = extractFilePath(result1.out);
    if (fp) return sendFile(sock, jid, fp);
  }

  // Check if we should retry or give a friendly error
  const friendly = friendlyError(result1.out, audioOnly, maxSizeMB);
  if (friendly) {
    await sock.sendMessage(jid, { text: friendly });
    return false;
  }

  // Attempt 2: force iOS client (bypasses age-restriction + most sign-in walls)
  await sock.sendMessage(jid, { text: '🔄 _Retrying with alternate method..._' });
  const iosFlags = '--extractor-args "youtube:player_client=ios" --add-header "User-Agent:com.google.ios.youtube/19.29.1 CFNetwork/1408.0.4 Darwin/22.5.0"';
  const result2  = await runCmd(buildCmd(iosFlags), 150_000);
  if (result2.ok) {
    const fp = extractFilePath(result2.out);
    if (fp) return sendFile(sock, jid, fp);
  }

  // Attempt 3: android_embedded client (also bypasses age gates)
  const androidFlags = '--extractor-args "youtube:player_client=android_embedded,android" --add-header "User-Agent:com.google.android.youtube/17.36.4(Linux; U; Android 11) gzip"';
  const result3 = await runCmd(buildCmd(androidFlags), 150_000);
  if (result3.ok) {
    const fp = extractFilePath(result3.out);
    if (fp) return sendFile(sock, jid, fp);
  }

  // Attempt 4: simplest possible fallback — best format, no quality constraints
  const stamp2       = Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const outTemplate2 = path.join(os.tmpdir(), `astrax_${stamp2}.%(ext)s`);
  const fallbackCmd  = `"${YTDLP}" -f best ${bypass} ${ffmpegFlag} --max-filesize ${maxSizeMB}m --no-playlist --no-part --no-warnings --output "${outTemplate2}" --print after_move:filepath "${target}" 2>&1`;
  const result4 = await runCmd(fallbackCmd, 120_000);
  if (result4.ok) {
    const fp = extractFilePath(result4.out);
    if (fp) return sendFile(sock, jid, fp);
  }

  // All attempts failed
  const errLine = (result1.out || result4.out || '').split('\n')
    .find(l => l.trim() && !l.startsWith('[') && !l.startsWith('WARNING')) || 'Unknown error';

  await sock.sendMessage(jid, {
    text:
      '❌ *Download failed.*\n\n' +
      '_' + errLine.slice(0, 200) + '_\n\n' +
      '*Tips:*\n' +
      '• Update yt-dlp: `pip install -U yt-dlp`\n' +
      '• For YouTube try: `!song <name>` (uses SoundCloud)\n' +
      '• Age-restricted videos cannot be downloaded without cookies',
  });
  return false;
}

// ── Helper: run a shell command and return {ok, out} ──────────────────────
function runCmd(cmd, timeout) {
  return new Promise(resolve => {
    exec(cmd, { timeout, env: ENV }, (error, stdout) => {
      const out = (stdout || '').trim();
      resolve({ ok: !error, out });
    });
  });
}

module.exports = { ytdlpDownload, sendFile, fetchBuffer, getSongInfo, sendInfoCard };

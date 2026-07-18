'use strict';
/**
 * ASTRA-X APK Fetch Utility
 * Uses free public APIs — no API key needed
 * Sources: APKPure search API, APKCombo, F-Droid, APKMirror scraping
 */

const https = require('https');
const http  = require('http');

function httpGet(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        'Accept': 'application/json, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(opts.headers || {}),
      },
      timeout: opts.timeout || 25000,
    };
    lib.get(url, options, res => {
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

function parseJSON(buf) {
  try { return JSON.parse(buf.toString()); } catch (_) { return null; }
}

// ── APKPure search (free, no key) ─────────────────────────────────────────────
async function apkpureSearch(query) {
  const url  = 'https://apkpure.com/search-suggest-json?key=' + encodeURIComponent(query) + '&type=1';
  const res  = await httpGet(url, { timeout: 15000 });
  const data = parseJSON(res.body);
  if (!Array.isArray(data) || !data.length) return null;
  const app = data[0];
  return {
    name:    app.t || app.title || app.n,
    pkg:     app.n || app.packageName,
    version: app.v || 'latest',
    icon:    app.i || app.icon || null,
    source:  'APKPure',
  };
}

// ── APKCombo search ───────────────────────────────────────────────────────────
async function apkcomboSearch(query) {
  const url = 'https://apkcombo.com/api/v2/search?q=' + encodeURIComponent(query) + '&device=phone&lang=en';
  const res  = await httpGet(url, { timeout: 15000 });
  const data = parseJSON(res.body);
  if (data && data.items && data.items.length > 0) {
    const app = data.items[0];
    return {
      name:    app.title || app.name,
      pkg:     app.package_name || app.pkg,
      version: app.version || 'latest',
      icon:    app.icon || null,
      source:  'APKCombo',
    };
  }
  return null;
}

// ── Google Play Store unofficial scrape (gplayapi) ────────────────────────────
async function gplaySearch(query) {
  // Use free gplay-scraper style endpoint
  const url  = 'https://play.google.com/store/search?q=' + encodeURIComponent(query) + '&c=apps&hl=en';
  const res  = await httpGet(url, {
    headers: { 'Accept': 'text/html' },
    timeout: 20000,
  });
  const html = res.body.toString();
  // Extract app info from meta tags / JSON-LD
  const pkgMatch   = html.match(/"id":"([a-zA-Z][a-zA-Z0-9_.]+)"/);
  const titleMatch = html.match(/<title>([^<]+) - Apps on Google Play/);
  if (pkgMatch) {
    return {
      name:    titleMatch ? titleMatch[1].trim() : pkgMatch[1],
      pkg:     pkgMatch[1],
      version: 'latest',
      icon:    null,
      source:  'Google Play',
    };
  }
  return null;
}

// ── F-Droid search (open-source apps only) ────────────────────────────────────
async function fdroidSearch(query) {
  const url  = 'https://f-droid.org/api/v1/search?q=' + encodeURIComponent(query) + '&limit=3';
  const res  = await httpGet(url, { timeout: 15000 });
  const data = parseJSON(res.body);
  if (data && data.apps && data.apps.length > 0) {
    const app = data.apps[0];
    return {
      name:        app.name || app.localized?.['en-US']?.name,
      pkg:         app.packageName,
      version:     app.suggestedVersionName || 'latest',
      description: app.localized?.['en-US']?.summary || '',
      icon:        app.icon ? 'https://f-droid.org/repo/' + app.packageName + '/en-US/' + app.icon : null,
      downloadUrl: 'https://f-droid.org/repo/' + app.packageName + '_' + (app.suggestedVersionCode || '') + '.apk',
      source:      'F-Droid',
      isOpenSource: true,
    };
  }
  return null;
}

// ── Get app details from Google Play (unofficial, free) ───────────────────────
async function getPlayDetails(pkg) {
  const url  = 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(pkg) + '&hl=en';
  const res  = await httpGet(url, { headers: { 'Accept': 'text/html' }, timeout: 20000 });
  const html = res.body.toString();

  const ratingMatch  = html.match(/"starRating":"?([\d.]+)"?/);
  const reviewMatch  = html.match(/"reviewCount":"?(\d+)"?/);
  const sizeMatch    = html.match(/"size":"([^"]+)"/);
  const updatedMatch = html.match(/"updated":"([^"]+)"/);
  const devMatch     = html.match(/"developerName":"([^"]+)"/);
  const dlMatch      = html.match(/"numDownloads":"([^"]+)"/);
  const descMatch    = html.match(/"description":"([^"]{20,300})"/);
  const categoryMatch = html.match(/"genre":"([^"]+)"/);
  const minAndroidMatch = html.match(/"minAndroidVersion":"([^"]+)"/);

  return {
    rating:      ratingMatch ? parseFloat(ratingMatch[1]).toFixed(1) : null,
    reviews:     reviewMatch ? parseInt(reviewMatch[1]).toLocaleString() : null,
    size:        sizeMatch ? sizeMatch[1] : null,
    updated:     updatedMatch ? updatedMatch[1] : null,
    developer:   devMatch ? devMatch[1] : null,
    downloads:   dlMatch ? dlMatch[1] : null,
    description: descMatch ? descMatch[1].replace(/\\n/g, ' ').replace(/\\u003c[^>]*\\u003e/g, '').slice(0, 200) : null,
    category:    categoryMatch ? categoryMatch[1] : null,
    minAndroid:  minAndroidMatch ? minAndroidMatch[1] : null,
  };
}

// ── APKPure download (direct APK download URL) ────────────────────────────────
function apkpureDownloadUrl(pkg) {
  return 'https://d.apkpure.com/b/APK/' + pkg + '?version=latest';
}

// ── Unified search: tries multiple sources ────────────────────────────────────
async function searchApp(query) {
  const errors = [];
  try {
    const r = await apkpureSearch(query);
    if (r && r.pkg) return r;
  } catch (e) { errors.push('apkpure: ' + e.message); }

  try {
    const r = await apkcomboSearch(query);
    if (r && r.pkg) return r;
  } catch (e) { errors.push('apkcombo: ' + e.message); }

  try {
    const r = await gplaySearch(query);
    if (r && r.pkg) return r;
  } catch (e) { errors.push('gplay: ' + e.message); }

  return null;
}

// ── Format large numbers ──────────────────────────────────────────────────────
function fmtNum(n) {
  if (!n) return '—';
  const num = parseInt(String(n).replace(/[^0-9]/g, ''));
  if (isNaN(num)) return n;
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return String(num);
}

module.exports = {
  searchApp,
  apkpureSearch,
  apkcomboSearch,
  fdroidSearch,
  getPlayDetails,
  apkpureDownloadUrl,
  fmtNum,
  httpGet,
  parseJSON,
};

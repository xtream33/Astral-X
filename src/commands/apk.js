const https = require('https');
const http  = require('http');
const fs    = require('fs');
const os    = require('os');
const path  = require('path');

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetch(res.headers.location));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

module.exports = {
  name: 'apk',
  aliases: ['app','appdownload','apkdown','getapk'],
  category: 'media',
  description: 'Download an APK by app name. !apk WhatsApp',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, { text: '📦 *Usage:* !apk <app name>\nExample: *!apk WhatsApp*\nExample: *!apk com.whatsapp* (package name)' });

    const query = args.join(' ');
    await sock.sendMessage(jid, { text: '🔍 Searching for *' + query + '* APK...' });

    try {
      // Search APKPure
      const searchUrl = 'https://apkpure.com/search-suggest-json?key=' + encodeURIComponent(query) + '&type=1';
      const searchRes = await fetch(searchUrl);
      const results   = JSON.parse(searchRes.buffer.toString());

      if (!results || !results.length) {
        return sock.sendMessage(jid, { text: '❌ No app found for *' + query + '*\n\nTry using the full app name or package name (e.g. com.whatsapp)' });
      }

      const app        = results[0];
      const pkgName    = app.n || app.packageName;
      const appName    = app.t || app.title || pkgName;
      const appVersion = app.v || 'latest';

      await sock.sendMessage(jid, { text: '📦 Found: *' + appName + '*\n📋 Package: ' + pkgName + '\n🔖 Version: ' + appVersion + '\n\n⬇️ Downloading APK...' });

      // Download APK
      const apkUrl   = 'https://d.apkpure.com/b/APK/' + pkgName + '?version=latest';
      const apkRes   = await fetch(apkUrl);

      if (apkRes.status !== 200 || !apkRes.buffer.length) {
        return sock.sendMessage(jid, {
          text: '❌ Could not download APK automatically.\n\n🔗 *Download manually:*\nhttps://apkpure.com/' + pkgName + '/' + pkgName,
        });
      }

      const filePath = path.join(os.tmpdir(), pkgName + '_' + Date.now() + '.apk');
      fs.writeFileSync(filePath, apkRes.buffer);

      await sock.sendMessage(jid, {
        document: apkRes.buffer,
        mimetype: 'application/vnd.android.package-archive',
        fileName: appName.replace(/\s+/g, '_') + '_v' + appVersion + '.apk',
        caption: '✅ *' + appName + '*\n📦 ' + pkgName + '\n🔖 v' + appVersion,
      });

      try { fs.unlinkSync(filePath); } catch (_) {}
    } catch (e) {
      await sock.sendMessage(jid, {
        text: '❌ APK download failed: ' + e.message + '\n\n🔗 Try manually:\nhttps://apkpure.com/search?q=' + encodeURIComponent(query),
      });
    }
  },
};

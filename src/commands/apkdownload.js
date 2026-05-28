'use strict';
const { searchApp, apkpureDownloadUrl, getPlayDetails } = require('../utils/apkfetch');
const { box } = require('../utils/format');
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

function downloadBuf(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, {
      timeout: 120000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36' },
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location)
        return downloadBuf(res.headers.location).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = {
  name: 'apkdownload',
  aliases: ['apk', 'app', 'apkdown', 'getapk', 'downloadapk', 'appdownload'],
  category: 'apk-download',
  description: 'Download any APK directly. Usage: .apk <app name>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('📦 *APK DOWNLOAD*',
        '❓ Provide an app name!\n\n📌 *Usage:* .apk <app name or package>\n\n💡 *Examples:*\n.apk WhatsApp\n.apk Spotify\n.apk Clash of Clans\n.apk com.instagram.android\n\n📂 *For open-source apps:* .apkfree <name>'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📦 *ᴀᴘᴋ ᴅᴏᴡɴʟᴏᴀᴅ*\n┠─────────────────────\n┃ _Searching for *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('📦 *APK DOWNLOAD*', '❌ App not found: *' + query + '*\n\nTry the exact app name or package name (e.g. com.whatsapp)') });

      await sock.sendMessage(jid, {
        text: box('📦 *APK DOWNLOAD*',
          '✅ Found: *' + app.name + '*\n📦 ' + app.pkg + '\n🔖 v' + app.version + '\n🌐 Source: ' + app.source + '\n\n⬇️ _Downloading APK, please wait..._\n_(Large apps may take 1-2 min)_'
        ),
      });

      const dlUrl = apkpureDownloadUrl(app.pkg);
      let buf;
      try {
        buf = await downloadBuf(dlUrl);
      } catch (_) {
        // Fallback: provide direct link if download fails
        return sock.sendMessage(jid, {
          text: box('📦 *APK DOWNLOAD*',
            '⚠️ Direct download unavailable for *' + app.name + '*\n\n🔗 *Download manually:*\nhttps://apkpure.com/download/' + app.pkg + '\n\nOr search:\nhttps://apkcombo.com/apk-downloader/?package_id=' + app.pkg
          ),
        }, { quoted: msg });
      }

      const sizeMB = (buf.length / 1024 / 1024).toFixed(1);
      const fname  = (app.name || app.pkg).replace(/[^a-zA-Z0-9]/g, '_') + '_v' + app.version + '.apk';

      await sock.sendMessage(jid, {
        document: buf,
        mimetype: 'application/vnd.android.package-archive',
        fileName: fname,
        caption:
          '✅ *' + app.name + '*\n' +
          '📦 ' + app.pkg + '\n' +
          '🔖 v' + app.version + '\n' +
          '💾 ' + sizeMB + ' MB\n' +
          '_Downloaded via ASTRA-X_ 🌍',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('📦 *APK DOWNLOAD*', '❌ Download failed: ' + e.message + '\n\n💡 Try: .apklink ' + query) });
    }
  },
};

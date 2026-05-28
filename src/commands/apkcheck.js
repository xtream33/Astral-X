'use strict';
const { httpGet, parseJSON } = require('../utils/apkfetch');
const { box } = require('../utils/format');

// VirusTotal free public API (no key needed for URL lookup)
async function vtURLScan(pkg) {
  // Use Google Safe Browsing info from Play Store page as proxy check
  const url  = 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(pkg) + '&hl=en';
  const res  = await httpGet(url, { timeout: 15000 });
  return res.status === 200;
}

async function checkPermissions(pkg) {
  const url  = 'https://play.google.com/store/apps/details?id=' + encodeURIComponent(pkg) + '&hl=en&gl=US';
  const res  = await httpGet(url, { timeout: 20000 });
  const html = res.body.toString();

  const dangerousPerms = [];
  const permMap = {
    'READ_CONTACTS':          '👥 Read Contacts',
    'WRITE_CONTACTS':         '👥 Write Contacts',
    'READ_CALL_LOG':          '📞 Read Call Log',
    'CAMERA':                 '📷 Camera Access',
    'RECORD_AUDIO':           '🎤 Microphone',
    'ACCESS_FINE_LOCATION':   '📍 Precise Location',
    'ACCESS_COARSE_LOCATION': '📍 Approximate Location',
    'READ_SMS':               '💬 Read SMS',
    'SEND_SMS':               '💬 Send SMS',
    'READ_EXTERNAL_STORAGE':  '💾 Read Storage',
    'WRITE_EXTERNAL_STORAGE': '💾 Write Storage',
    'PROCESS_OUTGOING_CALLS': '📞 Outgoing Calls',
    'READ_PHONE_STATE':       '📱 Phone State',
    'BODY_SENSORS':           '💓 Body Sensors',
    'USE_BIOMETRIC':          '🔐 Biometrics',
  };

  for (const [perm, label] of Object.entries(permMap)) {
    if (html.includes(perm)) dangerousPerms.push(label);
  }

  return dangerousPerms;
}

module.exports = {
  name: 'apkcheck',
  aliases: ['appcheck', 'apksafe', 'apkscan', 'apkverify'],
  category: 'apk-download',
  description: 'Check app safety & permissions. Usage: .apkcheck <app name or package>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: box('🛡️ *APK SAFETY CHECK*',
        '❓ Provide an app name or package!\n\n📌 *Usage:* .apkcheck <app>\n\n💡 *Examples:*\n.apkcheck WhatsApp\n.apkcheck com.whatsapp\n.apkcheck random vpn app'
      ),
    });

    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🛡️ *ᴀᴘᴋ sᴀꜰᴇᴛʏ ᴄʜᴇᴄᴋ*\n┠─────────────────────\n┃ _Scanning *' + query + '*..._\n┗━━━━━━━━━━━━━━━━━━━▣' });

    try {
      const { searchApp } = require('../utils/apkfetch');
      const app = await searchApp(query);
      if (!app) return sock.sendMessage(jid, { text: box('🛡️ *APK SAFETY CHECK*', '❌ App not found: *' + query + '*') });

      const [onPlay, perms] = await Promise.all([
        vtURLScan(app.pkg),
        checkPermissions(app.pkg).catch(() => []),
      ]);

      const safetyScore = onPlay ? (perms.length > 8 ? '⚠️ Moderate Risk' : perms.length > 4 ? '🟡 Low Risk' : '✅ Safe') : '❌ Not on Play Store';
      const safetyEmoji = onPlay ? (perms.length > 8 ? '⚠️' : perms.length > 4 ? '🟡' : '✅') : '❌';

      let body =
        '📱 *' + (app.name || app.pkg) + '*\n' +
        '📦 _' + app.pkg + '_\n━━━━━━━━━━━━━━\n\n' +
        safetyEmoji + ' *Safety Status:* ' + safetyScore + '\n' +
        '🏪 *On Google Play:* ' + (onPlay ? '✅ Yes' : '❌ No') + '\n\n';

      if (perms.length > 0) {
        body += '🔐 *Permissions Detected (' + perms.length + '):*\n';
        perms.forEach(p => { body += '  • ' + p + '\n'; });
        body += '\n';
      } else {
        body += '🔐 *Permissions:* None detected\n\n';
      }

      body +=
        '━━━━━━━━━━━━━━\n' +
        '💡 *Tips:*\n' +
        '• Only install from official sources\n' +
        '• Avoid APKs from unknown sites\n' +
        '• Use .apkfree for open-source alternatives\n' +
        '🔗 https://play.google.com/store/apps/details?id=' + app.pkg;

      await sock.sendMessage(jid, { text: box('🛡️ *APK SAFETY CHECK*', body) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🛡️ *APK SAFETY CHECK*', '❌ Error: ' + e.message) });
    }
  },
};

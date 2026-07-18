'use strict';
const tls  = require('tls');
const https = require('https');

module.exports = {
  name: 'sslcheck',
  aliases: ['ssl', 'certcheck', 'httpscheck'],
  category: 'utility',
  description: 'Check SSL certificate for a domain. Usage: .sslcheck <domain>',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const domain = (args[0] || '').replace(/https?:\/\//,'').split('/')[0];
    if (!domain) return sock.sendMessage(jid, { text: '🔒 Usage: .sslcheck <domain>\n💡 Example: .sslcheck google.com' });
    await sock.sendMessage(jid, { text: '🔒 _Checking SSL for *' + domain + '*..._' });
    try {
      await new Promise((resolve, reject) => {
        const socket = tls.connect(443, domain, { servername: domain, timeout: 10000 }, () => {
          const cert  = socket.getPeerCertificate();
          const valid = socket.authorized;
          const expiry = new Date(cert.valid_to);
          const now    = new Date();
          const daysLeft = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
          const emoji  = daysLeft > 30 ? '✅' : daysLeft > 7 ? '⚠️' : '❌';
          sock.sendMessage(jid, {
            text: '🔒 *SSL Certificate: ' + domain + '*\n━━━━━━━━━━━━━━\n\n' +
                  '📋 Subject: *' + (cert.subject?.CN || domain) + '*\n' +
                  '🏢 Issuer: ' + (cert.issuer?.O || '—') + '\n' +
                  '📅 Valid From: ' + new Date(cert.valid_from).toDateString() + '\n' +
                  '📅 Expires: ' + expiry.toDateString() + '\n' +
                  emoji + ' Days Left: *' + daysLeft + '*\n' +
                  '🔑 Valid: ' + (valid ? '✅ Yes' : '❌ No'),
          }, { quoted: msg }).then(resolve);
          socket.destroy();
        });
        socket.on('error', reject);
        socket.setTimeout(10000, () => { socket.destroy(); reject(new Error('Timeout')); });
      });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ SSL check failed: ' + e.message });
    }
  },
};

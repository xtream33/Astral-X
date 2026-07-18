'use strict';
const dns = require('dns').promises;

module.exports = {
  name: 'dnscheck',
  aliases: ['dns', 'dnslookup', 'nslookup'],
  category: 'utility',
  description: 'Check DNS records for a domain. Usage: .dnscheck <domain>',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const domain = (args[0] || '').replace(/https?:\/\//,'').split('/')[0];
    if (!domain) return sock.sendMessage(jid, { text: '🔍 Usage: .dnscheck <domain>\n💡 Example: .dnscheck google.com' });
    await sock.sendMessage(jid, { text: '🔍 _Checking DNS for *' + domain + '*..._' });
    try {
      const [a, mx, ns, txt] = await Promise.allSettled([
        dns.resolve4(domain),
        dns.resolveMx(domain),
        dns.resolveNs(domain),
        dns.resolveTxt(domain),
      ]);
      let text = '🔍 *DNS Records: ' + domain + '*\n━━━━━━━━━━━━━━\n\n';
      text += '📡 *A Records:*\n' + (a.value?.join('\n') || '—') + '\n\n';
      text += '📧 *MX Records:*\n' + (mx.value?.map(r => r.exchange + ' (priority ' + r.priority + ')').join('\n') || '—') + '\n\n';
      text += '🌐 *NS Records:*\n' + (ns.value?.join('\n') || '—') + '\n\n';
      text += '📝 *TXT Records:*\n' + (txt.value?.map(t => t.join('')).slice(0,3).join('\n') || '—');
      await sock.sendMessage(jid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ DNS lookup failed: ' + e.message });
    }
  },
};

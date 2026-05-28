'use strict';
const os = require('os');

function bar(pct, len=20) {
  const filled = Math.round(pct/100*len);
  return '█'.repeat(filled) + '░'.repeat(len-filled) + ' ' + pct.toFixed(1) + '%';
}
function fmt(b) { return (b/1024/1024).toFixed(1) + ' MB'; }

module.exports = {
  name: 'ram',
  aliases: ['memory', 'mem', 'meminfo'],
  category: 'utility',
  description: 'Show RAM and CPU usage',
  execute: async (sock, msg) => {
    const jid     = msg.key.remoteJid;
    const total   = os.totalmem();
    const free    = os.freemem();
    const used    = total - free;
    const ramPct  = (used/total*100);
    const botMem  = process.memoryUsage();
    const load    = os.loadavg();
    await sock.sendMessage(jid, {
      text:
        '💾 *RAM & CPU USAGE*\n━━━━━━━━━━━━━━━━\n\n' +
        '🖥️ *RAM*\n' +
        '```' + bar(ramPct) + '```\n' +
        '• Used:  ' + fmt(used) + '\n' +
        '• Free:  ' + fmt(free) + '\n' +
        '• Total: ' + fmt(total) + '\n\n' +
        '🤖 *Bot RAM:* ' + fmt(botMem.rss) + '\n' +
        '📦 *Heap Used:* ' + fmt(botMem.heapUsed) + '\n\n' +
        '⚡ *CPU Load Avg*\n' +
        '• 1m:  ' + load[0].toFixed(2) + '\n' +
        '• 5m:  ' + load[1].toFixed(2) + '\n' +
        '• 15m: ' + load[2].toFixed(2) + '\n\n' +
        '_ASTRA-X TECH 🚀_',
    }, { quoted: msg });
  },
};

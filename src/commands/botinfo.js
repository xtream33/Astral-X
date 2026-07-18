'use strict';
const os  = require('os');
const { box } = require('../utils/format');
const { sessions } = require('../utils/socket');

function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + ' MB';
  return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}
function fmtUptime(s) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + m + 'm';
}

module.exports = {
  name: 'botinfo',
  aliases: ['bot', 'botstatus', 'status2', 'sysinfo'],
  category: 'utility',
  description: 'Show bot and system information',
  execute: async (sock, msg) => {
    const jid      = msg.key.remoteJid;
    const mem      = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const usedMem  = totalMem - freeMem;
    const cpus     = os.cpus();
    const uptime   = process.uptime();
    const active   = Object.values(sessions || {}).filter(s => s?.sock?.user).length;
    const total    = Object.keys(sessions || {}).length;
    const ramPct   = Math.round((usedMem / totalMem) * 100);
    const ramBar   = '█'.repeat(Math.round(ramPct / 10)) + '░'.repeat(10 - Math.round(ramPct / 10));
    await sock.sendMessage(jid, {
      text: box('🤖 *ASTRA-X BOT INFO*',
        '⚙️ *System*\n' +
        '• OS:       ' + os.type() + ' ' + os.arch() + '\n' +
        '• CPU:      ' + (cpus[0]?.model || 'Unknown').slice(0, 28) + '\n' +
        '• Cores:    ' + cpus.length + '\n\n' +
        '💾 *Memory*\n' +
        '• ' + ramBar + ' ' + ramPct + '%\n' +
        '• Total:    ' + fmtBytes(totalMem) + '\n' +
        '• Used:     ' + fmtBytes(usedMem) + '\n' +
        '• Free:     ' + fmtBytes(freeMem) + '\n' +
        '• Bot RAM:  ' + fmtBytes(mem.rss) + '\n\n' +
        '📊 *Bot Stats*\n' +
        '• Uptime:   ' + fmtUptime(Math.floor(uptime)) + '\n' +
        '• Sessions: ' + active + '/' + total + ' online\n' +
        '• Node.js:  ' + process.version + '\n' +
        '• Bot Ver:  v6.6.6\n' +
        '• Platform: ' + process.platform),
    }, { quoted: msg });
  },
};

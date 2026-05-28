module.exports = {
  name: 'stats',
  category: 'info',
  description: 'Bot statistics',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    const mem = process.memoryUsage();
    const used = (mem.heapUsed/1024/1024).toFixed(2);
    const total = (mem.heapTotal/1024/1024).toFixed(2);
    const up = Math.floor(process.uptime());
    const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=up%60;
    await sock.sendMessage(jid, {
      text: `〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 📊 *sᴛᴀᴛɪsᴛɪᴄs*\n┠─────────────────────\n┃ 💾 Used RAM:  ${used} MB\n┃ 📦 Total RAM: ${total} MB\n┃ ⏱️  Uptime:   ${h}h ${m}m ${s}s\n┃ 🖥️  Node.js:  ${process.version}\n┃ 🌐 Platform: ${process.platform}\n┃ ⚡ Status:   Online ✅\n┗━━━━━━━━━━━━━━━━━━━▣`
    });
  }
};

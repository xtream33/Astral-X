function parseTime(str) {
  const m = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  return { s: parseInt(m[1])*1000, m: parseInt(m[1])*60000, h: parseInt(m[1])*3600000, d: parseInt(m[1])*86400000 }[m[2].toLowerCase()];
}
module.exports = {
  name: 'schedule', aliases: ['sched'], category: 'utility',
  description: 'Schedule a message. !schedule 1h Happy birthday everyone!',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args.length < 2) return sock.sendMessage(jid, { text: '\u274c Usage: !schedule <time> <message>\nExample: !schedule 2h Good night everyone!' });
    const ms = parseTime(args[0]);
    if (!ms) return sock.sendMessage(jid, { text: '\u274c Invalid time. Use: 30s, 5m, 2h, 1d' });
    const message = args.slice(1).join(' ');
    await sock.sendMessage(jid, { text: '\ud83d\uddd3\ufe0f Scheduled! Message will be sent in *' + args[0] + '*.' });
    setTimeout(async () => {
      await sock.sendMessage(jid, { text: message }).catch(() => {});
    }, ms);
  }
};
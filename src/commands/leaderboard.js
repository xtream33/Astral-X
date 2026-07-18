const settings = require('../utils/settings');
module.exports = {
  name: 'leaderboard', aliases: ['lb', 'top'], category: 'fun', description: 'Top 10 most active members in this group',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '\u274c Groups only.' });
    const prefix = 'msgcount:' + jid + ':';
    const entries = Object.entries(settings.all())
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => ({ num: k.replace(prefix, '').split('@')[0], count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    if (!entries.length) return sock.sendMessage(jid, { text: '\u274c No data yet. Members need to send messages first.' });
    const medals = ['\ud83e\udd47','\ud83e\udd48','\ud83e\udd49'];
    const rows = entries.map((e, i) => (medals[i] || (i+1) + '.') + ' @' + e.num + ' \u2014 ' + e.count + ' msgs');
    await sock.sendMessage(jid, { text: '\ud83c\udfc6 *TOP ACTIVE MEMBERS*\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' + rows.join('\n'), mentions: entries.map(e => e.num + '@s.whatsapp.net') });
  }
};
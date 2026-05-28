const settings = require('../utils/settings');

module.exports = {
  name: 'tagactive',
  aliases: ['active', 'mentionactive'],
  category: 'group',
  description: 'Tag members who sent a message in the last 24 hours',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us'))
      return sock.sendMessage(jid, { text: '❌ Groups only.' });

    await sock.sendMessage(jid, { text: '⏳ Checking active members...' });

    let meta;
    try { meta = await sock.groupMetadata(jid); }
    catch (_) { return sock.sendMessage(jid, { text: '❌ Could not fetch group info.' }); }

    const window  = 24 * 60 * 60 * 1000; // 24h
    const now     = Date.now();
    const custom  = args.join(' ');
    const active  = [];

    for (const p of meta.participants) {
      const id   = typeof p === 'string' ? p : (p.id || p.jid);
      const last = settings.get('lastmsg:' + jid + ':' + id);
      if (last && (now - last) < window) active.push(id);
    }

    if (!active.length)
      return sock.sendMessage(jid, { text: '📊 No active members found in the last 24 hours.' });

    const mention = active.map(id => '@' + id.split('@')[0]).join(' ');
    const text    = custom
      ? custom + '\n\n' + mention
      : '🟢 *Active members (last 24h) — ' + active.length + '*\n\n' + mention;

    await sock.sendMessage(jid, { text, mentions: active });
  },
};

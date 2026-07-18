const settings = require('../utils/settings');

module.exports = {
  name: 'taginactive',
  aliases: ['inactive', 'mentioninactive'],
  category: 'group',
  description: 'Tag members who have not sent a message in the last 24 hours',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us'))
      return sock.sendMessage(jid, { text: '❌ Groups only.' });

    await sock.sendMessage(jid, { text: '⏳ Checking inactive members...' });

    let meta;
    try { meta = await sock.groupMetadata(jid); }
    catch (_) { return sock.sendMessage(jid, { text: '❌ Could not fetch group info.' }); }

    const window   = 24 * 60 * 60 * 1000;
    const now      = Date.now();
    const custom   = args.join(' ');
    const inactive = [];

    for (const p of meta.participants) {
      const id   = typeof p === 'string' ? p : (p.id || p.jid);
      const last = settings.get('lastmsg:' + jid + ':' + id);
      if (!last || (now - last) >= window) inactive.push(id);
    }

    if (!inactive.length)
      return sock.sendMessage(jid, { text: '🎉 Everyone has been active in the last 24 hours!' });

    // Split into chunks of 50 (WhatsApp mention limit)
    for (let i = 0; i < inactive.length; i += 50) {
      const chunk   = inactive.slice(i, i + 50);
      const mention = chunk.map(id => '@' + id.split('@')[0]).join(' ');
      const text    = custom
        ? (i === 0 ? custom + '\n\n' : '') + mention
        : (i === 0 ? '🔴 *Inactive members (24h+) — ' + inactive.length + '*\n\n' : '') + mention;
      await sock.sendMessage(jid, { text, mentions: chunk });
      if (i + 50 < inactive.length) await new Promise(r => setTimeout(r, 1500));
    }
  },
};

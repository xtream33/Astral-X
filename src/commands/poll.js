module.exports = {
  name: 'poll', category: 'group', description: 'Create a poll. !poll Question | Option1 | Option2',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const parts = args.join(' ').split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length < 3) return sock.sendMessage(jid, { text: '\u274c Usage: !poll Question | Option1 | Option2 | Option3' });
    const [question, ...options] = parts;
    try { await sock.sendMessage(jid, { poll: { name: question, values: options.slice(0, 12), selectableCount: 1 } }); }
    catch (e) { sock.sendMessage(jid, { text: '\u274c Poll failed: ' + e.message }); }
  }
};
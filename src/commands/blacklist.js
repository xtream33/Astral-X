const settings = require('../utils/settings');
module.exports = {
  name: 'blacklist', category: 'protection',
  description: 'Manage blacklisted words. Usage: !blacklist add/remove/list <word>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: '❌ Groups only.' });
    const listKey = `blacklist:${jid}`;
    const onKey   = `blackliston:${jid}`;
    const getList = () => (settings.get(listKey) || '').split(',').filter(Boolean);

    if (!args[0] || args[0] === 'list') {
      const list = getList();
      const on = settings.get(onKey);
      return sock.sendMessage(jid, {
        text: '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n┏━━━━━━━━━━━━━━━━━▣\n┃ 🚫 *ʙʟᴀᴄᴋʟɪsᴛ*\n┠───────────────────\n┃ Status: *' + (on ? '🟢 ON' : '🔴 OFF') + '*\n┃ Words: ' + (list.length ? list.join(', ') : 'none') + '\n┠───────────────────\n┃ !blacklist add <word>\n┃ !blacklist remove <word>\n┃ !blacklist on / off\n┗━━━━━━━━━━━━━━━━━▣'
      });
    }
    const sub  = args[0].toLowerCase();
    const word = args.slice(1).join(' ').toLowerCase().trim();

    if (sub === 'on')  { settings.set(onKey, true);  return sock.sendMessage(jid, { text: '✅ Blacklist enforcement ON.' }); }
    if (sub === 'off') { settings.del(onKey);          return sock.sendMessage(jid, { text: '🔴 Blacklist enforcement OFF.' }); }

    if (!word) return sock.sendMessage(jid, { text: '❌ Provide a word. !blacklist add/remove <word>' });

    if (sub === 'add') {
      const list = getList();
      if (list.includes(word)) return sock.sendMessage(jid, { text: `❌ "${word}" is already blacklisted.` });
      list.push(word);
      settings.set(listKey, list.join(','));
      settings.set(onKey, true);
      return sock.sendMessage(jid, { text: `✅ Added *"${word}"* to blacklist.` });
    }
    if (sub === 'remove') {
      const list = getList().filter(w => w !== word);
      settings.set(listKey, list.join(','));
      return sock.sendMessage(jid, { text: `✅ Removed *"${word}"* from blacklist.` });
    }
    await sock.sendMessage(jid, { text: '❌ Unknown subcommand. Use: add, remove, list, on, off' });
  }
};

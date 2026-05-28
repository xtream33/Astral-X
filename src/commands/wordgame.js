const words = ['apple','banana','mango','elephant','guitar','diamond','jungle','ocean','sunset','forest','candle','mirror','bottle','pillow','camera','garden','pocket','island','silver','golden','rabbit','dragon','castle','bridge','flower','planet','rocket','cheese','butter','pencil'];
const active = {};
module.exports = {
  name: 'wordgame', aliases: ['wg'], category: 'fun',
  description: 'Word chain game: each word must start with the last letter of the previous word',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (args[0] === 'stop') { delete active[jid]; return sock.sendMessage(jid, { text: '🛑 Word game stopped.' }); }
    if (active[jid]) {
      const last = active[jid].lastWord;
      const guess = args[0]?.toLowerCase().trim();
      if (!guess) return sock.sendMessage(jid, { text: '📝 Current word: *' + last + '*\nNext word must start with: *' + last.slice(-1).toUpperCase() + '*' });
      if (guess[0] !== last.slice(-1)) return sock.sendMessage(jid, { text: '❌ Word must start with *' + last.slice(-1).toUpperCase() + '*. Current: *' + last + '*' });
      if (active[jid].used.includes(guess)) return sock.sendMessage(jid, { text: '❌ *' + guess + '* was already used! Try another word.' });
      active[jid].used.push(guess);
      active[jid].lastWord = guess;
      active[jid].score = (active[jid].score || 0) + 1;
      return sock.sendMessage(jid, { text: '✅ *' + guess + '* — Good! Score: *' + active[jid].score + '*\nNext must start with: *' + guess.slice(-1).toUpperCase() + '*' });
    }
    const starter = words[Math.floor(Math.random() * words.length)];
    active[jid] = { lastWord: starter, used: [starter], score: 0 };
    await sock.sendMessage(jid, { text: '〔 ✧ ᴀsᴛʀᴀ-x ✧ 〕\n┏━━━━━━━━━━━━━━━━━▣\n┃ 📝 *ᴡᴏʀᴅ ᴄʜᴀɪɴ ɢᴀᴍᴇ*\n┠───────────────────\n┃ Starting word: *' + starter + '*\n┃ Next must start with: *' + starter.slice(-1).toUpperCase() + '*\n┃\n┃ Type !wg stop to end\n┗━━━━━━━━━━━━━━━━━▣' });
  }
};

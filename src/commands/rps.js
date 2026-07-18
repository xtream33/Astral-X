'use strict';
const { box } = require('../utils/format');
const CHOICES = ['✊ Rock', '✋ Paper', '✌️ Scissors'];
const MAP = { rock: 0, paper: 1, scissors: 2 };
module.exports = {
  name: 'rps', aliases: ['rockpaperscissors', 'rockpaper', 'handgame'],
  category: 'fun', description: 'Rock Paper Scissors. Usage: .rps <rock/paper/scissors>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, { text: box('✊ *ROCK PAPER SCISSORS*', '📌 *Usage:* .rps <choice>\n\n✊ rock\n✋ paper\n✌️ scissors') });
    const user = args[0].toLowerCase();
    if (!(user in MAP)) return sock.sendMessage(jid, { text: box('✊ *ROCK PAPER SCISSORS*', '❌ Invalid choice!\n\nPick one: *rock*, *paper*, or *scissors*') });
    const botIdx = Math.floor(Math.random() * 3), userIdx = MAP[user];
    let result;
    if (userIdx === botIdx) result = '🤝 *Draw!*';
    else if ((userIdx - botIdx + 3) % 3 === 1) result = '🏆 You *Win!* 🎉';
    else result = '💀 Bot *Wins!* 🤖';
    await sock.sendMessage(jid, { text: box('✊ *ROCK PAPER SCISSORS*', '👤 *You:*   ' + CHOICES[userIdx] + '\n🤖 *Bot:*   ' + CHOICES[botIdx] + '\n━━━━━━━━━━━━━━\n\n' + result) }, { quoted: msg });
  },
};

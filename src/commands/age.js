'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'age', aliases: ['birthday', 'howold', 'calcage', 'bday', 'dob'],
  category: 'utility', description: 'Calculate age from a birthdate. Usage: .age <YYYY-MM-DD>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args[0]) return sock.sendMessage(jid, { text: box('🎂 *AGE CALCULATOR*', '📌 *Usage:* .age <date>\n\n💡 *Formats:*\n.age 2000-05-15\n.age 1995-12-25') });
    const date = new Date(args[0]);
    if (isNaN(date)) return sock.sendMessage(jid, { text: box('🎂 *AGE CALCULATOR*', '❌ Invalid date format.\n\n📌 Use: *YYYY-MM-DD*\nExample: .age 2000-05-15') });
    const now = new Date();
    let years = now.getFullYear() - date.getFullYear();
    let months = now.getMonth() - date.getMonth();
    let days = now.getDate() - date.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now - date) / 86400000);
    await sock.sendMessage(jid, { text: box('🎂 *AGE CALCULATOR*', '📅 *Born:* ' + date.toDateString() + '\n━━━━━━━━━━━━━━\n🎉 *Age:* ' + years + ' years, ' + months + ' months, ' + days + ' days\n━━━━━━━━━━━━━━\n📊 *Also:*\n• ' + totalDays.toLocaleString() + ' days total\n• ~' + (totalDays * 24).toLocaleString() + ' hours\n• ~' + (totalDays * 24 * 60).toLocaleString() + ' minutes') }, { quoted: msg });
  },
};

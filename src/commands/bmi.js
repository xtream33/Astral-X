'use strict';
const { box } = require('../utils/format');
module.exports = {
  name: 'bmi', aliases: ['bodymassindex', 'bodyweight', 'weightcheck'],
  category: 'health', description: 'Calculate BMI. Usage: .bmi <weight kg> <height cm>',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    const w = parseFloat(args[0]), h = parseFloat(args[1]);
    if (!w || !h || isNaN(w) || isNaN(h)) return sock.sendMessage(jid, { text: box('⚖️ *BMI CALCULATOR*', '📌 *Usage:* .bmi <weight kg> <height cm>\n\n💡 *Example:*\n.bmi 70 175\n_(70kg, 175cm tall)_') });
    const hm = h / 100, bmi = (w / (hm * hm)).toFixed(1), n = parseFloat(bmi);
    let cat, emoji, advice;
    if      (n < 18.5) { cat = 'Underweight';      emoji = '⚠️';  advice = 'Consider eating more nutritious foods and consult a doctor.'; }
    else if (n < 25)   { cat = 'Normal Weight';     emoji = '💚';  advice = 'Great! Maintain your healthy lifestyle.'; }
    else if (n < 30)   { cat = 'Overweight';        emoji = '🟡';  advice = 'Consider more exercise and a balanced diet.'; }
    else if (n < 35)   { cat = 'Obese (Class I)';   emoji = '🔴';  advice = 'Consult a healthcare provider for a weight loss plan.'; }
    else               { cat = 'Obese (Class II+)'; emoji = '🔴';  advice = 'Please consult a doctor immediately for guidance.'; }
    const idealLow = (18.5 * hm * hm).toFixed(1), idealHigh = (24.9 * hm * hm).toFixed(1);
    await sock.sendMessage(jid, { text: box('⚖️ *BMI RESULT*', '👤 *Weight:* ' + w + ' kg\n📏 *Height:* ' + h + ' cm\n━━━━━━━━━━━━━━\n📊 *BMI:* ' + bmi + '\n' + emoji + ' *Category:* ' + cat + '\n🎯 *Ideal weight:* ' + idealLow + ' – ' + idealHigh + ' kg\n━━━━━━━━━━━━━━\n💡 ' + advice) }, { quoted: msg });
  },
};

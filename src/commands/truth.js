'use strict';
const { box } = require('../utils/format');
const Q = [
  'What is your biggest fear?', 'What is the most embarrassing thing you have done?',
  'What is your biggest secret?', 'Have you ever lied to your best friend?',
  'What is your worst habit?', 'Who was your first crush?',
  'What is something you have never told anyone?', 'What are you most insecure about?',
  'What is the most childish thing you still do?', 'Have you ever cheated on a test?',
  'What is your guilty pleasure?', 'What would you change about yourself?',
  'What is the biggest lie you have ever told?', 'What is your most embarrassing moment?',
  'Who do you have a secret crush on right now?',
];
module.exports = {
  name: 'truth', aliases: ['truthquestion', 'truthortruth', 'truthtime'],
  category: 'fun', description: 'Get a truth question. Usage: .truth',
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: box('🔮 *TRUTH*', Q[Math.floor(Math.random() * Q.length)] + '\n\n_Answer honestly!_ 😬') }, { quoted: msg });
  },
};

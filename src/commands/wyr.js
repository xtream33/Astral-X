'use strict';
const { box } = require('../utils/format');
const W = [
  'Would you rather be rich or famous?', 'Would you rather fly or be invisible?',
  'Would you rather live without music or without internet?', 'Would you rather always be hot or always be cold?',
  'Would you rather have no phone or no friends?', 'Would you rather speak every language or play every instrument?',
  'Would you rather be 10 years older or 10 years younger?', 'Would you rather always tell the truth or always lie?',
  'Would you rather be the smartest or the funniest person?', 'Would you rather lose all memories or never make new ones?',
  'Would you rather never use social media again or never watch movies again?',
  'Would you rather have unlimited money but no friends, or be broke but have amazing friends?',
  'Would you rather be able to talk to animals or speak all human languages?',
  'Would you rather live in the past or the future?',
];
module.exports = {
  name: 'wyr', aliases: ['wouldyourather', 'wyrchoice', 'oryou'],
  category: 'fun', description: 'Would you rather question. Usage: .wyr',
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: box('🤔 *WOULD YOU RATHER*', W[Math.floor(Math.random() * W.length)] + '\n\n_Reply with your choice!_ 👇') }, { quoted: msg });
  },
};

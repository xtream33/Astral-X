'use strict';
const { makeCommand } = require('./imagine');
// Re-export as named style — imagine.js exports factory
// This file is a thin wrapper so loadCommands picks it up
const { fetchBuffer } = require('../utils/ytdlp');

const STYLES = {
  photo:        'photorealistic, DSLR photography, high detail, ',
  portrait:     'portrait photography, professional, studio lighting, ',
  anime2:       'anime style, detailed anime art, studio ghibli inspired, ',
  art:          'digital art, concept art, highly detailed, artstation, ',
  logo:         'minimal flat logo design, vector, clean, professional, ',
  wallpaper2:   'HD wallpaper, 4k, stunning, desktop background, ',
  cartoon:      'cartoon style, colorful, fun, animated, ',
  realistic:    'hyperrealistic, photorealistic, 8k resolution, ultra detailed, ',
  fantasy:      'fantasy art, magical, epic, detailed fantasy world, ',
  nature:       'nature photography, beautiful scenery, golden hour, ',
  space:        'space art, galaxy, nebula, cosmic, NASA quality, ',
  abstract:     'abstract art, modern, colorful shapes, contemporary art, ',
  architecture: 'architectural photography, building design, modern architecture, ',
  food2:        'food photography, delicious, professional lighting, appetizing, ',
  animal2:      'wildlife photography, animal portrait, nature, ',
  drawing:      'pencil drawing, sketch art, detailed line art, ',
  painting:     'oil painting, classical art style, masterpiece, ',
  sketch:       'pencil sketch, black and white, detailed sketch, ',
  '3d':         '3D render, octane render, cinema 4d, highly detailed 3D, ',
  neon:         'neon lights, cyberpunk, glowing neon colors, dark background, ',
  vintage:      'vintage style, retro aesthetic, film grain, old photo style, ',
  minimalist:   'minimalist design, simple, clean, white space, ',
  landscape:    'landscape photography, scenic, wide angle, breathtaking view, ',
  city:         'cityscape, urban photography, city lights, skyline, ',
  prompt:       '',
};

const LABELS = {
  photo:'📷 Photo', portrait:'🧑 Portrait', anime2:'🌸 Anime', art:'🖌️ Art',
  logo:'🏷️ Logo', wallpaper2:'🖼️ Wallpaper', cartoon:'🎠 Cartoon', realistic:'📸 Realistic',
  fantasy:'🧙 Fantasy', nature:'🌿 Nature', space:'🚀 Space', abstract:'🎭 Abstract',
  architecture:'🏛️ Architecture', food2:'🍽️ Food', animal2:'🦁 Animal', drawing:'✏️ Drawing',
  painting:'🖼️ Painting', sketch:'📝 Sketch', '3d':'💎 3D', neon:'🌈 Neon',
  vintage:'📷 Vintage', minimalist:'⬜ Minimalist', landscape:'🏔️ Landscape', city:'🌆 City', prompt:'✨ Custom',
};

const CMD = 'cartoon';
const stylePrompt = STYLES[CMD] || '';
const label = LABELS[CMD] || '🎨 AI Image';

module.exports = {
  name: CMD,
  category: 'ai',
  description: 'Generate AI ' + label + ' image. Usage: .' + CMD + ' <description>',
  execute: async (sock, msg, args) => {
    const jid   = msg.key.remoteJid;
    const query = args.join(' ').trim();
    if (!query) return sock.sendMessage(jid, {
      text: label + '\n\n📌 *Usage:* .' + CMD + ' <description>\n💡 *Example:* .' + CMD + ' a lion in the jungle',
    });
    await sock.sendMessage(jid, { text: '⏳ _Generating ' + label + ' for *' + query + '*..._' });
    try {
      const full = encodeURIComponent(stylePrompt + query);
      const seed = Math.floor(Math.random() * 99999);
      const url  = 'https://image.pollinations.ai/prompt/' + full + '?width=1024&height=1024&seed=' + seed + '&nologo=true&enhance=true';
      const buf  = await fetchBuffer(url);
      await sock.sendMessage(jid, {
        image: buf,
        caption: label + '\n🎨 *' + query + '*\n\n_Powered by ASTRA-X AI_',
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Image generation failed: ' + e.message });
    }
  },
};

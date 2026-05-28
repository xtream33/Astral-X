'use strict';
const { fetchBuffer } = require('../utils/ytdlp');

const STYLES = {
  imagine:      { prompt: '', label: '🎨 AI Image' },
  photo:        { prompt: 'photorealistic, DSLR photography, high detail, ', label: '📷 Photo' },
  portrait:     { prompt: 'portrait photography, professional, studio lighting, ', label: '🧑 Portrait' },
  anime2:       { prompt: 'anime style, detailed anime art, studio ghibli inspired, ', label: '🌸 Anime' },
  art:          { prompt: 'digital art, concept art, highly detailed, artstation, ', label: '🖌️ Art' },
  logo:         { prompt: 'minimal flat logo design, vector, clean, professional, ', label: '🏷️ Logo' },
  wallpaper2:   { prompt: 'HD wallpaper, 4k, stunning, desktop background, ', label: '🖼️ Wallpaper' },
  cartoon:      { prompt: 'cartoon style, colorful, fun, animated, ', label: '🎠 Cartoon' },
  realistic:    { prompt: 'hyperrealistic, photorealistic, 8k resolution, ultra detailed, ', label: '📸 Realistic' },
  fantasy:      { prompt: 'fantasy art, magical, epic, detailed fantasy world, ', label: '🧙 Fantasy' },
  nature:       { prompt: 'nature photography, beautiful scenery, golden hour, ', label: '🌿 Nature' },
  space:        { prompt: 'space art, galaxy, nebula, cosmic, NASA quality, ', label: '🚀 Space' },
  abstract:     { prompt: 'abstract art, modern, colorful shapes, contemporary art, ', label: '🎭 Abstract' },
  architecture: { prompt: 'architectural photography, building design, modern architecture, ', label: '🏛️ Architecture' },
  food2:        { prompt: 'food photography, delicious, professional lighting, appetizing, ', label: '🍽️ Food' },
  animal2:      { prompt: 'wildlife photography, animal portrait, nature, ', label: '🦁 Animal' },
  drawing:      { prompt: 'pencil drawing, sketch art, detailed line art, ', label: '✏️ Drawing' },
  painting:     { prompt: 'oil painting, classical art style, masterpiece, ', label: '🖼️ Painting' },
  sketch:       { prompt: 'pencil sketch, black and white, detailed sketch, ', label: '📝 Sketch' },
  '3d':         { prompt: '3D render, octane render, cinema 4d, highly detailed 3D, ', label: '💎 3D' },
  neon:         { prompt: 'neon lights, cyberpunk, glowing neon colors, dark background, ', label: '🌈 Neon' },
  vintage:      { prompt: 'vintage style, retro aesthetic, film grain, old photo style, ', label: '📷 Vintage' },
  minimalist:   { prompt: 'minimalist design, simple, clean, white space, ', label: '⬜ Minimalist' },
  landscape:    { prompt: 'landscape photography, scenic, wide angle, breathtaking view, ', label: '🏔️ Landscape' },
  city:         { prompt: 'cityscape, urban photography, city lights, skyline, ', label: '🌆 City' },
  prompt:       { prompt: '', label: '✨ Custom' },
};

async function generateImage(query, stylePrompt) {
  const full = encodeURIComponent(stylePrompt + query);
  const seed = Math.floor(Math.random() * 99999);
  const url  = `https://image.pollinations.ai/prompt/${full}?width=1024&height=1024&seed=${seed}&nologo=true&enhance=true`;
  return fetchBuffer(url);
}

// Export a factory so we can create all style commands from one file
function makeCommand(name) {
  const cfg = STYLES[name];
  return {
    name,
    category: 'ai',
    description: 'Generate AI image. Usage: .' + name + ' <description>',
    execute: async (sock, msg, args) => {
      const jid   = msg.key.remoteJid;
      const query = args.join(' ').trim();
      if (!query) return sock.sendMessage(jid, {
        text: cfg.label + '\n\n📌 *Usage:* .' + name + ' <description>\n💡 *Example:* .' + name + ' a lion in the jungle',
      });
      await sock.sendMessage(jid, { text: '⏳ _Generating ' + cfg.label + ' for *' + query + '*..._' });
      try {
        const buf = await generateImage(query, cfg.prompt);
        await sock.sendMessage(jid, {
          image: buf,
          caption: cfg.label + '\n🎨 *' + query + '*\n\n_Powered by ASTRA-X AI_',
        }, { quoted: msg });
      } catch (e) {
        await sock.sendMessage(jid, { text: '❌ Image generation failed: ' + e.message });
      }
    },
  };
}

module.exports = makeCommand('imagine');

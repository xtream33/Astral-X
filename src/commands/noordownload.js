'use strict';
const { freeDownload, searchAndDownload, detectPlatform } = require('../utils/freedownload');
const { box } = require('../utils/format');

const PLATFORM_EMOJI = {
  youtube: '🎬 YouTube', tiktok: '🎵 TikTok', instagram: '📸 Instagram',
  facebook: '📘 Facebook', twitter: '🐦 Twitter/X', soundcloud: '🎵 SoundCloud',
  unknown: '🌐 Web',
};

module.exports = {
  name: 'noordownload',
  aliases: ['ndl', 'ndown', 'noordown', 'nget', 'noordl'],
  category: 'astra-x-ai',
  description: 'Smart AI-powered download assistant. Usage: .noordownload <url or name> [audio]',
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;
    if (!args.length) return sock.sendMessage(jid, {
      text: box('⬇️ *ASTRA-X DOWNLOAD*',
        '❓ Provide a URL or song name!\n\n📌 *Usage:* .noordownload <url or name> [audio]\n\n🌐 *Supported:*\n🎬 YouTube  🎵 TikTok\n📸 Instagram  📘 Facebook\n🐦 Twitter/X  🌍 Any site!\n\n💡 *Examples:*\n.noordownload https://youtu.be/xxxx\n.noordownload Faded Alan Walker\n.noordownload https://vm.tiktok.com/xxxx\n.noordownload https://youtu.be/xxxx audio'
      ),
    });

    const audioOnly = args[args.length - 1]?.toLowerCase() === 'audio';
    const input     = audioOnly ? args.slice(0, -1).join(' ') : args.join(' ');
    const isUrl     = input.startsWith('http');
    const platform  = isUrl ? PLATFORM_EMOJI[detectPlatform(input)] || '🌐 Web' : '🔍 Search';

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ ⬇️ *ᴀsᴛʀᴀ-x ᴅᴏᴡɴʟᴏᴀᴅ*\n┠─────────────────────\n┃ ' + platform + '\n┃ _' + (audioOnly ? '🎵 Audio mode' : '🎬 Video mode') + '_\n┃ _Processing..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    if (isUrl) {
      await freeDownload(sock, jid, input, { audioOnly, quotedMsg: msg });
    } else {
      await searchAndDownload(sock, jid, input, audioOnly, msg);
    }
  },
};

'use strict';
const { httpGet, parseJSON } = require('../utils/apkfetch');
const { box } = require('../utils/format');

const CATEGORIES = {
  all:       { label: 'Top Charts',        url: 'https://play.google.com/store/apps/top?hl=en' },
  games:     { label: 'Top Games',         url: 'https://play.google.com/store/apps/category/GAME/collection/topselling_free?hl=en' },
  tools:     { label: 'Top Tools',         url: 'https://play.google.com/store/apps/category/TOOLS/collection/topselling_free?hl=en' },
  social:    { label: 'Top Social',        url: 'https://play.google.com/store/apps/category/SOCIAL/collection/topselling_free?hl=en' },
  education: { label: 'Top Education',     url: 'https://play.google.com/store/apps/category/EDUCATION/collection/topselling_free?hl=en' },
  music:     { label: 'Top Music & Audio', url: 'https://play.google.com/store/apps/category/MUSIC_AND_AUDIO/collection/topselling_free?hl=en' },
};

// Use a curated static list as reliable fallback (Play Store scraping is fragile)
const TOP_APPS = {
  all: [
    { name: 'WhatsApp Messenger', pkg: 'com.whatsapp' },
    { name: 'TikTok', pkg: 'com.zhiliaoapp.musically' },
    { name: 'Instagram', pkg: 'com.instagram.android' },
    { name: 'Facebook', pkg: 'com.facebook.katana' },
    { name: 'YouTube', pkg: 'com.google.android.youtube' },
    { name: 'Telegram', pkg: 'org.telegram.messenger' },
    { name: 'Snapchat', pkg: 'com.snapchat.android' },
    { name: 'Netflix', pkg: 'com.netflix.mediaclient' },
    { name: 'Spotify', pkg: 'com.spotify.music' },
    { name: 'Capcut', pkg: 'com.lemon.lvorak' },
  ],
  games: [
    { name: 'Roblox', pkg: 'com.roblox.client' },
    { name: 'Subway Surfers', pkg: 'com.kiloo.subwaysurf' },
    { name: 'Clash of Clans', pkg: 'com.supercell.clashofclans' },
    { name: 'PUBG Mobile', pkg: 'com.tencent.ig' },
    { name: 'Free Fire', pkg: 'com.dts.freefireth' },
    { name: 'Candy Crush Saga', pkg: 'com.king.candycrushsaga' },
    { name: 'Minecraft', pkg: 'com.mojang.minecraftpe' },
    { name: 'Among Us', pkg: 'com.innersloth.spacemafia' },
    { name: 'Call of Duty Mobile', pkg: 'com.activision.callofduty.shooter' },
    { name: 'Stumble Guys', pkg: 'com.scopely.stumbleguys' },
  ],
  social: [
    { name: 'WhatsApp', pkg: 'com.whatsapp' },
    { name: 'Instagram', pkg: 'com.instagram.android' },
    { name: 'TikTok', pkg: 'com.zhiliaoapp.musically' },
    { name: 'Facebook', pkg: 'com.facebook.katana' },
    { name: 'Telegram', pkg: 'org.telegram.messenger' },
    { name: 'Snapchat', pkg: 'com.snapchat.android' },
    { name: 'Twitter / X', pkg: 'com.twitter.android' },
    { name: 'LinkedIn', pkg: 'com.linkedin.android' },
    { name: 'Discord', pkg: 'com.discord' },
    { name: 'Pinterest', pkg: 'com.pinterest' },
  ],
  music: [
    { name: 'Spotify', pkg: 'com.spotify.music' },
    { name: 'YouTube Music', pkg: 'com.google.android.apps.youtube.music' },
    { name: 'SoundCloud', pkg: 'com.soundcloud.android' },
    { name: 'Audiomack', pkg: 'com.audiomack' },
    { name: 'Shazam', pkg: 'com.shazam.android' },
    { name: 'Boomplay', pkg: 'com.boomplay.boomplay' },
    { name: 'Apple Music', pkg: 'com.apple.android.music' },
    { name: 'Deezer', pkg: 'deezer.android.app' },
    { name: 'Tidal', pkg: 'com.aspiro.tidal' },
    { name: 'Anghami', pkg: 'com.anghami' },
  ],
};

module.exports = {
  name: 'apktop',
  aliases: ['topapps', 'trendingapk', 'popularapk', 'topgames'],
  category: 'apk-download',
  description: 'Show top/trending apps by category. Usage: .apktop [category]',
  execute: async (sock, msg, args) => {
    const jid      = msg.key.remoteJid;
    const cat      = (args[0] || 'all').toLowerCase();
    const list     = TOP_APPS[cat] || TOP_APPS.all;
    const catLabel = CATEGORIES[cat]?.label || 'Top Charts';

    if (args[0] && !TOP_APPS[cat]) {
      return sock.sendMessage(jid, {
        text: box('🏆 *TOP APPS*',
          '❓ Unknown category!\n\n📌 *Usage:* .apktop [category]\n\n📂 *Available categories:*\n.apktop all\n.apktop games\n.apktop social\n.apktop music\n.apktop tools\n.apktop education'
        ),
      });
    }

    let body = '📂 *' + catLabel + '*\n━━━━━━━━━━━━━━\n\n';
    list.forEach((app, i) => {
      body += (i + 1) + '. 📱 *' + app.name + '*\n   _' + app.pkg + '_\n';
    });
    body += '\n💡 *Download any:* .apk <app name>';

    await sock.sendMessage(jid, { text: box('🏆 *TOP APPS*', body) }, { quoted: msg });
  },
};

'use strict';
const fs       = require('fs');
const path     = require('path');
const settings = require('../utils/settings');

const LOGO_PATHS = [
  path.join(__dirname, '../../public/Astralogo.png'),
  path.join(__dirname, '../../public/logo.png'),
  path.join(__dirname, '../../logo.png'),
];
const LOGO = LOGO_PATHS.find(p => fs.existsSync(p)) || null;

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'start', 'cmds'],
  category: 'info',
  description: 'Show the ASTRA-X bot menu',
  execute: async (sock, msg, args, userId, ctx = {}) => {
    const jid = msg.key.remoteJid;

    await sock.sendMessage(jid, {
      text:
        '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n' +
        '┏━━━━━━━━━━━━━━━━━━━▣\n' +
        '┃ 📋 *ᴀsᴛʀᴀ-x ᴀɪ ᴍᴇɴᴜ*\n' +
        '┠─────────────────────\n' +
        '┃ ⏳ _Loading menu..._\n' +
        '┗━━━━━━━━━━━━━━━━━━━▣',
    });

    const p    = ctx.prefix || process.env.BOT_PREFIX || '!';
    const up   = process.uptime();
    const h    = Math.floor(up / 3600);
    const m    = Math.floor((up % 3600) / 60);
    const s    = Math.floor(up % 60);
    const mem  = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const ram  = Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100);
    const bar  = '▣'.repeat(Math.round(ram / 20)) + '□'.repeat(5 - Math.round(ram / 20));
    const who  = msg.pushName || 'Friend';
    const date = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    const mode = settings.get('owneronly:' + userId) ? '🔴 PRIVATE' : '🟢 PUBLIC';

    const caption =
      '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ v6.6.6 ✧ 〕\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '  Welcome, *' + who + '!* 👋\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '  ➤ *Prefix:* [ ' + p + ' ]\n' +
      '  ➤ *Version:* v6.6.6\n' +
      '  ➤ *Uptime:* ' + h + 'h ' + m + 'm ' + s + 's\n' +
      '  ➤ *RAM:* ' + bar + ' ' + ram + '% (' + mem + 'MB)\n' +
      '  ➤ *Date:* ' + date + '\n' +
      '  ➤ *Mode:* ' + mode + '\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🛡️ *MODE SETTINGS*\n' +
      '┃ ' + p + 'mode public\n' +
      '┃ ' + p + 'mode private\n' +
      '┃ ' + p + 'owneronly\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ ℹ️ *INFO & UTILITY*\n' +
      '┃ ' + p + 'alive\n' +
      '┃ ' + p + 'ping\n' +
      '┃   » speed, latency, pong\n' +
      '┃ ' + p + 'stats\n' +
      '┃ ' + p + 'botinfo\n' +
      '┃   » bot, botstatus, sysinfo\n' +
      '┃ ' + p + 'ram\n' +
      '┃ ' + p + 'owner\n' +
      '┃ ' + p + 'time\n' +
      '┃ ' + p + 'weather\n' +
      '┃   » w, forecast, temp, climate\n' +
      '┃ ' + p + 'calc\n' +
      '┃   » calculator, compute, evaluate\n' +
      '┃ ' + p + 'ip\n' +
      '┃   » ipinfo, iplookup, geoip\n' +
      '┃ ' + p + 'id\n' +
      '┃ ' + p + 'wiki\n' +
      '┃   » wikipedia, search, lookup\n' +
      '┃ ' + p + 'define\n' +
      '┃   » dict, dictionary, whatis\n' +
      '┃ ' + p + 'shorten\n' +
      '┃   » short, tiny, tinyurl\n' +
      '┃ ' + p + 'tinyurl\n' +
      '┃ ' + p + 'urlexpand\n' +
      '┃ ' + p + 'whois\n' +
      '┃ ' + p + 'qr\n' +
      '┃ ' + p + 'base64\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 👁️ *VIEWONCE*\n' +
      '┃ ' + p + 'vv — unlock (reply)\n' +
      '┃ ' + p + 'vvdm — unlock → your DM\n' +
      '┃ ' + p + 'viewonce on/off\n' +
      '┃ ' + p + 'novv on/off\n' +
      '┃ 💡 _React to viewonce → get in DM_\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎵 *MEDIA & DOWNLOADS*\n' +
      '┃ ' + p + 'dl\n' +
      '┃   » down, get, fetch, grab\n' +
      '┃ ' + p + 'song\n' +
      '┃   » music, sing, track, beat, sc\n' +
      '┃ ' + p + 'play\n' +
      '┃   » video, watch, ytsearch, stream\n' +
      '┃ ' + p + 'ytmp3\n' +
      '┃   » yta, youtubemp3, ytaudio\n' +
      '┃ ' + p + 'ytmp4\n' +
      '┃   » ytv, youtubemp4, ytdown\n' +
      '┃ ' + p + 'tiktok\n' +
      '┃   » tt, tok, tikdown, tiktokdl\n' +
      '┃ ' + p + 'instagram\n' +
      '┃   » ig, insta, reel, igdl\n' +
      '┃ ' + p + 'facebook\n' +
      '┃   » fb, fbvid, fbdown, fbreels\n' +
      '┃ ' + p + 'twitter\n' +
      '┃   » tw, xvideo, tweet, xdown\n' +
      '┃ ' + p + 'sticker\n' +
      '┃   » s, stik\n' +
      '┃ ' + p + 'lyrics\n' +
      '┃   » lyric, lyr\n' +
      '┃ ' + p + 'shazam\n' +
      '┃   » identify, whatsong, recognize\n' +
      '┃ ' + p + 'gif\n' +
      '┃   » giphy, gifs, anime\n' +
      '┃ ' + p + 'wallpaper\n' +
      '┃   » wall, wp, bg, background\n' +
      '┃ ' + p + 'tts\n' +
      '┃   » speak, voice, say\n' +
      '┃ ' + p + 'tomp3\n' +
      '┃ ' + p + 'ocr\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🔒 *PRIVACY*\n' +
      '┃ ' + p + 'privacy\n' +
      '┃ ' + p + 'ghost\n' +
      '┃ ' + p + 'incognito\n' +
      '┃ ' + p + 'paranoid\n' +
      '┃ ' + p + 'silentmode\n' +
      '┃ ' + p + 'lastseen\n' +
      '┃ ' + p + 'online\n' +
      '┃ ' + p + 'readreceipts\n' +
      '┃ ' + p + 'profileprivacy\n' +
      '┃ ' + p + 'statusview\n' +
      '┃ ' + p + 'groupsprivacy\n' +
      '┃ ' + p + 'pp\n' +
      '┃ ' + p + 'noforward\n' +
      '┃ ' + p + 'nosave\n' +
      '┃ ' + p + 'antitrace\n' +
      '┃ ' + p + 'covertrack\n' +
      '┃ ' + p + 'hideonline\n' +
      '┃ ' + p + 'blockuser\n' +
      '┃ ' + p + 'myblacklist\n' +
      '┃ ' + p + 'disappear\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🛡️ *ANTI & PROTECTION*\n' +
      '┃ ' + p + 'antilink\n' +
      '┃   » nolinks, linkfilter\n' +
      '┃ ' + p + 'antibadword\n' +
      '┃   » nobadword, wordfilter\n' +
      '┃ ' + p + 'antispam\n' +
      '┃   » nospam, stopspam\n' +
      '┃ ' + p + 'antiflood\n' +
      '┃   » floodcontrol, ratelimit\n' +
      '┃ ' + p + 'antifake\n' +
      '┃ ' + p + 'antibot\n' +
      '┃ ' + p + 'antidelete\n' +
      '┃   » ad, antirevoke\n' +
      '┃ ' + p + 'blacklist\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 👥 *GROUP MANAGEMENT*\n' +
      '┃ ' + p + 'welcome\n' +
      '┃ ' + p + 'goodbye\n' +
      '┃ ' + p + 'mute\n' +
      '┃   » mutegroup, silence, closegroup\n' +
      '┃ ' + p + 'unmute\n' +
      '┃   » unmutegroup, opengroup\n' +
      '┃ ' + p + 'lock\n' +
      '┃   » lockgroup, lockinfo\n' +
      '┃ ' + p + 'unlock\n' +
      '┃   » unlockgroup, unlockinfo\n' +
      '┃ ' + p + 'everyone\n' +
      '┃   » tagall, mentionall, all\n' +
      '┃ ' + p + 'hidetag\n' +
      '┃   » ht, hiddentag, silentping\n' +
      '┃ ' + p + 'promote\n' +
      '┃   » makeadmin, admin\n' +
      '┃ ' + p + 'demote\n' +
      '┃   » removeadmin, unadmin\n' +
      '┃ ' + p + 'kick\n' +
      '┃   » remove, kickmember\n' +
      '┃ ' + p + 'add\n' +
      '┃   » addmember, adduser, invite\n' +
      '┃ ' + p + 'warn\n' +
      '┃   » warning, strike\n' +
      '┃ ' + p + 'clearwarn\n' +
      '┃   » resetwarn, clearwarns\n' +
      '┃ ' + p + 'rules\n' +
      '┃   » grouprules, showrules\n' +
      '┃ ' + p + 'announce\n' +
      '┃   » pin, groupannounce\n' +
      '┃ ' + p + 'poll\n' +
      '┃ ' + p + 'listmembers\n' +
      '┃ ' + p + 'listadmins\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ ⚙️ *BOT SETTINGS*\n' +
      '┃ ' + p + 'setprefix\n' +
      '┃ ' + p + 'maintenance\n' +
      '┃ ' + p + 'autoread\n' +
      '┃ ' + p + 'autoreact\n' +
      '┃ ' + p + 'autotyping\n' +
      '┃ ' + p + 'autorecording\n' +
      '┃ ' + p + 'autoviewstatus\n' +
      '┃ ' + p + 'autolikestatus\n' +
      '┃ ' + p + 'afk\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🤖 *GEMINI AI*\n' +
      '┃ ' + p + 'ai\n' +
      '┃   » ask, chat, gpt, gemini\n' +
      '┃ ' + p + 'describe\n' +
      '┃   » analyze, vision, see, caption\n' +
      '┃ ' + p + 'improve\n' +
      '┃ ' + p + 'summarize\n' +
      '┃ ' + p + 'grammar\n' +
      '┃ ' + p + 'formal\n' +
      '┃ ' + p + 'casual\n' +
      '┃ ' + p + 'translate\n' +
      '┃ ' + p + 'write\n' +
      '┃ ' + p + 'poem\n' +
      '┃ ' + p + 'story\n' +
      '┃ ' + p + 'code\n' +
      '┃ ' + p + 'recipe\n' +
      '┃ ' + p + 'advice\n' +
      '┃ ' + p + 'roastai\n' +
      '┃ ' + p + 'factcheck\n' +
      '┃ ' + p + 'compare\n' +
      '┃ ' + p + 'email\n' +
      '┃ ' + p + 'diet\n' +
      '┃ ' + p + 'deepseek\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🛠️ *UTILITY*\n' +
      '┃ ' + p + 'movie\n' +
      '┃   » film, series, imdb, show\n' +
      '┃ ' + p + 'currency\n' +
      '┃   » convert, exchange, fx, rate\n' +
      '┃ ' + p + 'news\n' +
      '┃   » headline, headlines, trending\n' +
      '┃ ' + p + 'bible\n' +
      '┃   » verse, bibleverse, scripture\n' +
      '┃ ' + p + 'quran\n' +
      '┃   » ayah, surah, islamic\n' +
      '┃ ' + p + 'age\n' +
      '┃   » birthday, howold, dob\n' +
      '┃ ' + p + 'bmi\n' +
      '┃   » bodyweight, weightcheck\n' +
      '┃ ' + p + 'tempmail\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎲 *FUN & GAMES*\n' +
      '┃ ' + p + 'dice\n' +
      '┃   » roll, rolldice, d6\n' +
      '┃ ' + p + 'toss\n' +
      '┃   » cointoss, coinflip2\n' +
      '┃ ' + p + '8ball\n' +
      '┃ ' + p + 'joke\n' +
      '┃   » funny, lol, haha\n' +
      '┃ ' + p + 'roast\n' +
      '┃   » burn, savage, diss, insult\n' +
      '┃ ' + p + 'compliment\n' +
      '┃ ' + p + 'rizz\n' +
      '┃ ' + p + 'truth\n' +
      '┃   » truthquestion, truthtime\n' +
      '┃ ' + p + 'dare\n' +
      '┃ ' + p + 'trivia\n' +
      '┃   » quiz2, qna, triviatime\n' +
      '┃ ' + p + 'ship\n' +
      '┃ ' + p + 'hack\n' +
      '┃ ' + p + 'fortune\n' +
      '┃ ' + p + 'riddle\n' +
      '┃   » puzzle, brainteaser, guess\n' +
      '┃ ' + p + 'wordgame\n' +
      '┃   » wg\n' +
      '┃ ' + p + 'meme\n' +
      '┃ ' + p + 'fact\n' +
      '┃   » facts, randomfact, funfact\n' +
      '┃ ' + p + 'quote\n' +
      '┃   » quotes, inspire, motivation\n' +
      '┃ ' + p + 'howgay\n' +
      '┃ ' + p + 'howrich\n' +
      '┃   » rich, wealth, networth\n' +
      '┃ ' + p + 'howsmart\n' +
      '┃   » iq, smart, genius, brain\n' +
      '┃ ' + p + 'rps\n' +
      '┃   » rockpaperscissors\n' +
      '┃ ' + p + 'fight\n' +
      '┃ ' + p + 'wyr\n' +
      '┃   » wouldyourather\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎨 *AI IMAGE GENERATION*\n' +
      '┃ ' + p + 'imagine\n' +
      '┃ ' + p + 'photo\n' +
      '┃ ' + p + 'portrait\n' +
      '┃ ' + p + 'anime2\n' +
      '┃ ' + p + 'art\n' +
      '┃ ' + p + 'logo\n' +
      '┃ ' + p + 'wallpaper2\n' +
      '┃ ' + p + 'cartoon\n' +
      '┃ ' + p + 'realistic\n' +
      '┃ ' + p + 'fantasy\n' +
      '┃ ' + p + 'nature\n' +
      '┃ ' + p + 'space\n' +
      '┃ ' + p + 'abstract\n' +
      '┃ ' + p + 'architecture\n' +
      '┃ ' + p + 'food2\n' +
      '┃ ' + p + 'animal2\n' +
      '┃ ' + p + 'drawing\n' +
      '┃ ' + p + 'painting\n' +
      '┃ ' + p + 'sketch\n' +
      '┃ ' + p + '3d\n' +
      '┃ ' + p + 'neon\n' +
      '┃ ' + p + 'vintage\n' +
      '┃ ' + p + 'minimalist\n' +
      '┃ ' + p + 'landscape\n' +
      '┃ ' + p + 'city\n' +
      '┃ ' + p + 'prompt\n' +
      '┃ ' + p + 'gold\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🖼️ *MEDIA TOOLS*\n' +
      '┃ ' + p + 'toimg\n' +
      '┃ ' + p + 'removebg\n' +
      '┃ ' + p + 'screenshot\n' +
      '┃ ' + p + 'tomp3\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🌟 *ASTRA-X AI*\n' +
      '┃ ' + p + 'noorai — ask AI anything\n' +
      '┃   » nai, nask, noorask, noorbot\n' +
      '┃ ' + p + 'noorsearch — web search\n' +
      '┃   » nsearch, nweb, websearch\n' +
      '┃ ' + p + 'noorexplain — explain any topic\n' +
      '┃   » nexplain, ninfo, nwiki\n' +
      '┃ ' + p + 'noorstory — generate a story\n' +
      '┃   » nstory, ntale, noorwrite\n' +
      '┃ ' + p + 'noormath — solve math\n' +
      '┃   » nmath, nsolve, ncalc\n' +
      '┃ ' + p + 'noorphoto — AI image\n' +
      '┃   » nphoto, nimage, npic\n' +
      '┃ ' + p + 'noordownload — smart dl\n' +
      '┃   » ndl, ndown, nget\n' +
      '┃ ' + p + 'noortranslate — translate\n' +
      '┃   » ntranslate, ntrans\n' +
      '┃ ' + p + 'noorquiz — AI quiz\n' +
      '┃   » nquiz, nq, noortrivia\n' +
      '┃ ' + p + 'noornews — latest headlines\n' +
      '┃   » nnews, nheadlines\n' +
      '┃ 💡 _All powered by free services_\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 📦 *APK DOWNLOAD*\n' +
      '┃ ' + p + 'apk — download APK\n' +
      '┃   » app, apkdown, getapk\n' +
      '┃ ' + p + 'apksearch — search app info\n' +
      '┃   » findapk, appfind, apkfind\n' +
      '┃ ' + p + 'apkinfo — full app details\n' +
      '┃   » appinfo, apkdetails, playinfo\n' +
      '┃ ' + p + 'apklink — 5 download links\n' +
      '┃   » apkurl, applink, getlink\n' +
      '┃ ' + p + 'apkfree — open-source apps\n' +
      '┃   » fdroid, opensource, freeapp\n' +
      '┃ ' + p + 'apkmod — modded APK sources\n' +
      '┃   » modapk, apkpremium, modapp\n' +
      '┃ ' + p + 'apkcheck — safety scan\n' +
      '┃   » appcheck, apksafe, apkscan\n' +
      '┃ ' + p + 'apkupdate — latest version\n' +
      '┃   » appupdate, latestapk\n' +
      '┃ ' + p + 'apktop — top trending apps\n' +
      '┃   » topapps, topgames\n' +
      '┃ 💡 _All free, no API key needed_\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ ⚽ *SPORTS*\n' +
      '┃ ' + p + 'livescores\n' +
      '┃ ' + p + 'epltable\n' +
      '┃ ' + p + 'ucltable\n' +
      '┃ ' + p + 'laligatable\n' +
      '┃ ' + p + 'seriatable\n' +
      '┃ ' + p + 'bundesligatable\n' +
      '┃ ' + p + 'ligue1table\n' +
      '┃ ' + p + 'topscorers\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 📊 *BOT STATS*\n' +
      '┃ ' + p + 'botinfo\n' +
      '┃   » bot, botstatus, sysinfo\n' +
      '┃ ' + p + 'ram\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +

      '🌐 *Channel:* https://whatsapp.com/channel/0029Vb8BaxaBFLgMYofBAC3I\n\n' +
      '〔 ✧ *ᴀsᴛʀᴀ-x ᴛᴇᴄʜ v6.6.6* ✧ 〕\n' +
      '_© 2026 ASTRA-X • Always Online 🌍_\n' +
      '_Developed by Xtream Noor ❤️ for you!_';

    try {
      if (LOGO && fs.existsSync(LOGO)) {
        await sock.sendMessage(jid, { image: fs.readFileSync(LOGO), caption });
      } else {
        await sock.sendMessage(jid, { text: caption });
      }
    } catch (_) {
      await sock.sendMessage(jid, { text: caption });
    }
  },
};

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
      '┃ ' + p + 'mode\n' +
      '┃ ' + p + 'owneronly\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ ℹ️ *INFO & UTILITY*\n' +
      '┃ ' + p + 'alive\n' +
      '┃ ' + p + 'ping\n' +
      '┃ ' + p + 'speed\n' +
      '┃ ' + p + 'latency\n' +
      '┃ ' + p + 'pong\n' +
      '┃ ' + p + 'stats\n' +
      '┃ ' + p + 'botinfo\n' +
      '┃ ' + p + 'bot\n' +
      '┃ ' + p + 'botstatus\n' +
      '┃ ' + p + 'sysinfo\n' +
      '┃ ' + p + 'ram\n' +
      '┃ ' + p + 'owner\n' +
      '┃ ' + p + 'time\n' +
      '┃ ' + p + 'weather\n' +
      '┃ ' + p + 'w\n' +
      '┃ ' + p + 'forecast\n' +
      '┃ ' + p + 'temp\n' +
      '┃ ' + p + 'climate\n' +
      '┃ ' + p + 'calc\n' +
      '┃ ' + p + 'calculator\n' +
      '┃ ' + p + 'compute\n' +
      '┃ ' + p + 'evaluate\n' +
      '┃ ' + p + 'ip\n' +
      '┃ ' + p + 'ipinfo\n' +
      '┃ ' + p + 'iplookup\n' +
      '┃ ' + p + 'geoip\n' +
      '┃ ' + p + 'id\n' +
      '┃ ' + p + 'wiki\n' +
      '┃ ' + p + 'wikipedia\n' +
      '┃ ' + p + 'search\n' +
      '┃ ' + p + 'lookup\n' +
      '┃ ' + p + 'define\n' +
      '┃ ' + p + 'dict\n' +
      '┃ ' + p + 'dictionary\n' +
      '┃ ' + p + 'whatis\n' +
      '┃ ' + p + 'shorten\n' +
      '┃ ' + p + 'short\n' +
      '┃ ' + p + 'tiny\n' +
      '┃ ' + p + 'tinyurl\n' +
      '┃ ' + p + 'qr\n' +
      '┃ ' + p + 'base64\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 👁️ *VIEWONCE*\n' +
      '┃ ' + p + 'vv\n' +
      '┃ ' + p + 'vvdm\n' +
      '┃ ' + p + 'viewonce\n' +
      '┃ ' + p + 'novv\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎵 *MEDIA & DOWNLOADS*\n' +
      '┃ ' + p + 'dl\n' +
      '┃ ' + p + 'down\n' +
      '┃ ' + p + 'get\n' +
      '┃ ' + p + 'fetch\n' +
      '┃ ' + p + 'grab\n' +
      '┃ ' + p + 'song\n' +
      '┃ ' + p + 'music\n' +
      '┃ ' + p + 'sing\n' +
      '┃ ' + p + 'track\n' +
      '┃ ' + p + 'beat\n' +
      '┃ ' + p + 'play\n' +
      '┃ ' + p + 'video\n' +
      '┃ ' + p + 'watch\n' +
      '┃ ' + p + 'ytsearch\n' +
      '┃ ' + p + 'stream\n' +
      '┃ ' + p + 'ytmp3\n' +
      '┃ ' + p + 'yta\n' +
      '┃ ' + p + 'youtubemp3\n' +
      '┃ ' + p + 'ytaudio\n' +
      '┃ ' + p + 'ytmp4\n' +
      '┃ ' + p + 'ytv\n' +
      '┃ ' + p + 'youtubemp4\n' +
      '┃ ' + p + 'ytdown\n' +
      '┃ ' + p + 'tiktok\n' +
      '┃ ' + p + 'tt\n' +
      '┃ ' + p + 'tok\n' +
      '┃ ' + p + 'tikdown\n' +
      '┃ ' + p + 'tiktokdl\n' +
      '┃ ' + p + 'instagram\n' +
      '┃ ' + p + 'ig\n' +
      '┃ ' + p + 'insta\n' +
      '┃ ' + p + 'reel\n' +
      '┃ ' + p + 'igdl\n' +
      '┃ ' + p + 'facebook\n' +
      '┃ ' + p + 'fb\n' +
      '┃ ' + p + 'fbvid\n' +
      '┃ ' + p + 'fbdown\n' +
      '┃ ' + p + 'fbreels\n' +
      '┃ ' + p + 'twitter\n' +
      '┃ ' + p + 'tw\n' +
      '┃ ' + p + 'xvideo\n' +
      '┃ ' + p + 'tweet\n' +
      '┃ ' + p + 'xdown\n' +
      '┃ ' + p + 'sticker\n' +
      '┃ ' + p + 's\n' +
      '┃ ' + p + 'stik\n' +
      '┃ ' + p + 'lyrics\n' +
      '┃ ' + p + 'lyric\n' +
      '┃ ' + p + 'lyr\n' +
      '┃ ' + p + 'shazam\n' +
      '┃ ' + p + 'identify\n' +
      '┃ ' + p + 'whatsong\n' +
      '┃ ' + p + 'recognize\n' +
      '┃ ' + p + 'gif\n' +
      '┃ ' + p + 'giphy\n' +
      '┃ ' + p + 'gifs\n' +
      '┃ ' + p + 'wallpaper\n' +
      '┃ ' + p + 'wall\n' +
      '┃ ' + p + 'wp\n' +
      '┃ ' + p + 'bg\n' +
      '┃ ' + p + 'background\n' +
      '┃ ' + p + 'tts\n' +
      '┃ ' + p + 'speak\n' +
      '┃ ' + p + 'voice\n' +
      '┃ ' + p + 'say\n' +
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
      '┃ ' + p + 'nolinks\n' +
      '┃ ' + p + 'linkfilter\n' +
      '┃ ' + p + 'antibadword\n' +
      '┃ ' + p + 'nobadword\n' +
      '┃ ' + p + 'wordfilter\n' +
      '┃ ' + p + 'antispam\n' +
      '┃ ' + p + 'nospam\n' +
      '┃ ' + p + 'stopspam\n' +
      '┃ ' + p + 'antiflood\n' +
      '┃ ' + p + 'floodcontrol\n' +
      '┃ ' + p + 'ratelimit\n' +
      '┃ ' + p + 'antifake\n' +
      '┃ ' + p + 'antibot\n' +
      '┃ ' + p + 'antidelete\n' +
      '┃ ' + p + 'ad\n' +
      '┃ ' + p + 'antirevoke\n' +
      '┃ ' + p + 'blacklist\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 👥 *GROUP MANAGEMENT*\n' +
      '┃ ' + p + 'welcome\n' +
      '┃ ' + p + 'goodbye\n' +
      '┃ ' + p + 'mute\n' +
      '┃ ' + p + 'mutegroup\n' +
      '┃ ' + p + 'silence\n' +
      '┃ ' + p + 'closegroup\n' +
      '┃ ' + p + 'unmute\n' +
      '┃ ' + p + 'unmutegroup\n' +
      '┃ ' + p + 'opengroup\n' +
      '┃ ' + p + 'lock\n' +
      '┃ ' + p + 'lockgroup\n' +
      '┃ ' + p + 'lockinfo\n' +
      '┃ ' + p + 'unlock\n' +
      '┃ ' + p + 'unlockgroup\n' +
      '┃ ' + p + 'everyone\n' +
      '┃ ' + p + 'tagall\n' +
      '┃ ' + p + 'mentionall\n' +
      '┃ ' + p + 'all\n' +
      '┃ ' + p + 'hidetag\n' +
      '┃ ' + p + 'ht\n' +
      '┃ ' + p + 'hiddentag\n' +
      '┃ ' + p + 'silentping\n' +
      '┃ ' + p + 'promote\n' +
      '┃ ' + p + 'makeadmin\n' +
      '┃ ' + p + 'admin\n' +
      '┃ ' + p + 'demote\n' +
      '┃ ' + p + 'removeadmin\n' +
      '┃ ' + p + 'unadmin\n' +
      '┃ ' + p + 'kick\n' +
      '┃ ' + p + 'remove\n' +
      '┃ ' + p + 'kickmember\n' +
      '┃ ' + p + 'add\n' +
      '┃ ' + p + 'addmember\n' +
      '┃ ' + p + 'adduser\n' +
      '┃ ' + p + 'invite\n' +
      '┃ ' + p + 'warn\n' +
      '┃ ' + p + 'warning\n' +
      '┃ ' + p + 'strike\n' +
      '┃ ' + p + 'clearwarn\n' +
      '┃ ' + p + 'resetwarn\n' +
      '┃ ' + p + 'clearwarns\n' +
      '┃ ' + p + 'rules\n' +
      '┃ ' + p + 'grouprules\n' +
      '┃ ' + p + 'showrules\n' +
      '┃ ' + p + 'announce\n' +
      '┃ ' + p + 'pin\n' +
      '┃ ' + p + 'groupannounce\n' +
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
      '┃ ' + p + 'ask\n' +
      '┃ ' + p + 'chat\n' +
      '┃ ' + p + 'gpt\n' +
      '┃ ' + p + 'gemini\n' +
      '┃ ' + p + 'describe\n' +
      '┃ ' + p + 'analyze\n' +
      '┃ ' + p + 'vision\n' +
      '┃ ' + p + 'see\n' +
      '┃ ' + p + 'caption\n' +
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
      '┃ ' + p + 'film\n' +
      '┃ ' + p + 'series\n' +
      '┃ ' + p + 'imdb\n' +
      '┃ ' + p + 'show\n' +
      '┃ ' + p + 'currency\n' +
      '┃ ' + p + 'convert\n' +
      '┃ ' + p + 'exchange\n' +
      '┃ ' + p + 'fx\n' +
      '┃ ' + p + 'rate\n' +
      '┃ ' + p + 'news\n' +
      '┃ ' + p + 'headline\n' +
      '┃ ' + p + 'headlines\n' +
      '┃ ' + p + 'trending\n' +
      '┃ ' + p + 'bible\n' +
      '┃ ' + p + 'verse\n' +
      '┃ ' + p + 'bibleverse\n' +
      '┃ ' + p + 'scripture\n' +
      '┃ ' + p + 'quran\n' +
      '┃ ' + p + 'ayah\n' +
      '┃ ' + p + 'surah\n' +
      '┃ ' + p + 'islamic\n' +
      '┃ ' + p + 'age\n' +
      '┃ ' + p + 'birthday\n' +
      '┃ ' + p + 'howold\n' +
      '┃ ' + p + 'dob\n' +
      '┃ ' + p + 'bmi\n' +
      '┃ ' + p + 'bodyweight\n' +
      '┃ ' + p + 'weightcheck\n' +
      '┃ ' + p + 'tempmail\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎲 *FUN & GAMES*\n' +
      '┃ ' + p + 'dice\n' +
      '┃ ' + p + 'roll\n' +
      '┃ ' + p + 'rolldice\n' +
      '┃ ' + p + 'd6\n' +
      '┃ ' + p + 'toss\n' +
      '┃ ' + p + 'cointoss\n' +
      '┃ ' + p + 'coinflip2\n' +
      '┃ ' + p + '8ball\n' +
      '┃ ' + p + 'joke\n' +
      '┃ ' + p + 'funny\n' +
      '┃ ' + p + 'lol\n' +
      '┃ ' + p + 'haha\n' +
      '┃ ' + p + 'roast\n' +
      '┃ ' + p + 'burn\n' +
      '┃ ' + p + 'savage\n' +
      '┃ ' + p + 'diss\n' +
      '┃ ' + p + 'insult\n' +
      '┃ ' + p + 'compliment\n' +
      '┃ ' + p + 'rizz\n' +
      '┃ ' + p + 'truth\n' +
      '┃ ' + p + 'truthquestion\n' +
      '┃ ' + p + 'dare\n' +
      '┃ ' + p + 'trivia\n' +
      '┃ ' + p + 'quiz2\n' +
      '┃ ' + p + 'qna\n' +
      '┃ ' + p + 'triviatime\n' +
      '┃ ' + p + 'ship\n' +
      '┃ ' + p + 'hack\n' +
      '┃ ' + p + 'fortune\n' +
      '┃ ' + p + 'riddle\n' +
      '┃ ' + p + 'puzzle\n' +
      '┃ ' + p + 'brainteaser\n' +
      '┃ ' + p + 'guess\n' +
      '┃ ' + p + 'wordgame\n' +
      '┃ ' + p + 'wg\n' +
      '┃ ' + p + 'meme\n' +
      '┃ ' + p + 'fact\n' +
      '┃ ' + p + 'facts\n' +
      '┃ ' + p + 'randomfact\n' +
      '┃ ' + p + 'funfact\n' +
      '┃ ' + p + 'quote\n' +
      '┃ ' + p + 'quotes\n' +
      '┃ ' + p + 'inspire\n' +
      '┃ ' + p + 'motivation\n' +
      '┃ ' + p + 'howgay\n' +
      '┃ ' + p + 'howrich\n' +
      '┃ ' + p + 'rich\n' +
      '┃ ' + p + 'wealth\n' +
      '┃ ' + p + 'networth\n' +
      '┃ ' + p + 'howsmart\n' +
      '┃ ' + p + 'iq\n' +
      '┃ ' + p + 'smart\n' +
      '┃ ' + p + 'genius\n' +
      '┃ ' + p + 'brain\n' +
      '┃ ' + p + 'rps\n' +
      '┃ ' + p + 'rockpaperscissors\n' +
      '┃ ' + p + 'fight\n' +
      '┃ ' + p + 'wyr\n' +
      '┃ ' + p + 'wouldyourather\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🎨 *AI IMAGE GENERATION*\n' +
      '┃ ' + p + 'imagine\n' +
      '┃ ' + p + 'photo\n' +
      '┃ ' + p + 'portrait\n' +
      '┃ ' + p + 'anime2\n' +
      '┃ ' + p + 'art\n' +
      '┃ ' + p + 'logo\n' +
      '┃ ' + p + 'cartoon\n' +
      '┃ ' + p + 'realistic\n' +
      '┃ ' + p + 'fantasy\n' +
      '┃ ' + p + 'nature\n' +
      '┃ ' + p + 'space\n' +
      '┃ ' + p + 'abstract\n' +
      '┃ ' + p + 'neon\n' +
      '┃ ' + p + 'vintage\n' +
      '┃ ' + p + 'minimalist\n' +
      '┃ ' + p + 'landscape\n' +
      '┃ ' + p + 'city\n' +
      '┃ ' + p + '3d\n' +
      '┃ ' + p + 'gold\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 🌟 *ASTRA-X AI*\n' +
      '┃ ' + p + 'noorai\n' +
      '┃ ' + p + 'nai\n' +
      '┃ ' + p + 'nask\n' +
      '┃ ' + p + 'noorask\n' +
      '┃ ' + p + 'noorbot\n' +
      '┃ ' + p + 'noorsearch\n' +
      '┃ ' + p + 'nsearch\n' +
      '┃ ' + p + 'nweb\n' +
      '┃ ' + p + 'websearch\n' +
      '┃ ' + p + 'noorexplain\n' +
      '┃ ' + p + 'nexplain\n' +
      '┃ ' + p + 'ninfo\n' +
      '┃ ' + p + 'nwiki\n' +
      '┃ ' + p + 'noorstory\n' +
      '┃ ' + p + 'nstory\n' +
      '┃ ' + p + 'ntale\n' +
      '┃ ' + p + 'noormath\n' +
      '┃ ' + p + 'nmath\n' +
      '┃ ' + p + 'nsolve\n' +
      '┃ ' + p + 'ncalc\n' +
      '┃ ' + p + 'noorphoto\n' +
      '┃ ' + p + 'nphoto\n' +
      '┃ ' + p + 'nimage\n' +
      '┃ ' + p + 'npic\n' +
      '┃ ' + p + 'noordownload\n' +
      '┃ ' + p + 'ndl\n' +
      '┃ ' + p + 'ndown\n' +
      '┃ ' + p + 'nget\n' +
      '┃ ' + p + 'noortranslate\n' +
      '┃ ' + p + 'ntranslate\n' +
      '┃ ' + p + 'ntrans\n' +
      '┃ ' + p + 'noorquiz\n' +
      '┃ ' + p + 'nquiz\n' +
      '┃ ' + p + 'nq\n' +
      '┃ ' + p + 'noortrivia\n' +
      '┃ ' + p + 'noornews\n' +
      '┃ ' + p + 'nnews\n' +
      '┃ ' + p + 'nheadlines\n' +
      '┗━━━━━━━━━━━━━━━━━━━▣\n\n' +
      '┏━━━━━━━━━━━━━━━━━━━▣\n' +
      '┃ 📦 *APK DOWNLOAD*\n' +
      '┃ ' + p + 'apk\n' +
      '┃ ' + p + 'app\n' +
      '┃ ' + p + 'apkdown\n' +
      '┃ ' + p + 'getapk\n' +
      '┃ ' + p + 'apksearch\n' +
      '┃ ' + p + 'findapk\n' +
      '┃ ' + p + 'appfind\n' +
      '┃ ' + p + 'apkinfo\n' +
      '┃ ' + p + 'appinfo\n' +
      '┃ ' + p + 'apkdetails\n' +
      '┃ ' + p + 'apklink\n' +
      '┃ ' + p + 'apkurl\n' +
      '┃ ' + p + 'applink\n' +
      '┃ ' + p + 'apkfree\n' +
      '┃ ' + p + 'fdroid\n' +
      '┃ ' + p + 'opensource\n' +
      '┃ ' + p + 'apkmod\n' +
      '┃ ' + p + 'modapk\n' +
      '┃ ' + p + 'apkcheck\n' +
      '┃ ' + p + 'apksafe\n' +
      '┃ ' + p + 'apkscan\n' +
      '┃ ' + p + 'apkupdate\n' +
      '┃ ' + p + 'appupdate\n' +
      '┃ ' + p + 'latestapk\n' +
      '┃ ' + p + 'apktop\n' +
      '┃ ' + p + 'topapps\n' +
      '┃ ' + p + 'topgames\n' +
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
      '🌐 *Channel:* https://whatsapp.com/channel/0029Vb8BaxaBFLgMYofBAC3I\n\n' +
      '〔 ✧ *ᴀsᴛʀᴀ-x ᴛᴇᴄʜ v6.6.6* ✧ 〕\n' +
      '_© 2026 ASTRA-X • Always Online 🌍_';

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

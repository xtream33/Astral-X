'use strict';
const https = require('https');

function fetchJSON(url, headers={}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', ...headers } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getLiveScores() {
  // TheSportsDB free API
  const data = await fetchJSON('https://www.thesportsdb.com/api/v1/json/3/latestnow.php');
  return data?.results || [];
}

module.exports = {
  name: 'livescores',
  aliases: ['live', 'scores', 'football', 'matches'],
  category: 'sports',
  description: 'Get live football scores',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: '⚽ _Fetching live scores..._' });
    try {
      const events = await getLiveScores();
      if (!events.length) return sock.sendMessage(jid, { text: '⚽ No live matches right now.\n\nTry again during match times.' });
      let text = '⚽ *LIVE SCORES*\n━━━━━━━━━━━━━━\n\n';
      events.slice(0, 10).forEach(e => {
        const score = (e.intHomeScore !== null && e.intAwayScore !== null)
          ? e.intHomeScore + ' — ' + e.intAwayScore
          : 'vs';
        text += '🏟️ *' + e.strHomeTeam + '* ' + score + ' *' + e.strAwayTeam + '*\n';
        text += '📅 ' + (e.strLeague || e.strSport) + ' | ' + (e.strStatus || e.dateEvent) + '\n\n';
      });
      await sock.sendMessage(jid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not fetch scores: ' + e.message });
    }
  },
};

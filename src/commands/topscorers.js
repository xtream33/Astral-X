'use strict';
const https = require('https');
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
      res.on('error', reject);
    }).on('error', reject);
  });
}
module.exports = {
  name: 'topscorers',
  aliases: ['scorers', 'goldenboot', 'eplscorers'],
  category: 'sports',
  description: 'Get top scorers. Usage: .topscorers [league]',
  execute: async (sock, msg, args) => {
    const jid    = msg.key.remoteJid;
    const input  = args.join(' ').toLowerCase();
    const leagues = { epl:'4328', laliga:'4335', seriea:'4332', bundesliga:'4331', ucl:'4480', ligue1:'4334' };
    const leagueId = leagues[input] || '4328';
    const leagueName = Object.keys(leagues).find(k => leagues[k] === leagueId) || 'EPL';
    await sock.sendMessage(jid, { text: '⚽ _Fetching top scorers..._' });
    try {
      const data = await fetchJSON('https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=' + leagueId + '&s=2024-2025');
      const table = data?.table;
      if (!table?.length) throw new Error('No data');
      // Sort by goals scored descending
      const sorted = [...table].sort((a,b) => (parseInt(b.intGoalsFor)||0) - (parseInt(a.intGoalsFor)||0));
      let text = '🥅 *TOP SCORERS — ' + leagueName.toUpperCase() + '*\n━━━━━━━━━━━━━━\n\n';
      sorted.slice(0, 10).forEach((t, i) => {
        text += (i+1) + '. *' + t.strTeam + '* — ' + (t.intGoalsFor || 0) + ' goals\n';
      });
      text += '\n_Note: Shows goals per team. Use .topscorers epl/laliga/seriea/bundesliga/ucl/ligue1_';
      await sock.sendMessage(jid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not fetch scorers: ' + e.message });
    }
  },
};

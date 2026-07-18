'use strict';
const { makeTableCmd } = require('./epltable'); // reuse factory pattern

const LEAGUES = {
  ucltable:        { id: '4480', name: '🏆 UEFA Champions League' },
  laligatable:     { id: '4335', name: '🇪🇸 La Liga' },
  seriatable:      { id: '4332', name: '🇮🇹 Serie A' },
  bundesligatable: { id: '4331', name: '🇩🇪 Bundesliga' },
  ligue1table:     { id: '4334', name: '🇫🇷 Ligue 1' },
};
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
const league = LEAGUES['bundesligatable'];
module.exports = {
  name: 'bundesligatable',
  category: 'sports',
  description: 'Get ' + league.name + ' standings table',
  execute: async (sock, msg) => {
    const jid = msg.key.remoteJid;
    await sock.sendMessage(jid, { text: league.name + '\n⏳ _Fetching standings..._' });
    try {
      const data = await fetchJSON('https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=' + league.id + '&s=2024-2025');
      const table = data?.table;
      if (!table?.length) throw new Error('No table data');
      let text = league.name + ' *STANDINGS*\n━━━━━━━━━━━━━━\n\n';
      text += '`#  Team                  P  W  D  L  Pts`\n';
      table.slice(0, 20).forEach(t => {
        const pos  = String(t.intRank).padStart(2);
        const name = (t.strTeam || '').slice(0,20).padEnd(20);
        const p    = String(t.intPlayed||0).padStart(2);
        const w    = String(t.intWin||0).padStart(2);
        const d    = String(t.intDraw||0).padStart(2);
        const l    = String(t.intLoss||0).padStart(2);
        const pts  = String(t.intPoints||0).padStart(3);
        text += '`' + pos + ' ' + name + ' ' + p + ' ' + w + ' ' + d + ' ' + l + ' ' + pts + '`\n';
      });
      await sock.sendMessage(jid, { text }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: '❌ Could not fetch table: ' + e.message });
    }
  },
};

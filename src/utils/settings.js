const fs   = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '../../data/settings.json');

function load() {
  try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE,'utf8')) : {}; }
  catch(_){ return {}; }
}
function save(d) {
  try { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); } catch(_){}
}
const get    = (k, def=false) => { const v = load()[k]; return v !== undefined ? v : def; };
const set    = (k, v) => { const d=load(); d[k]=v; save(d); return v; };
const del    = (k)    => { const d=load(); delete d[k]; save(d); };
const toggle = (k)    => set(k, !get(k));
const all    = ()     => load();

module.exports = { get, set, del, toggle, all };

// ── Auto-cleanup: prune lastmsg tracking keys older than 2 days ──────────
// These keys accumulate fast in groups — clean them to save space
function cleanOldKeys() {
  try {
    const d       = load();
    const now     = Date.now();
    const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
    let removed   = 0;
    for (const k in d) {
      // Only clean lastmsg tracking keys (format: lastmsg:jid:sender)
      if (k.startsWith('lastmsg:') && typeof d[k] === 'number') {
        if ((now - d[k]) > TWO_DAYS) {
          delete d[k];
          removed++;
        }
      }
    }
    if (removed > 0) save(d);
  } catch(_) {}
}
setInterval(cleanOldKeys, 8 * 60 * 60 * 1000); // every 8 hours
module.exports.cleanOldKeys = cleanOldKeys;

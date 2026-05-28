'use strict';
const express = require('express');
const router  = express.Router();
const fs      = require('fs');
const path    = require('path');
const crypto  = require('crypto');
const subAdminStore = require('../utils/subAdminStore');
const sessionStore  = require('../utils/sessionStore');
const logger        = require('../utils/logger');
const userStore     = require('../utils/userStore');

// ── Sub-admin auth middleware ─────────────────────────────────────────────
function requireSub(req, res, next) {
  if (req.session && req.session.subAdmin) return next();
  return res.redirect('/sub');
}

// ── Serve login page ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  if (req.session && req.session.subAdmin) return res.redirect('/sub/dashboard');
  res.sendFile(path.join(__dirname, '../../public/sub.html'));
});

// ── Login API ─────────────────────────────────────────────────────────────
router.post('/login', express.json(), (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    const admin = subAdminStore.verifyLogin(username.trim(), email.trim().toLowerCase(), password);
    if (!admin)
      return res.status(401).json({ success: false, message: 'Invalid username, email or password' });

    req.session.subAdmin = { id: admin.id, username: admin.username, email: admin.email };
    logger.info('Sub-admin login: ' + admin.username);
    res.json({ success: true, message: 'Login successful' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/sub'));
});

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get('/dashboard', requireSub, (req, res) => {
  const subAdmin   = req.session.subAdmin;
  const adminData  = subAdminStore.getById(subAdmin.id);
  if (!adminData) return res.redirect('/sub');

  const allSessions   = sessionStore.getAll();
  const mySids        = adminData.activatedSessions || [];
  const myRecords     = allSessions.filter(r => mySids.includes(r.sessionId));
  const quota         = adminData.sessionQuota;
  const used          = mySids.length;
  const remaining     = quota - used;

  // Get pending sessions (not yet activated by anyone)
  const allSubAdmins  = subAdminStore.getAll();
  const claimedSids   = allSubAdmins.flatMap(a => a.activatedSessions);
  const pending       = allSessions.filter(r => !r.active && !claimedSids.includes(r.sessionId));

  const csrf = crypto.randomBytes(16).toString('hex');
  req.session.subCsrf = csrf;

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASTRA-X — My Sessions</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:linear-gradient(170deg,#080003,#050003,#080500);color:#f87171;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.4rem;font-weight:900;background:linear-gradient(90deg,#7f1d1d,#ef4444,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:rgba(248,113,113,.4);font-size:.78rem;margin-bottom:18px}
.nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:8px}
.nav a{color:rgba(248,113,113,.5);text-decoration:none;font-size:.82rem}
.nav a:hover{color:#f87171}
.welcome{background:rgba(52,211,153,.07);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:.85rem;color:#34d399;font-weight:600}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.stat{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:12px 16px;text-align:center;flex:1;min-width:80px}
.sn{font-size:1.4rem;font-weight:900;color:#f87171}
.sl{font-size:.66rem;color:rgba(248,113,113,.4);text-transform:uppercase;letter-spacing:1px}
.section{background:rgba(10,0,3,.95);border:1px solid rgba(239,68,68,.2);border-radius:14px;padding:16px;margin-bottom:14px}
.sec-title{font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(248,113,113,.5);margin-bottom:12px}
.activate-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.activate-row input{flex:1;min-width:160px;padding:9px 12px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.22);border-radius:8px;color:#f87171;font-size:.86rem;outline:none;text-transform:uppercase}
.activate-row input::placeholder{text-transform:none;color:rgba(248,113,113,.25)}
.btn{padding:9px 16px;border:none;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .15s}
.bg{background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.3);color:#34d399}
.bg:hover{background:rgba(52,211,153,.28)}
.br{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);color:#f87171}
.br:hover{background:rgba(239,68,68,.22)}
.bred{background:linear-gradient(90deg,#7f1d1d,#b91c1c);color:#fff;border:none}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:8px 10px;color:rgba(248,113,113,.4);font-size:.66rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(239,68,68,.1)}
td{padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07);vertical-align:middle}
tr:hover td{background:rgba(239,68,68,.03)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:.7rem;font-weight:700}
.bon{background:rgba(52,211,153,.15);color:#34d399;border:1px solid rgba(52,211,153,.28)}
.boff{background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.22)}
.bexp{background:rgba(212,175,55,.1);color:#d4af37;border:1px solid rgba(212,175,55,.22)}
.sid{font-family:monospace;font-weight:700;color:#f87171;font-size:.82rem;letter-spacing:1px}
.ph{color:rgba(248,113,113,.6)}
.empty{text-align:center;color:rgba(248,113,113,.3);padding:24px;font-size:.85rem}
.quota-bar{height:6px;background:rgba(239,68,68,.1);border-radius:4px;overflow:hidden;margin-top:8px}
.quota-fill{height:100%;background:linear-gradient(90deg,#7f1d1d,#ef4444);border-radius:4px;transition:width .5s}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(10,30,10,.97);border:1px solid rgba(52,211,153,.4);color:#34d399;padding:11px 20px;border-radius:10px;font-size:.84rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:999;pointer-events:none;white-space:nowrap}
.toast.show{opacity:1}
.toast.err{border-color:rgba(239,68,68,.4);color:#f87171;background:rgba(30,5,5,.97)}
@keyframes shimmer{0%{background-position:0% center}100%{background-position:300% center}}
</style></head><body>

<div class="nav">
  <div>
    <h1>&#x1F511; My Sessions</h1>
    <p class="sub">ASTRA-X Sub-Admin Panel</p>
  </div>
  <div style="display:flex;gap:8px">
    <a href="/sub/logout">&#x1F6AA; Logout</a>
  </div>
</div>

<div class="welcome">
  &#x1F389; Thanks for subscribing to Premium Bot Ownership, <strong>${subAdmin.username}</strong>!
</div>

<div class="stats">
  <div class="stat"><div class="sn">${quota}</div><div class="sl">Quota</div></div>
  <div class="stat"><div class="sn" style="color:#34d399">${used}</div><div class="sl">Active</div></div>
  <div class="stat"><div class="sn" style="color:${remaining > 0 ? '#d4af37' : '#f87171'}">${remaining}</div><div class="sl">Remaining</div></div>
</div>
<div class="quota-bar" style="margin-bottom:18px">
  <div class="quota-fill" style="width:${Math.min(100, Math.round(used/quota*100))}%"></div>
</div>

<!-- Activate by Session ID -->
<div class="section">
  <div class="sec-title">&#x26A1; Activate a Session</div>
  <div class="activate-row">
    <input type="text" id="sidInput" placeholder="Enter ASTRAX-XXXXXXXX from user's DM">
    <button class="btn bred" onclick="activate()">Activate</button>
  </div>
  ${remaining <= 0 ? '<p style="color:#f87171;font-size:.75rem;margin-top:8px">&#x26A0; You have reached your session quota. Contact the owner to increase it.</p>' : ''}
</div>

<!-- My Sessions -->
<div class="section">
  <div class="sec-title">&#x1F4F1; My Activated Sessions (${myRecords.length})</div>
  ${myRecords.length === 0
    ? '<div class="empty">No sessions activated yet.<br>Enter a Session ID above to activate.</div>'
    : `<table><thead><tr><th>Session ID</th><th>Phone</th><th>Status</th><th>Expires</th><th>Action</th></tr></thead><tbody>
    ${myRecords.map(r => {
      const expired = r.expiredAt;
      const badge = expired
        ? '<span class="badge bexp">&#x23F0; Expired</span>'
        : r.active
          ? '<span class="badge bon">&#x1F7E2; Active</span>'
          : '<span class="badge boff">&#x1F534; Inactive</span>';
      const exp = r.activatedAt
        ? new Date(new Date(r.activatedAt).getTime() + 30*24*60*60*1000).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})
        : 'N/A';
      return '<tr>' +
        '<td class="sid">' + r.sessionId + '</td>' +
        '<td class="ph">+' + r.phoneNumber + '</td>' +
        '<td>' + badge + '</td>' +
        '<td style="color:rgba(248,113,113,.4);font-size:.73rem">' + exp + '</td>' +
        '<td>' +
          (r.active && !expired
            ? '<button class="btn br" onclick="deactivate(\'' + r.sessionId + '\')">&#x1F512; Off</button>'
            : '') +
        '</td></tr>';
    }).join('')}
    </tbody></table>`
  }
</div>

<div class="toast" id="toast"></div>

<script>
const CSRF = '${csrf}';

function toast(msg, ok) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (ok === false ? ' err' : '') + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

async function api(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sub-CSRF': CSRF },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function activate() {
  const sid = document.getElementById('sidInput').value.trim().toUpperCase();
  if (!sid) return toast('Enter a Session ID', false);
  const d = await api('/sub/api/activate', { sessionId: sid });
  toast(d.message, d.success);
  if (d.success) setTimeout(() => location.reload(), 2000);
}

async function deactivate(sid) {
  if (!confirm('Deactivate ' + sid + '? Bot goes OFFLINE.')) return;
  const d = await api('/sub/api/deactivate', { sessionId: sid });
  toast(d.message, d.success);
  if (d.success) setTimeout(() => location.reload(), 2000);
}

// Keepalive
setInterval(() => fetch('/api/ping', { cache: 'no-store' }).catch(() => {}), 10000);
// Auto refresh every 30s
setInterval(() => location.reload(), 30000);
</script>
</body></html>`);
});

// ── Sub-admin API — Activate session ─────────────────────────────────────
router.post('/api/activate', requireSub, express.json(), async (req, res) => {
  try {
    const subAdmin  = req.session.subAdmin;
    const adminData = subAdminStore.getById(subAdmin.id);
    if (!adminData) return res.status(401).json({ success: false, message: 'Account not found' });

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });

    const sid    = sessionId.trim().toUpperCase();
    const record = sessionStore.getBySessionId(sid);
    if (!record) return res.status(404).json({ success: false, message: 'Session ID not found: ' + sid });

    // Check quota
    if (!subAdminStore.canActivate(subAdmin.id))
      return res.status(403).json({ success: false, message: 'Quota reached (' + adminData.sessionQuota + '/' + adminData.sessionQuota + '). Contact owner to increase.' });

    // Activate in all stores
    sessionStore.activate(sid);
    subAdminStore.addSession(subAdmin.id, sid);
    userStore.activateUser(record.userId, record.phoneNumber, subAdmin.username);

    // Restore WhatsApp connection
    try {
      const { restoreSession } = require('../utils/socket');
      if (typeof restoreSession === 'function') {
        await restoreSession(record.userId);
      }
    } catch(e) { logger.warn('Restore warning: ' + e.message); }

    logger.info('Sub-admin ' + subAdmin.username + ' activated: ' + sid);
    res.json({ success: true, message: 'Bot is now ONLINE for +' + record.phoneNumber });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Sub-admin API — Deactivate session ────────────────────────────────────
router.post('/api/deactivate', requireSub, express.json(), (req, res) => {
  try {
    const subAdmin  = req.session.subAdmin;
    const adminData = subAdminStore.getById(subAdmin.id);
    if (!adminData) return res.status(401).json({ success: false, message: 'Account not found' });

    const { sessionId } = req.body;
    const sid    = (sessionId || '').trim().toUpperCase();
    const record = sessionStore.getBySessionId(sid);

    // Only allow deactivating sessions they own
    if (!adminData.activatedSessions.includes(sid))
      return res.status(403).json({ success: false, message: 'You do not own this session' });

    sessionStore.deactivate(sid);
    userStore.deactivateUser(record.userId);
    const { deleteSession } = require('../utils/socket');
    if (record) deleteSession(record.userId);

    logger.info('Sub-admin ' + subAdmin.username + ' deactivated: ' + sid);
    res.json({ success: true, message: 'Bot is now OFFLINE for +' + (record ? record.phoneNumber : sid) });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;

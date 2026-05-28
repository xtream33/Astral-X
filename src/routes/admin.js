'use strict';
const express     = require('express');
const router      = express.Router();
const crypto      = require('crypto');
const {
  getSession, deleteSession, getAllSessions, startSession,
} = require('../utils/socket');
const {
  addRestrictedUser, removeRestrictedUser,
  isUserRestricted, getRestrictedUsers,
} = require('../utils/restrictions');
const stats       = require('../utils/stats');
const logger      = require('../utils/logger');
const ss            = require('../utils/sessionStore');
const subAdminStore = require('../utils/subAdminStore');
const sas = subAdminStore;
const userStore   = require('../utils/userStore');

const ADMIN_USER = process.env.ADMIN_USER  || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS  || 'astrax2024';
const AUTH_KEY   = process.env.ADMIN_AUTH_KEY || 'NOOR7';

// ── In-memory login rate limiter (10 attempts / 5 min) ───────────────────
const loginAttempts = {};
function loginRateLimit(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, resetAt: now + 300_000 };
  if (now > loginAttempts[ip].resetAt) loginAttempts[ip] = { count: 0, resetAt: now + 300_000 };
  loginAttempts[ip].count++;
  if (loginAttempts[ip].count > 10)
    return res.status(429).send(errorPage('Too Many Attempts', '⏳ Too many login attempts. Wait 5 minutes.'));
  next();
}

// ── CSRF helpers ──────────────────────────────────────────────────────────
function csrfGenerate(req) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  return req.session.csrfToken;
}
function csrfCheck(req, res, next) {
  if (req.method !== 'POST') return next();
  const tok = req.body?._csrf || req.headers?.['x-csrf-token'];
  if (!tok || tok !== req.session?.csrfToken) {
    // API calls expect JSON; browser form posts expect a redirect
    const isApi = req.xhr || (req.headers.accept || '').includes('application/json') || req.headers['content-type'] === 'application/json';
    if (isApi) return res.status(403).json({ success: false, message: 'CSRF token invalid. Refresh the page.' });
    // For form posts: redirect back to login with a clear error
    const err = encodeURIComponent('Session expired. Please try again.');
    return res.redirect('/admin/login?err=' + err);
  }
  next();
}

// ── Auth middleware ───────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (req.session?.adminAuth) return next();
  res.redirect('/admin/login');
}

// ── /admin root → redirect to dashboard or login ─────────────────────────
router.get('/', (req, res) => {
  if (req.session?.adminAuth) return res.redirect('/admin/dashboard');
  res.redirect('/admin/login');
});

// ── Shared CSS ────────────────────────────────────────────────────────────
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--g:#25d366;--b:#3b82f6;--r:#ef4444;--y:#f59e0b;--p:#8b5cf6;--c:#06b6d4;--dark:#060d14;--card:rgba(11,18,30,.97)}
body{font-family:'Segoe UI',system-ui,sans-serif;background:var(--dark);min-height:100vh;color:#e2e8f0}
a{color:var(--b);text-decoration:none}a:hover{text-decoration:underline}
input,textarea,select{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  border-radius:8px;color:#e2e8f0;padding:10px 14px;font-size:.9rem;width:100%;outline:none}
input:focus,textarea:focus{border-color:var(--g)}
button,.btn{cursor:pointer;border:none;border-radius:8px;font-size:.82rem;font-weight:600;padding:7px 14px;transition:.2s}
.btn-green{background:var(--g);color:#000}.btn-green:hover{background:#1da34f}
.btn-red{background:var(--r);color:#fff}.btn-red:hover{background:#c93030}
.btn-blue{background:var(--b);color:#fff}.btn-blue:hover{background:#2563eb}
.btn-yellow{background:var(--y);color:#000}.btn-yellow:hover{background:#d97706}
.btn-purple{background:var(--p);color:#fff}.btn-purple:hover{background:#7c3aed}
.btn-submit{background:linear-gradient(135deg,var(--g),var(--b));color:#fff;width:100%;
  padding:12px;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;border:none;transition:.2s}
.btn-submit:hover{opacity:.88}

.nav{background:rgba(6,13,20,.98);border-bottom:1px solid rgba(37,211,102,.18);
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:100;backdrop-filter:blur(12px)}
.nav-brand{font-size:1.05rem;font-weight:900;
  background:linear-gradient(90deg,var(--g),var(--b));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.nav-links{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.nav-links a{font-size:.8rem;color:#64748b;padding:5px 10px;border-radius:6px;background:rgba(255,255,255,.04)}
.nav-links a:hover{color:#fff;background:rgba(255,255,255,.1)}
.conn-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:.72rem;font-weight:700;background:rgba(52,211,153,.1);border:1px solid rgba(52,211,153,.3);color:#34d399}
.conn-badge.offline{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3);color:#f87171}
.conn-dot{width:7px;height:7px;border-radius:50%;background:#34d399;animation:blink 1.2s ease infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

.wrap{max-width:1200px;margin:0 auto;padding:24px 16px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
.stat{background:var(--card);border:1px solid rgba(37,211,102,.12);border-radius:14px;padding:18px;text-align:center}
.stat-n{font-size:2rem;font-weight:900;line-height:1.1}
.stat-l{font-size:.72rem;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:.05em}

.sec{background:var(--card);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:20px;margin-bottom:20px}
.sec-title{font-size:1rem;font-weight:700;margin-bottom:16px;color:#cbd5e1;
  padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.07)}
table{width:100%;border-collapse:collapse;font-size:.83rem}
th{text-align:left;padding:10px 12px;color:#64748b;font-weight:600;
  background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.07);font-size:.75rem;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:rgba(255,255,255,.02)}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.72rem;font-weight:700}
.badge-on{background:rgba(37,211,102,.15);color:var(--g)}
.badge-off{background:rgba(239,68,68,.12);color:var(--r)}
.actions{display:flex;gap:6px;flex-wrap:wrap}
.row{display:flex;gap:10px;align-items:flex-end}
.row input{flex:1}
textarea{min-height:90px;resize:vertical}
.alert{border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:.85rem}
.alert-ok{background:rgba(37,211,102,.1);border:1px solid rgba(37,211,102,.3);color:var(--g)}
.alert-err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:var(--r)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.grid2{grid-template-columns:1fr}.row{flex-direction:column}.actions{flex-wrap:wrap}}
.chip{display:inline-block;background:rgba(59,130,246,.15);color:var(--b);
  border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:700;margin-left:6px}
`;

function page(title, body) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — ASTRA-X Admin</title>
<style>${CSS}</style></head><body>${body}</body></html>`;
}

function errorPage(title, msg) {
  return page(title, `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="text-align:center;padding:40px"><h2 style="color:#ef4444;margin-bottom:12px">${title}</h2>
<p style="color:#94a3b8">${msg}</p>
<a href="/admin/login" style="display:inline-block;margin-top:20px;color:#25d366">← Back to login</a></div></div>`);
}

function sanitize(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGIN ROUTES
// ═══════════════════════════════════════════════════════════════════════════
router.get('/login', (req, res) => {
  if (req.session?.adminAuth) return res.redirect('/admin/dashboard');
  const tok = csrfGenerate(req);
  const err = req.query.err ? `<div class="alert alert-err">${sanitize(decodeURIComponent(req.query.err))}</div>` : '';
  res.send(page('Admin Login', `
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="width:100%;max-width:420px;padding:24px 16px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-size:2.5rem;margin-bottom:8px">🔐</div>
      <h1 style="font-size:1.4rem;font-weight:900;background:linear-gradient(90deg,#25d366,#3b82f6);
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">ASTRA-X Admin</h1>
      <p style="color:#64748b;font-size:.85rem;margin-top:4px">Sign in to manage your bot</p>
    </div>
    <div class="sec">${err}
      <form method="POST" action="/admin/login">
        <input type="hidden" name="_csrf" value="${tok}">
        <div style="margin-bottom:14px">
          <label style="display:block;font-size:.8rem;color:#94a3b8;margin-bottom:6px">Username</label>
          <input name="username" type="text" placeholder="admin" autocomplete="username" required>
        </div>
        <div style="margin-bottom:20px">
          <label style="display:block;font-size:.8rem;color:#94a3b8;margin-bottom:6px">Password</label>
          <input name="password" type="password" placeholder="••••••••" autocomplete="current-password" required>
        </div>
        <button type="submit" class="btn-submit">Sign In →</button>
      </form>
    </div>
  </div></div>`));
});

router.post('/login', loginRateLimit, csrfCheck, (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.adminAuth   = true;
    req.session.adminUser   = username;
    delete loginAttempts[req.ip];
    return res.redirect('/admin/dashboard');
  }
  const err = encodeURIComponent('❌ Wrong username or password');
  res.redirect('/admin/login?err=' + err);
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ── Key verify (optional 2-step) ─────────────────────────────────────────
router.get('/verify-key', requireAdmin, (req, res) => {
  if (req.session?.keyVerified) return res.redirect('/admin/dashboard');
  const tok = csrfGenerate(req);
  res.send(page('Verify Key', `
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh">
  <div style="width:100%;max-width:400px;padding:24px 16px">
    <div class="sec">
      <div class="sec-title">🔑 Enter Auth Key</div>
      <form method="POST" action="/admin/verify-key">
        <input type="hidden" name="_csrf" value="${tok}">
        <div style="margin-bottom:14px">
          <input name="key" type="text" placeholder="Enter your auth key" required>
        </div>
        <button type="submit" class="btn-submit">Verify →</button>
      </form>
    </div>
  </div></div>`));
});

router.post('/verify-key', loginRateLimit, requireAdmin, csrfCheck, (req, res) => {
  if (req.body.key === AUTH_KEY) {
    req.session.keyVerified = true;
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/admin/verify-key?err=1');
});

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════
router.get('/sub-admins', requireAdmin, (req, res) => {
  const tok    = csrfGenerate(req);
  const admins = sas.getAll();

  const rows = admins.length === 0 ? '' : admins.map(a => {
    const dt  = new Date(a.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const used = (a.activatedSessions||[]).length;
    return '<tr>' +
      '<td style="font-weight:700;color:#f5d060">' + a.username + '</td>' +
      '<td style="color:rgba(212,175,55,.6);font-size:.8rem">' + a.email + '</td>' +
      '<td style="text-align:center"><strong style="color:#34d399">' + used + '</strong> / <strong>' + a.sessionQuota + '</strong></td>' +
      '<td><input type="number" class="qi" data-id="' + a.id + '" value="' + a.sessionQuota + '" min="1" style="width:70px;padding:5px 8px;background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:6px;color:#f5d060;outline:none" onchange="updateQuota(this.dataset.id,this.value)"></td>' +
      '<td style="color:rgba(212,175,55,.35);font-size:.73rem">' + dt + '</td>' +
      '<td><button class="btn br" onclick="delAdmin(\'' + a.id + '\')">&#x1F5D1; Delete</button></td>' +
      '</tr>';
  }).join('');

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sub-Admin Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0a0700;color:#f5d060;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.4rem;font-weight:900;background:linear-gradient(90deg,#a78bfa,#7c3aed,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:rgba(167,139,250,.4);font-size:.78rem;margin-bottom:16px}
a.back{color:#2dd4bf;text-decoration:none;font-size:.82rem;display:inline-block;margin-bottom:14px}
.card{background:rgba(10,7,0,.95);border:1px solid rgba(167,139,250,.22);border-radius:14px;padding:18px;margin-bottom:16px}
.card-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(167,139,250,.5);margin-bottom:14px;display:flex;align-items:center;gap:6px}
.fields{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.field{display:flex;flex-direction:column;gap:5px;flex:1;min-width:140px}
.fl{font-size:.67rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(167,139,250,.5)}
input[type=text],input[type=email],input[type=password],input[type=number]{
  padding:10px 12px;background:rgba(167,139,250,.07);
  border:1.5px solid rgba(167,139,250,.22);border-radius:8px;
  color:#f5d060;font-size:.88rem;outline:none;width:100%;
  transition:border-color .2s}
input:focus{border-color:rgba(167,139,250,.6);background:rgba(167,139,250,.1)}
input::placeholder{color:rgba(167,139,250,.2)}
.btn{padding:10px 18px;border:none;border-radius:8px;font-weight:800;font-size:.85rem;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
.bpurple{background:linear-gradient(90deg,#5b21b6,#7c3aed,#a78bfa);color:#fff;border:none;width:100%}
.bpurple:hover{opacity:.88;box-shadow:0 4px 18px rgba(124,58,237,.4)}
.bpurple:active{transform:scale(.97)}
.br{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);color:#f87171}
.br:hover{background:rgba(239,68,68,.22)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:8px 10px;color:rgba(212,175,55,.4);font-size:.66rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(212,175,55,.1)}
td{padding:9px 10px;border-bottom:1px solid rgba(212,175,55,.07);vertical-align:middle}
.empty{text-align:center;color:rgba(212,175,55,.3);padding:28px;font-size:.88rem}
.toast{position:fixed;bottom:20px;right:16px;left:16px;background:#1a1200;border:1px solid rgba(212,175,55,.4);color:#f5d060;padding:12px 18px;border-radius:10px;font-size:.85rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:9999;pointer-events:none;text-align:center}
.toast.show{opacity:1}
.toast.err{border-color:rgba(239,68,68,.4);color:#f87171;background:rgba(20,0,0,.97)}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head><body>

<a class="back" href="/admin/dashboard">&#x2190; Back to Dashboard</a>
<h1>&#x1F464; Sub-Admin Manager</h1>
<p class="sub">Create accounts for agents who can activate user sessions</p>

<div class="card">
  <div class="card-title">&#x2795; Create New Sub-Admin</div>
  <div class="fields">
    <div class="field">
      <span class="fl">Username</span>
      <input type="text" id="f_user" placeholder="e.g. john_agent" autocomplete="off">
    </div>
    <div class="field">
      <span class="fl">Email</span>
      <input type="email" id="f_email" placeholder="john@email.com" autocomplete="off">
    </div>
    <div class="field">
      <span class="fl">Password</span>
      <input type="password" id="f_pass" placeholder="Strong password" autocomplete="new-password">
    </div>
    <div class="field">
      <span class="fl">Session Limit</span>
      <input type="number" id="f_quota" placeholder="5" value="5" min="1" max="9999">
    </div>
  </div>
  <button class="btn bpurple" id="createBtn" onclick="doCreate()">
    &#x1F511; Create Sub-Admin
  </button>
</div>

<div class="card">
  <div class="card-title">&#x1F465; Sub-Admins (${admins.length})</div>
  ${admins.length === 0
    ? '<div class="empty">No sub-admins yet. Create one above.</div>'
    : '<table><thead><tr><th>Username</th><th>Email</th><th>Used/Quota</th><th>Quota</th><th>Created</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>'
  }
</div>

<div class="toast" id="toast"></div>

<script>
const CSRF = '${tok}';

function showToast(msg, ok) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (ok === false ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

async function apiCall(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function doCreate() {
  const u = document.getElementById('f_user').value.trim();
  const e = document.getElementById('f_email').value.trim().toLowerCase();
  const p = document.getElementById('f_pass').value;
  const q = document.getElementById('f_quota').value.trim();

  if (!u) return showToast('Enter a username', false);
  if (!e || !e.includes('@')) return showToast('Enter a valid email', false);
  if (!p || p.length < 4) return showToast('Password must be at least 4 characters', false);
  if (!q || parseInt(q) < 1) return showToast('Session limit must be at least 1', false);

  const btn = document.getElementById('createBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating...';

  try {
    const d = await apiCall('/api/sub-admin/create', { username: u, email: e, password: p, quota: q });
    showToast(d.message || (d.success ? 'Created!' : 'Failed'), d.success);
    if (d.success) {
      document.getElementById('f_user').value = '';
      document.getElementById('f_email').value = '';
      document.getElementById('f_pass').value = '';
      document.getElementById('f_quota').value = '5';
      setTimeout(() => location.reload(), 1800);
    }
  } catch (err) {
    showToast('Network error: ' + err.message, false);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '&#x1F511; Create Sub-Admin';
  }
}

async function updateQuota(id, q) {
  try {
    const d = await apiCall('/api/sub-admin/quota', { id, quota: q });
    showToast(d.message || 'Updated', d.success);
  } catch(err) { showToast('Error: ' + err.message, false); }
}

async function delAdmin(id) {
  if (!confirm('Delete this sub-admin? This cannot be undone.')) return;
  try {
    const d = await apiCall('/api/sub-admin/delete', { id });
    showToast(d.message || 'Deleted', d.success);
    if (d.success) setTimeout(() => location.reload(), 1200);
  } catch(err) { showToast('Error: ' + err.message, false); }
}

setInterval(() => fetch('/api/ping', { cache: 'no-store' }).catch(() => {}), 10000);
</script>
</body></html>`);
});

router.get('/sub-admins', requireAdmin, (req, res) => {
  const tok    = csrfGenerate(req);
  const admins = sas.getAll();

  const adminRows = admins.map(a => {
    const dt   = new Date(a.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const used = (a.activatedSessions||[]).length;
    const quota = a.sessionQuota || 0;
    const pct  = quota > 0 ? Math.min(100, Math.round((used/quota)*100)) : 0;
    const barColor = pct >= 90 ? '#f87171' : pct >= 60 ? '#d4af37' : '#34d399';
    return `<div class="admin-card" data-id="${a.id}">
      <div class="ac-header">
        <div>
          <div class="ac-name">${a.username}</div>
          <div class="ac-email">${a.email}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:rgba(212,175,55,.4)">Created ${dt}</div>
          <div style="margin-top:4px;display:flex;gap:6px;justify-content:flex-end">
            <button class="btn bg" onclick="editAdmin('${a.id}','${a.username}','${a.email}','${a.sessionQuota}')" style="font-size:.72rem;padding:5px 10px">&#x270F;&#xFE0F; Edit</button>
            <button class="btn br" onclick="delAdmin('${a.id}')" style="font-size:.72rem;padding:5px 10px">&#x1F5D1;</button>
          </div>
        </div>
      </div>
      <div class="ac-quota-bar">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:.72rem;color:rgba(212,175,55,.5)">Quota Used</span>
          <span style="font-size:.78rem;font-weight:700;color:${barColor}">${used} / ${quota}</span>
        </div>
        <div style="background:rgba(212,175,55,.1);border-radius:4px;height:6px;overflow:hidden">
          <div style="background:${barColor};height:100%;width:${pct}%;border-radius:4px;transition:width .3s"></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap">
        <span style="font-size:.72rem;color:rgba(212,175,55,.45)">Add quota:</span>
        <input type="number" min="1" max="999" placeholder="+N" style="width:70px;padding:5px 8px;background:rgba(212,175,55,.07);border:1.5px solid rgba(212,175,55,.2);border-radius:6px;color:#f5d060;outline:none;font-size:.82rem" id="addq_${a.id}">
        <button class="btn bgold" onclick="addQuota('${a.id}')" style="font-size:.72rem;padding:5px 12px">&#x2795; Add</button>
        <button class="btn bg" onclick="copyText('${a.username}','Username')" style="font-size:.72rem;padding:5px 10px">&#x1F4CB; User</button>
      </div>
    </div>`;
  }).join('');

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sub-Admin Manager</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0a0700;color:#f5d060;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.4rem;font-weight:900;background:linear-gradient(90deg,#a78bfa,#7c3aed,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:rgba(167,139,250,.4);font-size:.78rem;margin-bottom:16px}
a.back{color:#2dd4bf;text-decoration:none;font-size:.82rem;display:inline-block;margin-bottom:14px}
.card{background:rgba(10,7,0,.95);border:1.5px solid rgba(167,139,250,.22);border-radius:14px;padding:18px;margin-bottom:16px}
.card-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(167,139,250,.5);margin-bottom:14px}
.fields{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.field{display:flex;flex-direction:column;gap:5px;flex:1;min-width:140px}
.fl{font-size:.67rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(167,139,250,.5)}
input[type=text],input[type=email],input[type=password],input[type=number]{
  padding:9px 12px;background:rgba(167,139,250,.07);border:1.5px solid rgba(167,139,250,.22);
  border-radius:8px;color:#f5d060;font-size:.88rem;outline:none;width:100%;transition:border-color .2s}
input:focus{border-color:rgba(167,139,250,.6);background:rgba(167,139,250,.1)}
input::placeholder{color:rgba(167,139,250,.2)}
.btn{padding:9px 16px;border:none;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
.bpurple{background:linear-gradient(90deg,#5b21b6,#7c3aed,#a78bfa);color:#fff;border:none;width:100%}
.bpurple:hover{opacity:.88;box-shadow:0 4px 18px rgba(124,58,237,.4)}
.br{background:rgba(239,68,68,.12);border:1.5px solid rgba(239,68,68,.28);color:#f87171}
.br:hover{background:rgba(239,68,68,.22)}
.bg{background:rgba(52,211,153,.12);border:1.5px solid rgba(52,211,153,.28);color:#34d399}
.bg:hover{background:rgba(52,211,153,.22)}
.bgold{background:linear-gradient(90deg,#92701a,#d4af37);color:#0a0700;border:none}
.bgold:hover{opacity:.88}
.admin-card{background:rgba(167,139,250,.04);border:1.5px solid rgba(167,139,250,.18);border-radius:12px;padding:14px;margin-bottom:12px;transition:border-color .2s}
.admin-card:hover{border-color:rgba(167,139,250,.35)}
.ac-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:10px;flex-wrap:wrap}
.ac-name{font-size:1rem;font-weight:800;color:#f5d060}
.ac-email{font-size:.76rem;color:rgba(167,139,250,.5);margin-top:2px}
.ac-quota-bar{margin-top:8px}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;align-items:center;justify-content:center;padding:20px}
.modal-overlay.show{display:flex}
.modal{background:#0f0a00;border:1.5px solid rgba(167,139,250,.4);border-radius:16px;padding:22px;width:100%;max-width:400px}
.modal h3{font-size:1rem;font-weight:800;color:#a78bfa;margin-bottom:16px}
.pw-wrap{position:relative}
.pw-wrap input{padding-right:40px}
.pw-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(167,139,250,.5);cursor:pointer;font-size:.9rem;padding:4px}
.toast{position:fixed;bottom:20px;right:16px;left:16px;max-width:360px;margin:0 auto;background:#1a1200;border:1px solid rgba(212,175,55,.4);color:#f5d060;padding:12px 18px;border-radius:10px;font-size:.85rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:9999;pointer-events:none;text-align:center}
.toast.show{opacity:1}
.toast.err{border-color:rgba(239,68,68,.4);color:#f87171}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite;display:inline-block}
@keyframes spin{to{transform:rotate(360deg)}}
.empty{text-align:center;color:rgba(212,175,55,.3);padding:28px;font-size:.88rem}
</style></head><body>

<a class="back" href="/admin/dashboard">&#x2190; Back</a>
<h1>&#x1F464; Sub-Admin Manager</h1>
<p class="sub">Create and manage sub-admin accounts</p>

<!-- CREATE FORM -->
<div class="card">
  <div class="card-title">&#x2795; Create New Sub-Admin</div>
  <div class="fields">
    <div class="field"><span class="fl">Username</span><input type="text" id="f_user" placeholder="e.g. john_agent" autocomplete="off"></div>
    <div class="field"><span class="fl">Email</span><input type="email" id="f_email" placeholder="john@email.com" autocomplete="off"></div>
    <div class="field"><span class="fl">Password</span>
      <div class="pw-wrap">
        <input type="password" id="f_pass" placeholder="Strong password" autocomplete="new-password">
        <button class="pw-eye" onclick="togglePw('f_pass',this)">&#x1F441;</button>
      </div>
    </div>
    <div class="field"><span class="fl">Session Quota</span><input type="number" id="f_quota" placeholder="5" value="5" min="1" max="9999"></div>
  </div>
  <button class="btn bpurple" id="createBtn" onclick="doCreate()">&#x1F511; Create Sub-Admin</button>
</div>

<!-- SUB-ADMIN LIST -->
<div class="card">
  <div class="card-title">&#x1F465; All Sub-Admins (${admins.length})</div>
  ${admins.length === 0
    ? '<div class="empty">No sub-admins yet. Create one above.</div>'
    : adminRows
  }
</div>

<!-- EDIT MODAL -->
<div class="modal-overlay" id="editModal">
  <div class="modal">
    <h3>&#x270F;&#xFE0F; Edit Sub-Admin</h3>
    <input type="hidden" id="edit_id">
    <div class="fields">
      <div class="field"><span class="fl">Username</span><input type="text" id="edit_user" placeholder="Username"></div>
      <div class="field"><span class="fl">Email</span><input type="email" id="edit_email" placeholder="Email"></div>
    </div>
    <div class="field" style="margin-bottom:14px">
      <span class="fl">New Password <span style="font-weight:400;text-transform:none;letter-spacing:0">(leave blank to keep current)</span></span>
      <div class="pw-wrap" style="margin-top:5px">
        <input type="password" id="edit_pass" placeholder="New password (optional)">
        <button class="pw-eye" onclick="togglePw('edit_pass',this)">&#x1F441;</button>
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn bpurple" style="flex:1" onclick="saveEdit()">&#x1F4BE; Save Changes</button>
      <button class="btn br" style="width:auto" onclick="closeEdit()">Cancel</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
const CSRF='${tok}';

function toast(msg,ok=true){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast show'+(ok?'':' err');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('show'),3500);
}

async function api(url,body){
  try{
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':CSRF},body:JSON.stringify(body)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }catch(e){return{success:false,message:'Network error: '+e.message};}
}

async function doCreate(){
  const u=document.getElementById('f_user').value.trim();
  const e=document.getElementById('f_email').value.trim().toLowerCase();
  const p=document.getElementById('f_pass').value;
  const q=document.getElementById('f_quota').value.trim();
  if(!u)return toast('Enter a username',false);
  if(!e||!e.includes('@'))return toast('Enter a valid email',false);
  if(!p||p.length<4)return toast('Password must be at least 4 characters',false);
  if(!q||parseInt(q)<1)return toast('Quota must be at least 1',false);
  const btn=document.getElementById('createBtn');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Creating...';
  const d=await api('/api/sub-admin/create',{username:u,email:e,password:p,quota:q});
  toast(d.message||(d.success?'Created!':'Failed'),d.success);
  btn.disabled=false;btn.innerHTML='&#x1F511; Create Sub-Admin';
  if(d.success){
    ['f_user','f_email','f_pass'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('f_quota').value='5';
    setTimeout(()=>location.reload(),1800);
  }
}

async function delAdmin(id){
  if(!confirm('Delete this sub-admin? This cannot be undone.'))return;
  const d=await api('/api/sub-admin/delete',{id});
  toast(d.message||(d.success?'Deleted!':'Failed'),d.success);
  if(d.success)setTimeout(()=>location.reload(),1200);
}

async function addQuota(id){
  const inp=document.getElementById('addq_'+id);
  const add=parseInt(inp.value)||0;
  if(add<1)return toast('Enter a number to add',false);
  const card=document.querySelector('.admin-card[data-id="'+id+'"]');
  const currentQuota=parseInt(card.querySelector('input[type=number]')?.value||0)||0;
  // Get current from server
  const d=await api('/api/sub-admin/quota',{id,quota:currentQuota+add});
  toast(d.message||(d.success?'Quota updated!':'Failed'),d.success);
  if(d.success){inp.value='';setTimeout(()=>location.reload(),1200);}
}

function editAdmin(id,user,email,quota){
  document.getElementById('edit_id').value=id;
  document.getElementById('edit_user').value=user;
  document.getElementById('edit_email').value=email;
  document.getElementById('edit_pass').value='';
  document.getElementById('editModal').classList.add('show');
}

function closeEdit(){
  document.getElementById('editModal').classList.remove('show');
}

async function saveEdit(){
  const id=document.getElementById('edit_id').value;
  const username=document.getElementById('edit_user').value.trim();
  const email=document.getElementById('edit_email').value.trim();
  const password=document.getElementById('edit_pass').value;
  if(!username)return toast('Username cannot be empty',false);
  if(!email||!email.includes('@'))return toast('Invalid email',false);
  const d=await api('/api/sub-admin/update',{id,username,email,password:password||undefined});
  toast(d.message||(d.success?'Updated!':'Failed'),d.success);
  if(d.success){closeEdit();setTimeout(()=>location.reload(),1500);}
}

function togglePw(id,btn){
  const inp=document.getElementById(id);
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'👁️':'🙈';
}

function copyText(val,label){
  navigator.clipboard.writeText(val).catch(()=>{
    const ta=document.createElement('textarea');ta.value=val;
    ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);
    ta.select();document.execCommand('copy');document.body.removeChild(ta);
  });
  toast(label+' copied!',true);
}

document.getElementById('editModal').addEventListener('click',function(e){
  if(e.target===this)closeEdit();
});

setInterval(()=>fetch('/api/ping',{cache:'no-store'}).catch(()=>{}),10000);
</script>
</body></html>`);
});

router.get('/banned', requireAdmin, (req, res) => {
  const tok     = csrfGenerate(req);
  const banned  = userStore.getAllBanned();

  const rows = banned.map(b => {
    const dt = new Date(b.bannedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    return '<tr>' +
      '<td style="font-family:monospace;color:#f87171;font-weight:700">+' + b.phoneNumber + '</td>' +
      '<td style="color:rgba(248,113,113,.6)">' + (b.reason||'No reason') + '</td>' +
      '<td style="color:rgba(248,113,113,.4);font-size:.73rem">' + (b.bannedBy||'owner') + '</td>' +
      '<td style="color:rgba(248,113,113,.35);font-size:.73rem">' + dt + '</td>' +
      '<td><button class="btn bg" onclick="unban(\'+ b.phoneNumber +\')">Unban</button></td>' +
      '</tr>';
  }).join('');

  res.send(`<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Banned Users</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0a0000;color:#f87171;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.4rem;font-weight:900;margin-bottom:4px}
.sub{color:rgba(248,113,113,.4);font-size:.78rem;margin-bottom:18px}
a.back{color:#2dd4bf;text-decoration:none;font-size:.82rem;display:inline-block;margin-bottom:14px}
.card{background:rgba(10,0,0,.95);border:1px solid rgba(239,68,68,.22);border-radius:14px;padding:18px;margin-bottom:16px}
.card-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(239,68,68,.5);margin-bottom:14px}
.ban-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.ban-row input{flex:1;min-width:140px;padding:9px 12px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.22);border-radius:8px;color:#f87171;font-size:.86rem;outline:none}
.ban-row input::placeholder{color:rgba(248,113,113,.2)}
.btn{padding:9px 14px;border:none;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .15s}
.bred{background:linear-gradient(90deg,#7f1d1d,#b91c1c);color:#fff;border:none}
.bred:hover{opacity:.88}
.bg{background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.28);color:#34d399}
.bg:hover{background:rgba(52,211,153,.22)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:8px 10px;color:rgba(248,113,113,.4);font-size:.66rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(239,68,68,.1)}
td{padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07);vertical-align:middle}
.empty{text-align:center;color:rgba(248,113,113,.3);padding:28px}
.toast{position:fixed;bottom:20px;right:16px;left:16px;background:#1a0000;border:1px solid rgba(239,68,68,.4);color:#f87171;padding:11px 18px;border-radius:10px;font-size:.84rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:9999;pointer-events:none;text-align:center}
.toast.show{opacity:1}
.toast.ok{border-color:rgba(52,211,153,.4);color:#34d399;background:rgba(0,20,10,.97)}
</style></head><body>
<a class="back" href="/admin/dashboard">&#x2190; Back</a>
<h1>&#x1F6AB; Banned Users</h1>
<p class="sub">Phone numbers banned from using the bot</p>

<div class="card">
  <div class="card-title">&#x1F6AB; Ban a Phone Number</div>
  <div class="ban-row">
    <input type="text" id="b_phone" placeholder="Phone number e.g. 256747304196">
    <input type="text" id="b_reason" placeholder="Reason (optional)">
    <button class="btn bred" onclick="doBan()">&#x1F528; Ban</button>
  </div>
</div>

<div class="card">
  <div class="card-title">&#x1F4CB; Banned List (${banned.length})</div>
  ${banned.length === 0
    ? '<div class="empty">No banned users yet.</div>'
    : '<table><thead><tr><th>Phone</th><th>Reason</th><th>Banned By</th><th>Date</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>'
  }
</div>

<div class="toast" id="toast"></div>
<script>
const CSRF='${tok}';
function toast(msg,ok){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast show'+(ok?'  ok':'');
  clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3000);
}
async function api(url,body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':CSRF},body:JSON.stringify(body)});
  return r.json();
}
async function doBan(){
  const p=document.getElementById('b_phone').value.trim();
  const r=document.getElementById('b_reason').value.trim();
  if(!p)return toast('Enter a phone number',false);
  const d=await api('/api/ban',{phoneNumber:p,reason:r});
  toast(d.message,d.success);
  if(d.success)setTimeout(()=>location.reload(),1500);
}
async function unban(phone){
  if(!confirm('Unban +'+phone+'?'))return;
  const d=await api('/api/unban',{phoneNumber:phone});
  toast(d.message,d.success);
  if(d.success)setTimeout(()=>location.reload(),1200);
}
setInterval(()=>fetch('/api/ping',{cache:'no-store'}).catch(()=>{}),10000);
</script>
</body></html>`);
});

router.get('/activated', requireAdmin, (req, res) => {
  const tok   = csrfGenerate(req);
  const users = userStore.getAllActivated();

  const rows = users.map(u => {
    const act = new Date(u.activatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const exp = new Date(u.expiresAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const expired = Date.now() > new Date(u.expiresAt).getTime();
    const badge = u.active && !expired
      ? '<span style="color:#34d399;font-weight:700">&#x1F7E2; Active</span>'
      : '<span style="color:#f87171;font-weight:700">&#x1F534; ' + (expired?'Expired':'Inactive') + '</span>';
    return '<tr>' +
      '<td style="font-family:monospace;color:#f5d060;font-weight:700">+' + u.phoneNumber + '</td>' +
      '<td>' + badge + '</td>' +
      '<td style="color:rgba(212,175,55,.5);font-size:.73rem">' + (u.activatedBy||'owner') + '</td>' +
      '<td style="color:rgba(212,175,55,.4);font-size:.73rem">' + act + '</td>' +
      '<td style="color:rgba(212,175,55,.4);font-size:.73rem">' + exp + '</td>' +
      '<td style="display:flex;gap:5px">' +
        '<button class="btn br" onclick="deact(\''+u.userId+'\')" title="Deactivate">&#x1F512;</button>' +
        '<button class="btn bred" onclick="ban(\''+u.phoneNumber+'\')" title="Ban">&#x1F6AB;</button>' +
      '</td></tr>';
  }).join('');

  res.send(`<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Activated Users</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0a0700;color:#f5d060;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.4rem;font-weight:900;margin-bottom:4px;background:linear-gradient(90deg,#b87333,#d4af37,#f5d060);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.sub{color:rgba(212,175,55,.4);font-size:.78rem;margin-bottom:18px}
a.back{color:#2dd4bf;text-decoration:none;font-size:.82rem;display:inline-block;margin-bottom:14px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.stat{background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:12px;padding:12px 16px;text-align:center;min-width:80px}
.sn{font-size:1.4rem;font-weight:900;color:#f5d060}
.sl{font-size:.66rem;color:rgba(212,175,55,.4);text-transform:uppercase;letter-spacing:1px}
.card{background:rgba(10,7,0,.95);border:1px solid rgba(212,175,55,.2);border-radius:14px;padding:18px}
.card-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:rgba(212,175,55,.5);margin-bottom:12px}
.btn{padding:8px 12px;border:none;border-radius:7px;font-weight:700;font-size:.78rem;cursor:pointer;transition:all .15s}
.br{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.28);color:#f87171}
.br:hover{background:rgba(239,68,68,.22)}
.bred{background:rgba(239,68,68,.2);border:1px solid rgba(239,68,68,.4);color:#f87171}
.bred:hover{background:rgba(239,68,68,.35)}
table{width:100%;border-collapse:collapse;font-size:.8rem}
th{text-align:left;padding:8px 10px;color:rgba(212,175,55,.4);font-size:.66rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(212,175,55,.1)}
td{padding:9px 10px;border-bottom:1px solid rgba(212,175,55,.07);vertical-align:middle}
.empty{text-align:center;color:rgba(212,175,55,.3);padding:28px}
.toast{position:fixed;bottom:20px;right:16px;left:16px;background:#1a1200;border:1px solid rgba(212,175,55,.4);color:#f5d060;padding:11px 18px;border-radius:10px;font-size:.84rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:9999;pointer-events:none;text-align:center}
.toast.show{opacity:1}
</style></head><body>
<a class="back" href="/admin/dashboard">&#x2190; Back</a>
<h1>&#x1F7E2; Activated Users</h1>
<p class="sub">Users with active bot subscriptions</p>

<div class="stats">
  <div class="stat"><div class="sn">${users.length}</div><div class="sl">Total</div></div>
  <div class="stat"><div class="sn" style="color:#34d399">${users.filter(u=>u.active && Date.now()<new Date(u.expiresAt).getTime()).length}</div><div class="sl">Active</div></div>
  <div class="stat"><div class="sn" style="color:#f87171">${users.filter(u=>!u.active || Date.now()>=new Date(u.expiresAt).getTime()).length}</div><div class="sl">Expired</div></div>
</div>

<div class="card">
  <div class="card-title">&#x1F4CB; All Activated Users</div>
  ${users.length === 0
    ? '<div class="empty">No activated users yet.</div>'
    : '<table><thead><tr><th>Phone</th><th>Status</th><th>By</th><th>Activated</th><th>Expires</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>'
  }
</div>

<div class="toast" id="toast"></div>
<script>
const CSRF='${tok}';
function toast(msg){
  const t=document.getElementById('toast');t.textContent=msg;
  t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3000);
}
async function api(url,body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':CSRF},body:JSON.stringify(body)});
  return r.json();
}
async function deact(uid){
  // Find session by userId
  const d=await api('/api/sessions/deactivate-by-user',{userId:uid});
  toast(d.message);if(d.success)setTimeout(()=>location.reload(),1500);
}
async function ban(phone){
  const reason=prompt('Ban reason (optional):');
  if(reason===null)return;
  const d=await api('/api/ban',{phoneNumber:phone,reason:reason||'Banned by admin'});
  toast(d.message);if(d.success)setTimeout(()=>location.reload(),1500);
}
setInterval(()=>fetch('/api/ping',{cache:'no-store'}).catch(()=>{}),10000);

// Live session polling — updates table every 5s without full reload
async function pollSessions(){
  try{
    const d=await(await fetch('/admin/api/sessions-live',{cache:'no-store'})).json();
    if(!d.success)return;
    const tbody=document.getElementById('tbody');
    if(!tbody)return;
    // Add any new rows that don't exist yet
    d.rows.forEach(r=>{
      const existing=document.querySelector('[data-sid="'+r.sessionId+'"]');
      if(!existing){
        // New session — flash the table indicator and reload to show it
        const dot=document.getElementById('liveDot');
        if(dot){dot.style.background='#34d399';setTimeout(()=>dot.style.background='#f87171',2000);}
        setTimeout(()=>location.reload(),800);
      } else {
        // Update online status dot
        const onlineDot=existing.querySelector('.online-dot');
        if(onlineDot) onlineDot.style.background=r.online?'#34d399':'rgba(255,255,255,.15)';
      }
    });
    // Update inactive panel count badge
    const inactiveCount=d.rows.filter(r=>!r.active).length;
    const badge=document.getElementById('inactiveBadge');
    if(badge) badge.textContent=inactiveCount;
  }catch(_){}
}
setInterval(pollSessions,5000);
</script>
</body></html>`);
});

// Live sessions API — polled every 5s by the sessions page
router.get('/api/sessions-live', requireAdmin, (req, res) => {
  try {
    const records = ss.getAll();
    const live    = getAllSessions();
    const rows    = Object.values(records).map(r => ({
      sessionId:   r.sessionId,
      phoneNumber: r.phoneNumber,
      userId:      r.userId,
      active:      r.active,
      createdAt:   r.createdAt,
      online:      live.some(s => s.userId === r.userId && s.isActive),
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, rows });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/sessions', requireAdmin, (req, res) => {
  const tok     = csrfGenerate(req);
  const records = ss.getAll();
  const live    = getAllSessions();
  const rows    = records.map(r => ({
    ...r,
    online: live.some(s => s.userId === r.userId && s.isActive),
  })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total    = rows.length;
  const online   = rows.filter(r => r.active && r.online).length;
  const active   = rows.filter(r => r.active && !r.online).length;
  const inactive = rows.filter(r => !r.active).length;

  const inactiveRows = rows.filter(r => !r.active).map(r => {
    const dt  = new Date(r.createdAt).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    const sid = r.sessionId, ph = r.phoneNumber;
    return `<tr>
      <td style="padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07);color:rgba(248,113,113,.8);font-family:monospace;font-weight:700">+${ph}</td>
      <td style="padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07)">
        <span class="sid" style="cursor:pointer" onclick="copySid('${sid}',this)" title="Click to copy">${sid}</span>
      </td>
      <td style="padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07);color:rgba(239,68,68,.4);font-size:.74rem">${dt}</td>
      <td style="padding:9px 10px;border-bottom:1px solid rgba(239,68,68,.07)">
        <button class="btn bg" onclick="activate('${sid}')">&#x26A1; Activate</button>
        <button class="btn br" onclick="del('${sid}')" style="padding:8px 10px;margin-left:4px">&#x1F5D1;</button>
      </td>
    </tr>`;
  }).join('');

  const allRows = rows.map(r => {
    const badge = r.online
      ? '<span class="badge bon">&#x1F7E2; ONLINE</span>'
      : r.active
        ? '<span class="badge bact">&#x1F7E1; Active</span>'
        : '<span class="badge boff">&#x1F534; Pending</span>';
    const dt = new Date(r.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const actionBtn = !r.active
      ? `<button class="btn bg" onclick="activate('${r.sessionId}')">&#x26A1; Activate</button>`
      : `<button class="btn br" onclick="deactivate('${r.sessionId}')">&#x1F512; Off</button>`;
    return `<tr data-q="${r.sessionId} ${r.phoneNumber} ${r.note||''}" data-sid="${r.sessionId}">
      <td class="sid" onclick="copySid('${r.sessionId}',this)" style="cursor:pointer" title="Click to copy">${r.sessionId}</td>
      <td class="ph">+${r.phoneNumber}</td>
      <td>${badge}</td>
      <td><input class="ni" value="${r.note||''}" placeholder="Add note..." onchange="saveNote('${r.sessionId}',this.value)"></td>
      <td style="color:rgba(212,175,55,.35);font-size:.74rem">${dt}</td>
      <td class="acts">
        ${actionBtn}
        <button class="btn br" onclick="del('${r.sessionId}')" style="padding:8px 10px">&#x1F5D1;</button>
      </td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASTRA-X Sessions</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#0a0700;color:#f5d060;min-height:100vh;padding:20px 16px 40px}
h1{font-size:1.5rem;font-weight:900;background:linear-gradient(90deg,#b87333,#d4af37,#f5d060);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.sub{color:rgba(212,175,55,.4);font-size:.8rem;margin-bottom:18px}
.back{color:#2dd4bf;text-decoration:none;font-size:.84rem;display:inline-block;margin-bottom:14px}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.stat{background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.2);border-radius:12px;padding:12px 16px;text-align:center;min-width:80px}
.sn{font-size:1.5rem;font-weight:900;color:#f5d060}.sl{font-size:.68rem;color:rgba(212,175,55,.45);text-transform:uppercase;letter-spacing:1px}
.section{background:rgba(212,175,55,.04);border:1.5px solid rgba(212,175,55,.15);border-radius:14px;padding:14px 16px;margin-bottom:14px}
.sec-title{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.manual{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.manual input{flex:1;min-width:180px;padding:9px 12px;background:rgba(52,211,153,.07);border:1.5px solid rgba(52,211,153,.25);border-radius:8px;color:#34d399;font-size:.88rem;outline:none;text-transform:uppercase}
.manual input::placeholder{text-transform:none;color:rgba(52,211,153,.3)}
.search{width:100%;padding:9px 14px;background:rgba(212,175,55,.06);border:1.5px solid rgba(212,175,55,.2);border-radius:10px;color:#f5d060;font-size:.88rem;outline:none;margin-bottom:12px}
.btn{padding:8px 14px;border:none;border-radius:8px;font-weight:700;font-size:.82rem;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
.bg{background:rgba(52,211,153,.15);border:1.5px solid rgba(52,211,153,.35);color:#34d399}.bg:hover{background:rgba(52,211,153,.28);transform:translateY(-1px)}
.br{background:rgba(239,68,68,.12);border:1.5px solid rgba(239,68,68,.3);color:#f87171}.br:hover{background:rgba(239,68,68,.22);transform:translateY(-1px)}
.bgold{background:linear-gradient(90deg,#92701a,#d4af37);color:#0a0700;border:none}.bgold:hover{opacity:.88}
.bb{background:rgba(59,130,246,.15);border:1.5px solid rgba(59,130,246,.35);color:#93c5fd}.bb:hover{background:rgba(59,130,246,.25)}
table{width:100%;border-collapse:collapse;font-size:.82rem}
th{text-align:left;padding:10px;color:rgba(212,175,55,.45);font-size:.68rem;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(212,175,55,.12)}
td{padding:10px;border-bottom:1px solid rgba(212,175,55,.07);vertical-align:middle}
tr:hover td{background:rgba(212,175,55,.03)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:.72rem;font-weight:700}
.bon{background:rgba(52,211,153,.15);color:#34d399;border:1px solid rgba(52,211,153,.3)}
.bact{background:rgba(212,175,55,.12);color:#d4af37;border:1px solid rgba(212,175,55,.25)}
.boff{background:rgba(239,68,68,.1);color:#f87171;border:1px solid rgba(239,68,68,.22)}
.sid{font-family:monospace;font-weight:700;color:#f5d060;letter-spacing:1px;font-size:.86rem;transition:color .2s}
.sid:hover{color:#34d399}
.ph{color:rgba(212,175,55,.65)}
.acts{display:flex;gap:5px;flex-wrap:wrap}
.ni{background:rgba(212,175,55,.05);border:1px solid rgba(212,175,55,.12);border-radius:6px;color:rgba(212,175,55,.65);padding:4px 8px;font-size:.74rem;width:110px;outline:none}
.ni:focus{border-color:rgba(212,175,55,.4);background:rgba(212,175,55,.09)}
.toast{position:fixed;bottom:20px;right:20px;left:20px;max-width:380px;margin:0 auto;background:#1a1200;border:1px solid rgba(212,175,55,.4);color:#f5d060;padding:12px 18px;border-radius:10px;font-size:.84rem;font-weight:600;opacity:0;transition:opacity .3s;z-index:9999;pointer-events:none;text-align:center}
.toast.show{opacity:1}
.empty{text-align:center;color:rgba(212,175,55,.3);padding:40px;font-size:.9rem}
.phone-search-input{flex:1;min-width:180px;padding:9px 12px;background:rgba(59,130,246,.07);border:1.5px solid rgba(59,130,246,.25);border-radius:8px;color:#93c5fd;font-size:.88rem;outline:none}
@media(max-width:600px){.sid{font-size:.72rem}.acts{flex-direction:column}th:nth-child(4),td:nth-child(4){display:none}}
</style></head><body>
<a class="back" href="/admin/dashboard">&#x2190; Back</a>
<h1>&#x1F511; Session Manager</h1>
<p class="sub">Manage ASTRA-X user sessions — activate, deactivate, track users</p>

<!-- STATS -->
<div class="stats">
  <div class="stat"><div class="sn">${total}</div><div class="sl">Total</div></div>
  <div class="stat"><div class="sn" style="color:#34d399">${online}</div><div class="sl">Online</div></div>
  <div class="stat"><div class="sn" style="color:#d4af37">${active}</div><div class="sl">Active</div></div>
  <div class="stat"><div class="sn" style="color:#f87171">${inactive}</div><div class="sl">Pending</div></div>
</div>

<!-- PHONE SEARCH -->
<div class="section" style="border-color:rgba(59,130,246,.25)">
  <div class="sec-title" style="color:rgba(59,130,246,.7)">&#x1F50D; Search by Phone Number</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <input type="tel" id="phoneInput" class="phone-search-input" placeholder="e.g. 256747304196"
      oninput="this.value=this.value.replace(/[^\\d]/g,'')"
      onkeydown="if(event.key==='Enter')doPhoneSearch()">
    <button class="btn bb" onclick="doPhoneSearch()">&#x1F50D; Search</button>
  </div>
  <div id="phoneResult" style="display:none;margin-top:12px;padding:12px 14px;border-radius:10px;font-size:.83rem;line-height:1.9"></div>
</div>

<!-- MANUAL ACTIVATE -->
<div class="section" style="border-color:rgba(52,211,153,.2)">
  <div class="sec-title" style="color:rgba(52,211,153,.6)">&#x26A1; Quick Activate / Deactivate by Session ID</div>
  <div class="manual">
    <input type="text" id="manualId" placeholder="ASTRAX-XXXXXXXX">
    <button class="btn bgold" onclick="activateManual()">&#x26A1; Activate</button>
    <button class="btn br" onclick="deactivateManual()">&#x1F512; Deactivate</button>
    <button class="btn br" style="border-color:rgba(239,68,68,.5)" onclick="deleteManual()">&#x1F5D1; Delete</button>
  </div>
</div>

<!-- INACTIVE SESSIONS PANEL -->
${inactive > 0 ? `<div class="section" style="border-color:rgba(239,68,68,.25)">
  <div class="sec-title" style="color:#f87171">&#x1F534; Pending Activation (${inactive})
    <button onclick="document.getElementById('inactiveContent').style.display=document.getElementById('inactiveContent').style.display==='none'?'block':'none'"
      style="background:none;border:1px solid rgba(239,68,68,.3);color:#f87171;border-radius:6px;padding:3px 10px;font-size:.72rem;cursor:pointer;margin-left:auto">Toggle</button>
  </div>
  <div id="inactiveContent">
    <div style="overflow-x:auto">
    <table>
      <thead><tr>
        <th style="color:rgba(239,68,68,.4)">Phone</th>
        <th style="color:rgba(239,68,68,.4)">Session ID</th>
        <th style="color:rgba(239,68,68,.4)">Paired On</th>
        <th style="color:rgba(239,68,68,.4)">Actions</th>
      </tr></thead>
      <tbody>${inactiveRows}</tbody>
    </table>
    </div>
  </div>
</div>` : ''}

<!-- SEARCH BAR -->
<input class="search" placeholder="&#x1F50D; Search by number, session ID or note..." oninput="filterRows(this.value)">

<!-- MAIN TABLE -->
${rows.length === 0
  ? '<div class="empty">No sessions yet. Users appear here after pairing.</div>'
  : `<div style="overflow-x:auto"><table><thead><tr>
      <th>Session ID</th><th>Phone</th><th>Status</th><th>Note</th><th>Created</th><th>Actions</th>
    </tr></thead><tbody id="tbody">${allRows}</tbody></table></div>`
}

<div class="toast" id="toast"></div>

<script>
const CSRF='${tok}';

function toast(msg,ok=true){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.borderColor=ok?'rgba(52,211,153,.4)':'rgba(239,68,68,.4)';
  t.style.color=ok?'#34d399':'#f87171';
  t.classList.add('show');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('show'),3000);
}

async function api(url,body){
  try{
    const r=await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json','X-CSRF-Token':CSRF},
      body:JSON.stringify(body)
    });
    const d=await r.json();
    return d;
  }catch(e){return{success:false,message:'Network error: '+e.message};}
}

function getSid(raw){ return (raw||'').trim().toUpperCase(); }

async function activate(sid){
  sid=getSid(sid); if(!sid)return toast('Enter a Session ID',false);
  toast('Activating '+sid+'...');
  const d=await api('/api/sessions/activate',{sessionId:sid});
  toast(d.message||(d.success?'Activated!':'Failed'),d.success);
  if(d.success)setTimeout(()=>location.reload(),2000);
}

async function deactivate(sid){
  sid=getSid(sid); if(!sid)return toast('Enter a Session ID',false);
  if(!confirm('Deactivate '+sid+'? Bot will go OFFLINE for this user.'))return;
  const d=await api('/api/sessions/deactivate',{sessionId:sid});
  toast(d.message||(d.success?'Deactivated!':'Failed'),d.success);
  if(d.success)setTimeout(()=>location.reload(),2000);
}

async function del(sid){
  sid=getSid(sid); if(!sid)return toast('Enter a Session ID',false);
  if(!confirm('Permanently delete '+sid+'? This cannot be undone.'))return;
  const d=await api('/api/sessions/delete',{sessionId:sid});
  toast(d.message||(d.success?'Deleted!':'Failed'),d.success);
  if(d.success)setTimeout(()=>location.reload(),1500);
}

async function saveNote(sid,val){
  await api('/api/sessions/note',{sessionId:sid,note:val});
  toast('Note saved ✓',true);
}

function activateManual(){   activate(document.getElementById('manualId').value); }
function deactivateManual(){ deactivate(document.getElementById('manualId').value); }
function deleteManual(){     del(document.getElementById('manualId').value); }

function filterRows(q){
  q=q.toLowerCase();
  document.querySelectorAll('#tbody tr').forEach(tr=>{
    tr.style.display=tr.dataset.q.toLowerCase().includes(q)?'':'none';
  });
}

function copySid(sid,el){
  navigator.clipboard.writeText(sid).catch(()=>{
    const ta=document.createElement('textarea');
    ta.value=sid;ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);
  });
  const orig=el?el.textContent:sid;
  if(el){el.textContent='✅ Copied!';el.style.color='#34d399';setTimeout(()=>{el.textContent=orig;el.style.color='';},2000);}
  toast('Session ID copied!',true);
}

async function doPhoneSearch(){
  const num=document.getElementById('phoneInput').value.replace(/\\D/g,'').trim();
  const res=document.getElementById('phoneResult');
  res.style.display='none';
  if(!num||num.length<7){toast('Enter a valid phone number',false);return;}
  toast('Searching...');
  const d=await api('/admin/api/lookup-session',{phoneNumber:num});
  if(d.success){
    const sc=d.active?'#34d399':'#f87171';
    const sl=d.active?'✅ ACTIVE':'⏳ INACTIVE';
    res.innerHTML=
      '📱 <b>Phone:</b> +'+d.phoneNumber+'<br>'+
      '🔑 <b>Session ID:</b> <span style="font-family:monospace;font-weight:900;color:#f5d060;cursor:pointer" onclick="copySid(\''+d.sessionId+'\',null)">'+d.sessionId+'</span> <button onclick="copySid(\''+d.sessionId+'\',null)" class="btn bgold" style="font-size:.72rem;padding:4px 10px">📋 Copy</button><br>'+
      '🟢 <b>Status:</b> <span style="color:'+sc+'">'+sl+'</span><br>'+
      '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">'+
      (!d.active?'<button onclick="activate(\''+d.sessionId+'\')" class="btn bg" style="font-size:.78rem;padding:6px 12px">⚡ Activate</button>':'')+
      '<button onclick="deactivate(\''+d.sessionId+'\')" class="btn br" style="font-size:.78rem;padding:6px 12px">🔒 Deactivate</button>'+
      '<button onclick="del(\''+d.sessionId+'\')" class="btn br" style="font-size:.78rem;padding:6px 12px;border-color:rgba(239,68,68,.6)">🗑️ Delete</button>'+
      '</div>';
    res.style.cssText='display:block;padding:14px 16px;border-radius:10px;background:rgba(52,211,153,.04);border:1.5px solid rgba(52,211,153,.2);color:rgba(245,208,96,.9);font-size:.83rem;line-height:2';
  }else{
    res.innerHTML='❌ '+( d.message||'Not found');
    res.style.cssText='display:block;padding:12px 14px;border-radius:10px;background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.22);color:#f87171;font-size:.83rem';
  }
}

setInterval(()=>fetch('/api/ping',{cache:'no-store'}).catch(()=>{}),10000);
setInterval(()=>location.reload(),30000);
</script>
</body></html>`);
});


router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    const sessions    = getAllSessions();
    const restricted  = getRestrictedUsers();
    const active      = sessions.filter(s => s.isActive).length;
    const statData    = stats.getStats();
    const tok         = csrfGenerate(req);
    const mem         = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const up          = process.uptime();
    const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=Math.floor(up%60);

    const sessionRows = sessions.length ? sessions.map((s, i) => `
      <tr>
        <td style="font-size:.75rem;color:#64748b">${i+1}</td>
        <td style="font-size:.75rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${sanitize(s.userId)}</td>
        <td><strong>${sanitize(s.phoneNumber)}</strong></td>
        <td><span class="badge ${s.isActive ? 'badge-on' : 'badge-off'}">${s.isActive ? '🟢 Active' : '🔴 Offline'}</span></td>
        <td><span class="chip">${sanitize(s.prefix || '!')}</span></td>
        <td style="font-size:.75rem;color:#64748b">${s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</td>
        <td>
          <div class="actions">
            <button class="btn btn-red"    onclick="banUser('${sanitize(s.userId)}')">🔨 Ban</button>
            <button class="btn btn-yellow" onclick="restrictUser('${sanitize(s.userId)}')">🚫 Restrict</button>
            <button class="btn btn-blue"   onclick="deleteUser('${sanitize(s.userId)}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>`).join('') : `<tr><td colspan="7" style="text-align:center;padding:30px;color:#374151">No connected users</td></tr>`;

    const restrictedRows = restricted.length ? restricted.map((u, i) => `
      <tr>
        <td>${i+1}</td>
        <td style="font-size:.78rem">${sanitize(u.userId)}</td>
        <td>${sanitize(u.reason || '—')}</td>
        <td style="font-size:.75rem;color:#64748b">${u.restrictedAt ? new Date(u.restrictedAt).toLocaleString() : '—'}</td>
        <td><button class="btn btn-green" onclick="unrestrictUser('${sanitize(u.userId)}')">✅ Unrestrict</button></td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align:center;padding:24px;color:#374151">No restricted users</td></tr>`;

    const cmdRows = statData.commands.slice(0, 15).map((c, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong>!${sanitize(c.name)}</strong></td>
        <td>${c.uses}</td>
        <td style="color:${c.errors > 0 ? '#ef4444' : '#64748b'}">${c.errors}</td>
        <td style="font-size:.75rem;color:#64748b">${c.lastUsed ? new Date(c.lastUsed).toLocaleTimeString() : '—'}</td>
      </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;padding:24px;color:#374151">No commands run yet</td></tr>`;

    res.send(page('Dashboard', `
    <meta name="csrf-token" content="${tok}">
    <nav class="nav">
      <span class="nav-brand">🔐 ASTRA-X Admin v6.6.6</span>
      <div class="nav-links">
        <a href="/">📱 Pairing</a>
        <a href="/health">💊 Health</a>
        <a href="/api/health/json">📊 API</a>
        <span class="conn-badge" id="connBadge"><span class="conn-dot" id="connDot"></span><span id="connText">Connected</span></span>
        <a href="/admin/sessions" style="color:#34d399!important;font-weight:700">&#x1F511; Sessions</a>
        <a href="/admin/sub-admins" style="color:#a78bfa!important;font-weight:700">&#x1F464; Sub-Admins</a>
        <a href="/admin/banned" style="color:#f87171!important;font-weight:700">&#x1F6AB; Banned</a>
        <a href="/admin/activated" style="color:#34d399!important;font-weight:700">&#x1F7E2; Activated</a>
        <a href="/admin/sub-admins" style="color:#a78bfa!important;font-weight:700">&#x1F464; Sub-Admins</a>
        <a href="/admin/banned" style="color:#f87171!important;font-weight:700">&#x1F6AB; Banned</a>
        <a href="/admin/activated" style="color:#34d399!important;font-weight:700">&#x1F7E2; Activated</a>
        <a href="/admin/logout" style="color:#ef4444!important">⬅️ Logout</a>
      </div>
    </nav>
    <div class="wrap">

      <div class="stats">
        <div class="stat">
          <div class="stat-n" id="stat-total" style="background:linear-gradient(90deg,#25d366,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${sessions.length}</div>
          <div class="stat-l">Total Users</div>
        </div>
        <div class="stat">
          <div class="stat-n" id="stat-active" style="background:linear-gradient(90deg,#3b82f6,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${active}</div>
          <div class="stat-l">Active Sessions</div>
        </div>
        <div class="stat">
          <div class="stat-n" id="stat-msgs" style="background:linear-gradient(90deg,#8b5cf6,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${statData.totalMessages}</div>
          <div class="stat-l">Messages</div>
        </div>
        <div class="stat">
          <div class="stat-n" id="stat-cmds" style="background:linear-gradient(90deg,#06b6d4,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${statData.commands.reduce((a,c)=>a+c.uses,0)}</div>
          <div class="stat-l">Commands Run</div>
        </div>
        <div class="stat">
          <div class="stat-n" id="stat-ram" style="background:linear-gradient(90deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${mem}</div>
          <div class="stat-l">RAM (MB)</div>
        </div>
        <div class="stat">
          <div class="stat-n" id="stat-uptime" style="background:linear-gradient(90deg,#ef4444,#f87171);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${h}h ${m}m</div>
          <div class="stat-l">Uptime</div>
        </div>
        <div class="stat">
          <div class="stat-n" style="background:linear-gradient(90deg,#ec4899,#f472b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${restricted.length}</div>
          <div class="stat-l">Restricted</div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">👥 Connected Users <span style="color:#64748b;font-weight:400;font-size:.8rem">(${sessions.length} total)</span></div>
        <div style="overflow-x:auto">
          <table>
            <thead><tr><th>#</th><th>User ID</th><th>Phone</th><th>Status</th><th>Prefix</th><th>Connected</th><th>Actions</th></tr></thead>
            <tbody id="session-tbody">${sessionRows}</tbody>
          </table>
        </div>
      </div>

      <div class="grid2">
        <div class="sec">
          <div class="sec-title">➕ Add User</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <input type="text" id="addPhone" placeholder="Phone with country code e.g. 256747304196">
            <button class="btn-submit" onclick="addUser()">Add User</button>
          </div>
        </div>
        <div class="sec">
          <div class="sec-title">📢 Broadcast Message</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <textarea id="broadcastMsg" placeholder="Message to send to all connected users..."></textarea>
            <button class="btn-submit" onclick="broadcast()">📤 Send to All</button>
          </div>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">📊 Command Usage — Live <span style="font-size:.75rem;font-weight:400;color:#64748b">(top 15)</span></div>
        <div style="overflow-x:auto">
          <table>
            <thead><tr><th>#</th><th>Command</th><th>Uses</th><th>Errors</th><th>Last Used</th></tr></thead>
            <tbody id="cmd-tbody">${cmdRows}</tbody>
          </table>
        </div>
      </div>

      <div class="sec">
        <div class="sec-title">🚫 Restricted / Banned Users</div>
        <div style="overflow-x:auto">
          <table>
            <thead><tr><th>#</th><th>User ID</th><th>Reason</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>${restrictedRows}</tbody>
          </table>
        </div>
      </div>

    </div>

    <script>
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

    async function api(url, body) {
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
          body: JSON.stringify(body),
        });
        return await r.json();
      } catch(e) { return { success: false, message: e.message }; }
    }

    async function banUser(userId) {
      if (!confirm('⛔ BAN this user? They will be restricted and session deleted.')) return;
      const reason = prompt('Ban reason (optional):') || 'Banned by admin';
      const d = await api('/api/admin/ban-user', { userId, reason });
      alert(d.message || (d.success ? '✅ Banned' : '❌ Failed'));
      if (d.success) location.reload();
    }
    async function deleteUser(userId) {
      if (!confirm('Delete this session?')) return;
      const d = await api('/api/admin/delete-user', { userId });
      alert(d.message);
      if (d.success) location.reload();
    }
    async function restrictUser(userId) {
      const reason = prompt('Restriction reason:');
      if (reason === null) return;
      const d = await api('/api/admin/restrict-user', { userId, reason: reason || 'Restricted' });
      alert(d.message);
      if (d.success) location.reload();
    }
    async function unrestrictUser(userId) {
      if (!confirm('Unrestrict this user?')) return;
      const d = await api('/api/admin/unrestrict-user', { userId });
      alert(d.message);
      if (d.success) location.reload();
    }
    async function addUser() {
      const phone = document.getElementById('addPhone').value.trim();
      if (!phone) return alert('Enter a phone number');
      const d = await api('/api/admin/add-user', { phoneNumber: phone });
      alert(d.message);
      if (d.success) location.reload();
    }
    async function broadcast() {
      const msg = document.getElementById('broadcastMsg').value.trim();
      if (!msg) return alert('Enter a message');
      if (!confirm('Send to ALL connected users?')) return;
      const d = await api('/api/admin/broadcast', { message: msg });
      alert(d.message);
    }

    // ── Live stats via SSE ────────────────────────────────────────────────
    const es = new EventSource('/admin/stats-stream');
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        const el = (id) => document.getElementById(id);
        if (el('stat-total'))  el('stat-total').textContent  = d.total;
        if (el('stat-active')) el('stat-active').textContent = d.active;
        if (el('stat-msgs'))   el('stat-msgs').textContent   = d.totalMessages;
        if (el('stat-cmds'))   el('stat-cmds').textContent   = d.totalCmds;
        if (el('stat-ram'))    el('stat-ram').textContent    = d.ram + ' MB';
        if (el('stat-uptime')) el('stat-uptime').textContent = d.uptimeStr;
        if (el('cmd-tbody') && d.commands && d.commands.length) {
          el('cmd-tbody').innerHTML = d.commands.slice(0,15).map(function(c,i) {
            return '<tr><td>' + (i+1) + '</td><td><strong>!' + c.name + '</strong></td><td>' + c.uses + '</td>' +
              '<td style="color:' + (c.errors > 0 ? '#ef4444' : '#64748b') + '">' + c.errors + '</td>' +
              '<td style="font-size:.75rem;color:#64748b">' + (c.lastUsed ? new Date(c.lastUsed).toLocaleTimeString() : '—') + '</td></tr>';
          }).join('');
        }
      } catch(_) {}
    };
    es.onerror = () => {};
    </script>`));
  } catch (err) {
    logger.error('Dashboard render error:', err.message);
    res.status(500).send(errorPage('Server Error', err.message));
  }
});

// ── SSE stats stream ──────────────────────────────────────────────────────
router.get('/stats-stream', requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  function send() {
    try {
      const sessions = getAllSessions();
      const st       = stats.getStats();
      const mem      = process.memoryUsage();
      const up       = Math.floor(process.uptime());
      const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=up%60;
      const payload  = JSON.stringify({
        total:         sessions.length,
        active:        sessions.filter(s => s.isActive).length,
        totalMessages: st.totalMessages,
        totalCmds:     st.commands.reduce((a,c)=>a+c.uses,0),
        ram:           (mem.heapUsed/1024/1024).toFixed(1),
        uptime:        up,
        uptimeStr:     h + 'h ' + m + 'm ' + s + 's',
        commands:      st.commands,
      });
      res.write('data: ' + payload + '\n\n');
    } catch (_) {}
  }

  send();
  const iv = setInterval(send, 5000);
  req.on('close', () => clearInterval(iv));
});

// ── Admin POST actions (with CSRF) ────────────────────────────────────────
const requireAdminAPI = (req, res, next) =>
  req.session?.adminAuth ? next() : res.status(401).json({ success: false, message: 'Unauthorized' });

router.post('/dashboard/delete',     csrfCheck, requireAdmin, (req, res) => { deleteSession(req.body.userId); res.redirect('/admin/dashboard'); });
router.post('/dashboard/ban',        csrfCheck, requireAdmin, (req, res) => { addRestrictedUser(req.body.userId, req.body.reason||'Banned'); deleteSession(req.body.userId); res.redirect('/admin/dashboard'); });
router.post('/dashboard/unrestrict', csrfCheck, requireAdmin, (req, res) => { removeRestrictedUser(req.body.userId); res.redirect('/admin/dashboard'); });


// ── Admin/Owner only: search session by phone number ──────────────────────────
router.post('/api/lookup-session', requireAdmin, (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'phoneNumber required' });
    const clean = String(phoneNumber).replace(/\D/g, '');
    if (clean.length < 7) return res.status(400).json({ success: false, message: '❌ Invalid phone number' });
    const all     = ss.getAll();
    const matches = all
      .filter(r => r.phoneNumber === clean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!matches.length) {
      return res.status(404).json({ success: false, message: '❌ No session found for +' + clean + '. They need to pair first.' });
    }
    const record = matches[0];
    return res.json({
      success:     true,
      sessionId:   record.sessionId,
      userId:      record.userId,
      phoneNumber: record.phoneNumber,
      active:      record.active,
      activatedAt: record.activatedAt || null,
      expiresAt:   record.expiresAt   || null,
      createdAt:   record.createdAt,
      note:        record.note || '',
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;

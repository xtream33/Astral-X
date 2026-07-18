'use strict';
require('dotenv').config();
const express  = require('express');
const session  = require('express-session');
const path     = require('path');
const fs       = require('fs');
const logger   = require('./utils/logger');
const { validateEnv } = require('./utils/env');
validateEnv();   // ← warn about missing / default env vars at startup
const adminRoutes = require('./routes/admin');
const {
  startSession, cancelSession, getSession, deleteSession,
  getAllSessions, getAvailableCommands, restoreAllSessions,
} = require('./utils/socket');
const {
  isUserRestricted, addRestrictedUser, removeRestrictedUser,
} = require('./utils/restrictions');
const { startChannelCheck } = require('./tasks/channelCheck');
const ss            = require('./utils/sessionStore');
const userStore     = require('./utils/userStore');
const subAdminStore = require('./utils/subAdminStore');
const subRoutes     = require('./routes/sub');
const rateLimiter = require('./utils/ratelimit');

const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'astrax_secret_key_2024',  // must match config.js default
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true },
}));

// ── Request logger ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const t = Date.now();
  res.on('finish', () => {
    const ms   = Date.now() - t;
    const icon = res.statusCode >= 500 ? '🔴' : res.statusCode >= 400 ? '🟡' : '🟢';
    logger.info(`${icon} ${req.method} ${req.path} ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ══════════════════════════════════════════════════════════════════════════
// PAIRING PAGE  →  localhost:3000
// ══════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  const htmlFile = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(htmlFile)) return res.sendFile(htmlFile);

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ASTRA-X Bot — Connect</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#060d14;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:#e2e8f0;padding:20px}
.logo{width:220px;height:220px;object-fit:contain;border-radius:20px;
  margin-bottom:12px;filter:drop-shadow(0 0 30px rgba(37,211,102,.5))}
.card{background:rgba(11,18,30,.97);border:1px solid rgba(37,211,102,.2);
  border-radius:20px;padding:28px 24px;width:100%;max-width:440px;text-align:center}
h1{font-size:1.5rem;font-weight:900;margin-bottom:4px;
  background:linear-gradient(90deg,#25d366,#3b82f6,#8b5cf6);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
p{color:#64748b;font-size:.88rem;margin-bottom:22px}
input{width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);
  border-radius:10px;color:#e2e8f0;padding:13px 16px;font-size:1rem;margin-bottom:12px;outline:none}
input:focus{border-color:#25d366}
button{width:100%;background:linear-gradient(135deg,#25d366,#3b82f6);color:#fff;
  border:none;border-radius:10px;padding:14px;font-size:1rem;font-weight:700;cursor:pointer}
button:hover{opacity:.88}button:disabled{opacity:.5;cursor:not-allowed}
.reset-btn{background:rgba(255,255,255,.06);color:#94a3b8;margin-top:8px;font-size:.9rem}
.code-box{background:#0f1a2e;border:2px solid #25d366;border-radius:14px;padding:22px;
  margin-top:18px;letter-spacing:8px;font-size:2.2rem;font-weight:900;color:#25d366;
  cursor:pointer;user-select:all;font-family:monospace}
.code-box:hover{background:#0a1220}
.steps{text-align:left;margin-top:18px;font-size:.82rem;color:#94a3b8;line-height:2}
.steps b{color:#25d366}.steps span{color:#64748b;font-size:.75rem}
.status{font-size:.85rem;margin-top:12px;padding:10px 14px;border-radius:8px;display:none}
.ok{background:rgba(37,211,102,.1);color:#25d366;border:1px solid rgba(37,211,102,.3)}
.err{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.3)}
.links{display:flex;gap:10px;margin-top:18px;justify-content:center}
.links a{font-size:.78rem;color:#3b82f6;text-decoration:none;
  background:rgba(59,130,246,.1);padding:6px 14px;border-radius:8px}
</style></head><body>
<img src="/Astralogo.png" alt="ASTRA-X" class="logo" onerror="this.style.display='none'">
<div class="card">
  <h1>ASTRA-X Bot</h1>
  <p>Enter your WhatsApp number to get a pairing code</p>
  <input id="phone" type="tel" placeholder="256747304196 (country code, no +)">
  <button id="btn" onclick="pair()">🔗 Get Pairing Code</button>
  <button class="reset-btn" onclick="reset()">🔄 Reset</button>
  <div id="status" class="status"></div>
  <div id="codeBox" class="code-box" style="display:none" onclick="copy()" title="Tap to copy"></div>
  <div id="steps" class="steps" style="display:none">
    <b>How to link on your phone:</b><br>
    1. Open WhatsApp → tap ⋮ Menu<br>
    2. Tap <b>Linked Devices</b><br>
    3. Tap <b>Link a Device</b><br>
    4. Tap <b>Link with phone number instead</b><br>
    5. Enter the code above<br>
    <span>Code expires in 5 minutes. Tap to copy.</span>
  </div>
  <div class="links">
    <a href="/admin">🔐 Admin</a>
    <a href="/health">💊 Health</a>
  </div>
</div>
<script>
let currentUserId = null;
async function pair() {
  const phone = document.getElementById('phone').value.trim().replace(/\\D/g,'');
  if (!phone || phone.length < 7) return show('❌ Enter a valid phone number','err');
  document.getElementById('btn').disabled = true;
  document.getElementById('btn').textContent = '⏳ Generating...';
  show('⏳ Connecting to WhatsApp...','ok');
  try {
    const r = await fetch('/api/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phoneNumber:phone})});
    const d = await r.json();
    if (d.success && d.code) {
      currentUserId = d.userId;
      show('✅ Code ready! Enter it in WhatsApp within 5 minutes.','ok');
      document.getElementById('codeBox').textContent = d.code;
      document.getElementById('codeBox').style.display = 'block';
      document.getElementById('steps').style.display = 'block';
      document.getElementById('btn').textContent = '🔗 Get New Code';
      document.getElementById('btn').disabled = false;
    } else {
      show('❌ '+(d.message||'Failed. Try again.'),'err');
      document.getElementById('btn').textContent = '🔗 Get Pairing Code';
      document.getElementById('btn').disabled = false;
    }
  } catch(e) {
    show('❌ Network error. Is the bot running?','err');
    document.getElementById('btn').textContent = '🔗 Get Pairing Code';
    document.getElementById('btn').disabled = false;
  }
}
async function reset() {
  if (currentUserId) await fetch('/api/pair/reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:currentUserId})}).catch(()=>{});
  document.getElementById('codeBox').style.display = 'none';
  document.getElementById('steps').style.display = 'none';
  document.getElementById('status').style.display = 'none';
  document.getElementById('btn').textContent = '🔗 Get Pairing Code';
  document.getElementById('btn').disabled = false;
  currentUserId = null;
}
function show(msg,type){const s=document.getElementById('status');s.textContent=msg;s.className='status '+type;s.style.display='block';}
function copy(){const c=document.getElementById('codeBox').textContent;navigator.clipboard?.writeText(c).then(()=>show('📋 Code copied!','ok'));}
document.getElementById('phone').addEventListener('keypress',e=>{if(e.key==='Enter')pair();});
</script></body></html>`);
});
;

// ══════════════════════════════════════════════════════════════════════════
// HEALTH PAGE  →  localhost:3000/health
// ══════════════════════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
  const htmlFile = path.join(__dirname, '../public/health.html');
  if (fs.existsSync(htmlFile)) return res.sendFile(htmlFile);

  // Fallback inline health page
  const sessions = getAllSessions();
  const active   = sessions.filter(s => s.isActive).length;
  const mem      = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
  const up       = Math.floor(process.uptime());
  const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=up%60;

  res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="15">
<title>ASTRA-X Health</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',sans-serif;background:#060d14;min-height:100vh;
  display:flex;flex-direction:column;align-items:center;justify-content:center;color:#e2e8f0;padding:20px}
h1{font-size:2rem;font-weight:900;margin-bottom:6px;
  background:linear-gradient(90deg,#25d366,#3b82f6);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;
  margin-top:24px;width:100%;max-width:600px}
.card{background:rgba(11,18,30,.97);border:1px solid rgba(37,211,102,.15);
  border-radius:14px;padding:20px;text-align:center}
.val{font-size:1.8rem;font-weight:900;
  background:linear-gradient(90deg,#25d366,#3b82f6);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.lbl{font-size:.72rem;color:#64748b;margin-top:4px;text-transform:uppercase}
.badge{display:inline-block;padding:6px 20px;border-radius:20px;font-size:.85rem;font-weight:700;
  background:rgba(37,211,102,.15);color:#25d366;border:1px solid rgba(37,211,102,.3);margin-bottom:8px}
a{color:#3b82f6;font-size:.85rem;margin-top:20px;display:block}
</style></head><body>
<span class="badge">🟢 ALIVE</span>
<h1>ASTRA-X Bot</h1>
<p style="color:#64748b;font-size:.85rem">Auto-refreshes every 15s</p>
<div class="grid">
  <div class="card"><div class="val">${sessions.length}</div><div class="lbl">Users</div></div>
  <div class="card"><div class="val">${active}</div><div class="lbl">Active</div></div>
  <div class="card"><div class="val">${mem}MB</div><div class="lbl">RAM</div></div>
  <div class="card"><div class="val">${h}h ${m}m ${s}s</div><div class="lbl">Uptime</div></div>
</div>
<a href="/">← Pairing Page</a>
<a href="/admin">🔐 Admin Panel</a>
</body></html>`);
});

// ══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════════════

// Health JSON
// Ping endpoint — always returns 200 quickly for keepalive
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Session base64 export — used by pairing page to show deployable session ──
app.get('/api/session-b64', (req, res) => {
  try {
    const { sid } = req.query;
    if (!sid) return res.json({ b64: null });
    const all    = ss.getAll();
    const record = Array.isArray(all)
      ? all.find(r => r.sessionId === sid)
      : Object.values(all).find(r => r.sessionId === sid);
    if (!record) return res.json({ b64: null });
    const credsPath = path.join(__dirname, '../sessions', record.userId, 'creds.json');
    if (!fs.existsSync(credsPath)) return res.json({ b64: null });
    const b64 = Buffer.from(fs.readFileSync(credsPath, 'utf-8')).toString('base64');
    res.json({ b64 });
  } catch (_) { res.json({ b64: null }); }
});

app.get('/api/health', (req, res) => {
  const mem = process.memoryUsage();
  const up  = Math.floor(process.uptime());
  const h=Math.floor(up/3600), m=Math.floor((up%3600)/60), s=up%60;
  const sessions = getAllSessions();
  res.json({
    success: true, status: 'alive',
    uptime: `${h}h ${m}m ${s}s`, uptime_s: up,
    sessions: sessions.length,
    active: sessions.filter(s => s.isActive).length,
    memory_mb: (mem.heapUsed/1024/1024).toFixed(1),
    node: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  });
});
// Alias
app.get('/api/health/json', (req, res) => res.redirect('/api/health'));

// Pair  — 5 requests per minute per IP
app.post('/api/pair', rateLimiter({ max: 5, window: 60, message: '⏳ Too many pairing requests. Please wait 60 seconds.' }), async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: '❌ Phone number required' });
    const clean = String(phoneNumber).replace(/\D/g, '');
    if (clean.length < 7) return res.status(400).json({ success: false, message: '❌ Invalid phone number' });
    const uid = userId || `user_${Date.now()}_${clean}`;
    if (isUserRestricted(uid)) return res.status(403).json({ success: false, message: '🚫 Account restricted' });

    // ── CRITICAL FIX: Register session IMMEDIATELY (inactive) before socket starts.
    //    This ensures the sessionId exists in the store right now, is returned in
    //    this response, appears in admin search instantly, and persists across restarts.
    //    The session stays inactive until an owner/admin explicitly activates it.
    const sessionId = ss.register(uid, clean);
    logger.info(`📱 Pair request: ${clean} → ${uid} | Session pre-registered: ${sessionId}`);

    const result = await startSession(uid, clean);
    if (result?.code) {
      return res.json({
        success:     true,
        code:        result.code,
        userId:      uid,
        phoneNumber: clean,
        sessionId,
        message:     '✅ Enter this code in WhatsApp → Linked Devices',
      });
    }
    return res.status(400).json({ success: false, message: '❌ Could not generate pairing code. Try again.' });
  } catch (e) {
    logger.error('POST /api/pair:', e.message);
    const msg = e.message.includes('TIMEOUT') ? '⏱️ Timed out — try again' : `🔴 ${e.message}`;
    res.status(500).json({ success: false, message: msg });
  }
});

// Reset pair
app.post('/api/pair/reset', (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) cancelSession(userId);
    res.json({ success: true, message: '✅ Reset — pair again' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Sessions
app.get('/api/sessions', (req, res) => {
  try { res.json({ success: true, sessions: getAllSessions(), count: getAllSessions().length }); }
  catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.get('/api/session/:userId', (req, res) => {
  try {
    const s = getSession(req.params.userId);
    if (!s) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, phoneNumber: s.phoneNumber, isActive: !!(s.sock?.user), createdAt: s.createdAt });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Commands list
app.get('/api/commands', (req, res) => {
  try {
    res.json({ success: true, commands: getAvailableCommands(), prefix: process.env.BOT_PREFIX || '!' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin API (requires auth + CSRF) ─────────────────────────────────────
const requireAdmin = (req, res, next) =>
  req.session?.adminAuth ? next() : res.status(401).json({ success: false, message: 'Unauthorized' });

// CSRF check for JSON API calls — reads from X-CSRF-Token header or _csrf body field
const csrfCheckAPI = (req, res, next) => {
  const tok = req.headers?.['x-csrf-token'] || req.body?._csrf;
  if (!tok || tok !== req.session?.csrfToken)
    return res.status(403).json({ success: false, message: 'CSRF token invalid. Refresh the admin page.' });
  next();
};

app.post('/api/admin/ban-user', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    addRestrictedUser(userId, reason || 'Banned by admin');
    deleteSession(userId);
    res.json({ success: true, message: `🔨 ${userId} banned and session deleted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/restrict-user', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    addRestrictedUser(userId, reason || 'Restricted');
    deleteSession(userId);
    res.json({ success: true, message: `🚫 ${userId} restricted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/unrestrict-user', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    removeRestrictedUser(userId);
    res.json({ success: true, message: `✅ ${userId} unrestricted` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/delete-user', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const deleted = deleteSession(userId);
    res.json({ success: true, message: deleted ? `✅ Deleted ${userId}` : `ℹ️ No active session for ${userId}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/add-user', requireAdmin, csrfCheckAPI, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'phoneNumber required' });
    const clean = phoneNumber.replace(/\D/g, '');
    const uid   = `admin_${Date.now()}_${clean}`;
    await startSession(uid, clean);
    res.json({ success: true, message: `✅ Session started for ${clean}`, userId: uid });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/admin/broadcast', requireAdmin, csrfCheckAPI, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'message required' });
    const all = getAllSessions();
    let ok = 0, fail = 0;
    for (const s of all) {
      const sess = getSession(s.userId);
      if (!sess?.sock?.user) { fail++; continue; }
      try {
        await sess.sock.sendMessage(
          sess.sock.user.id.split(':')[0] + '@s.whatsapp.net',
          { text: message }
        );
        ok++;
      } catch (_) { fail++; }
    }
    res.json({ success: true, message: `✅ Sent: ${ok}, Failed: ${fail}` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Admin UI ──────────────────────────────────────────────────────────────
app.use('/admin', adminRoutes);
app.use('/sub',   subRoutes);


// ──────────────────────────────────────────────────────────────────────────────
// API ROUTES — all before the 404 handler
// ──────────────────────────────────────────────────────────────────────────────

// ── Sub-Admin Management API (Owner only) ─────────────────────────────────────
app.post('/api/sub-admin/create', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { username, email, password } = req.body;
    const quota = req.body.quota || req.body.sessionLimit || 5;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });
    const existing = subAdminStore.getAll().find(a => a.username === username.trim() || a.email === email.trim().toLowerCase());
    if (existing)
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    const admin = subAdminStore.createAdmin(username.trim(), email.trim().toLowerCase(), password, quota);
    logger.info('Owner created sub-admin: ' + admin.username);
    res.json({ success: true, message: '✅ Sub-admin ' + admin.username + ' created successfully' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sub-admin/delete', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { id } = req.body;
    const admin = subAdminStore.getById(id);
    if (!admin) return res.status(404).json({ success: false, message: 'Sub-admin not found' });
    subAdminStore.deleteAdmin(id);
    res.json({ success: true, message: admin.username + ' deleted' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sub-admin/quota', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { id, quota } = req.body;
    subAdminStore.updateQuota(id, quota);
    res.json({ success: true, message: 'Quota updated to ' + quota });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sub-admin/toggle', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { id } = req.body;
    const admin = subAdminStore.getById(id);
    if (!admin) return res.status(404).json({ success: false, message: 'Not found' });
    const d = require('./utils/subAdminStore');
    const all = d.getAll ? require('./utils/subAdminStore') : null;
    // Toggle active state
    const fs   = require('fs');
    const path = require('path');
    const FILE = path.join(__dirname, '../data/sub_admins.json');
    const data = JSON.parse(fs.readFileSync(FILE,'utf8'));
    if (data[id]) {
      data[id].active = !data[id].active;
      fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
    }
    res.json({ success: true, message: (data[id]?.active ? 'Enabled' : 'Disabled') + ' ' + admin.username });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Session Management API (Owner only) ───────────────────────────────────────
app.get('/api/sessions', requireAdmin, (req, res) => {
  const live    = getAllSessions();
  const records = ss.getAll().map(r => ({
    ...r,
    online: live.some(s => s.userId === r.userId && s.isActive),
  }));
  res.json({ success: true, sessions: records });
});

app.post('/api/sessions/activate', requireAdmin, csrfCheckAPI, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });
    const sid    = sessionId.trim().toUpperCase();
    const record = ss.getBySessionId(sid);
    if (!record) return res.status(404).json({ success: false, message: 'Session ID not found: ' + sid });
    // Activate in both stores
    ss.activate(sid);
    userStore.activateUser(record.userId, record.phoneNumber, 'owner');
    // Restore WhatsApp connection
    const { restoreSession } = require('./utils/socket');
    if (typeof restoreSession === 'function') {
      await restoreSession(record.userId).catch(e => logger.warn('Restore warn: ' + e.message));
    }
    logger.info('Owner activated: ' + sid + ' (+' + record.phoneNumber + ')');
    res.json({ success: true, message: '✅ Bot is now ONLINE for +' + record.phoneNumber + ' (1 month subscription)' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sessions/deactivate', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { sessionId } = req.body;
    const record = ss.getBySessionId(sessionId);
    if (!record) return res.status(404).json({ success: false, message: 'Not found' });
    ss.deactivate(sessionId);
    userStore.deactivateUser(record.userId);
    deleteSession(record.userId);
    res.json({ success: true, message: '🔒 Bot OFFLINE for +' + record.phoneNumber });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sessions/delete', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { sessionId } = req.body;
    const record = ss.getBySessionId(sessionId);
    if (record) deleteSession(record.userId);
    ss.remove(sessionId);
    res.json({ success: true, message: '🗑️ Deleted' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/sessions/note', requireAdmin, csrfCheckAPI, (req, res) => {
  ss.setNote(req.body.sessionId, req.body.note || '');
  res.json({ success: true });
});

// ── Ban Management API ───────────────────────────────────────────────────────────
app.get('/api/banned', requireAdmin, (req, res) => {
  res.json({ success: true, banned: userStore.getAllBanned() });
});

app.post('/api/ban', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { phoneNumber, reason } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'phoneNumber required' });
    // Also deactivate if they have an active session
    const clean = phoneNumber.replace(/\D/g,'');
    const allSess = ss.getAll();
    const record  = allSess.find(r => r.phoneNumber === clean);
    if (record) {
      ss.deactivate(record.sessionId);
      userStore.deactivateUser(record.userId);
      deleteSession(record.userId);
    }
    const ban = userStore.banUser(phoneNumber, reason || 'Banned by admin', 'owner');
    logger.info('Banned: +' + clean + ' — ' + (reason || 'no reason'));
    res.json({ success: true, message: '🔨 +' + clean + ' banned and disconnected' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

app.post('/api/unban', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'phoneNumber required' });
    userStore.unbanUser(phoneNumber);
    res.json({ success: true, message: '✅ +' + phoneNumber.replace(/\D/g,'') + ' unbanned' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Deactivate by userId ──────────────────────────────────────────────────────────
app.post('/api/sessions/deactivate-by-user', requireAdmin, csrfCheckAPI, (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    userStore.deactivateUser(userId);
    deleteSession(userId);
    // Find and deactivate session record
    const record = ss.getAll().find(r => r.userId === userId);
    if (record) ss.deactivate(record.sessionId);
    res.json({ success: true, message: 'User deactivated' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Activated Users API ───────────────────────────────────────────────────────────
app.get('/api/activated', requireAdmin, (req, res) => {
  res.json({ success: true, users: userStore.getAllActivated() });
});

// ── REMOVED: Public /api/lookup-session endpoint.
//    Phone number search has been moved to admin and owner panels only.
//    See: GET /admin/api/lookup-session (requires admin auth)

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Static UI routes ───────────────────────────────────────────────────────────
app.use('/admin', adminRoutes);
app.use('/sub',   subRoutes);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found: ' + req.path }));

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Express error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ══════════════════════════════════════════════════════════════════════════
// START
// ══════════════════════════════════════════════════════════════════════════
const server = app.listen(PORT, HOST, async () => {
  const url = `http://localhost:${PORT}`;
  console.log('\x1b[32m');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       🚀  ASTRA-X BOT v6.6.6  STARTED  🚀           ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  📱 Pairing:    ' + url.padEnd(37) + '║');
  console.log('║  🔐 Admin:      ' + (url+'/admin').padEnd(37) + '║');
  console.log('║  💊 Health:     ' + (url+'/health').padEnd(37) + '║');
  console.log('║  📊 API Health: ' + (url+'/api/health').padEnd(37) + '║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\x1b[0m');

  try { await restoreAllSessions(); }
  catch (e) { logger.error('Session restore failed:', e.message); }

  // ── SOLO MODE: SESSION_ID env var set — connect directly, no SaaS needed ──
  const SOLO_SESSION_ID = process.env.SESSION_ID;
  if (SOLO_SESSION_ID && SOLO_SESSION_ID.trim()) {
    (async () => {
      try {
        const path2    = require('path');
        const fs2      = require('fs');
        const SESS_DIR = path2.join(__dirname, '../sessions');
        const soloDir  = path2.join(SESS_DIR, 'solo_session');
        const credsPath = path2.join(soloDir, 'creds.json');

        if (!fs2.existsSync(credsPath)) {
          fs2.mkdirSync(soloDir, { recursive: true });

          const raw = SOLO_SESSION_ID.trim();
          let creds = null;

          // Try 1: base64 encoded creds.json (standard format)
          try {
            const decoded = Buffer.from(raw, 'base64').toString('utf-8');
            creds = JSON.parse(decoded);
            logger.info('🚀 SOLO MODE: Decoded base64 session');
          } catch (_) {}

          // Try 2: raw JSON string
          if (!creds) {
            try {
              creds = JSON.parse(raw);
              logger.info('🚀 SOLO MODE: Parsed JSON session');
            } catch (_) {}
          }

          if (!creds) {
            logger.error('❌ SOLO MODE: Invalid SESSION_ID — must be base64 or JSON creds');
            logger.error('   Get your session from: ' + (process.env.RENDER_EXTERNAL_URL || 'your pairing site'));
            return;
          }

          // Validate it has required WhatsApp creds fields
          if (!creds.noiseKey && !creds.me && !creds.signedIdentityKey) {
            logger.error('❌ SOLO MODE: SESSION_ID does not contain valid WhatsApp credentials');
            return;
          }

          fs2.writeFileSync(credsPath, JSON.stringify(creds, null, 2));
          logger.info('✅ SOLO MODE: Credentials saved');
        }

        // Register in session store as active (no admin activation needed)
        const ownerPhone = (process.env.BOT_OWNER || '').replace(/\D/g, '') || 'solo';
        let soloSid = null;
        try {
          const existingRec = ss.getByUserId('solo_session');
          soloSid = existingRec ? existingRec.sessionId : ss.register('solo_session', ownerPhone);
          ss.activate(soloSid);
        } catch (_) {}

        // Connect directly
        await startSession('solo_session', ownerPhone);
        logger.info('✅ SOLO MODE: Bot is now online!');
        logger.info('✅ SOLO MODE: Admin panel → ' + (process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT) + '/admin');

      } catch (e) {
        logger.error('❌ SOLO MODE startup error:', e.message);
      }
    })();
  }

  try { startChannelCheck();

// Check session expiry every hour
setInterval(() => {
  try { ss.checkExpiry(); } catch(_) {}
}, 60 * 60 * 1000);
logger.info('⏰ Session expiry checker started (runs every hour)'); }
  catch (e) { logger.error('Channel check failed:', e.message); }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE')
    logger.error(`❌ Port ${PORT} already in use. Change PORT in .env or stop the other process.`);
  else logger.error('Server error:', e.message);
  process.exit(1);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
process.on('unhandledRejection', reason => logger.error('Unhandled rejection:', reason));
process.on('uncaughtException',  err    => {
  logger.error('Uncaught exception:', err.message);
  if (['EACCES','EADDRINUSE','MODULE_NOT_FOUND'].some(c => err.code === c || err.message.includes(c)))
    process.exit(1);
});

module.exports = app;

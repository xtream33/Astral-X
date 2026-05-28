/**
 * ASTRA-X Command Usage Statistics
 * Tracks per-command usage counts, error counts, and last-used timestamps.
 * Persisted to disk every 60 seconds so restarts don't lose all data.
 */
const fs   = require('fs');
const path = require('path');

const FILE     = path.join(__dirname, '../../data/stats.json');
const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let data = { commands: {}, startedAt: new Date().toISOString(), totalMessages: 0 };
try {
  if (fs.existsSync(FILE)) {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    // Keep historical command counts but reset startedAt
    data.commands = parsed.commands || {};
    data.totalMessages = parsed.totalMessages || 0;
  }
} catch (_) {}

function save() {
  try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch (_) {}
}

// Persist every 60 seconds
setInterval(save, 60_000);
process.on('SIGTERM', save);
process.on('SIGINT',  save);

function recordCommand(cmdName, success = true) {
  if (!data.commands[cmdName]) {
    data.commands[cmdName] = { uses: 0, errors: 0, lastUsed: null };
  }
  data.commands[cmdName].uses++;
  if (!success) data.commands[cmdName].errors++;
  data.commands[cmdName].lastUsed = new Date().toISOString();
}

function recordMessage() { data.totalMessages++; }

function getStats() {
  const sorted = Object.entries(data.commands)
    .sort((a, b) => b[1].uses - a[1].uses)
    .map(([name, s]) => ({ name, ...s }));
  return {
    commands: sorted,
    totalMessages: data.totalMessages,
    startedAt: data.startedAt,
    uptime: Math.floor(process.uptime()),
  };
}

module.exports = { recordCommand, recordMessage, getStats };

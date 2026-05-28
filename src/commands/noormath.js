'use strict';
const https = require('https');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

// Try Newton math API first (free, handles expressions well)
function newtonSolve(operation, expression) {
  return new Promise((resolve, reject) => {
    const url = 'https://newton.now.sh/api/v2/' + operation + '/' + encodeURIComponent(expression);
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Fallback: Pollinations AI for word problems
function pollinationsMath(prob) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(
      'You are a math tutor. Solve this step by step, show all working, give the final answer clearly:\n\n' + prob
    );
    const url = 'https://text.pollinations.ai/' + encoded;
    https.get(url, { headers: { 'User-Agent': 'ASTRA-X Bot/4.0' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data.trim()));
    }).on('error', reject);
  });
}

// Detect if it's a simple expression for Newton
function isSimpleExpression(prob) {
  return /^[\d\s\+\-\*\/\(\)\^\.\%x]+$/i.test(prob) && prob.length < 60;
}

module.exports = {
  name: 'noormath',
  aliases: ['nmath', 'nsolve', 'noorsolve', 'ncalc'],
  category: 'astra-x-ai',
  description: 'Solve math problems step by step. Usage: .noormath <problem>',
  execute: async (sock, msg, args) => {
    const jid  = msg.key.remoteJid;
    const prob = args.join(' ').trim() || getQuotedText(msg);

    if (!prob) return sock.sendMessage(jid, {
      text: box('🧮 *ASTRA-X MATH*',
        '❓ Please provide a math problem!\n\n📌 *Usage:* .noormath <problem>\n\n💡 *Examples:*\n.noormath 2x + 5 = 15\n.noormath area of circle radius 7\n.noormath 15% of 4500\n.noormath derivative of x^3 + 2x\n.noormath how much is 250 divided by 7.5'
      ),
    });

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ 🧮 *ᴀsᴛʀᴀ-x ᴍᴀᴛʜ*\n┠─────────────────────\n┃ _Solving..._\n┗━━━━━━━━━━━━━━━━━━━▣'
    });

    try {
      let result = '';
      let method = '';

      // Try Newton API for simple expressions
      if (isSimpleExpression(prob)) {
        try {
          const newton = await newtonSolve('simplify', prob);
          if (newton.result && newton.result !== 'undefined') {
            result = '✅ *Result:* ' + newton.result;
            method = 'Newton API';
          }
        } catch (_) {}
      }

      // Fallback to AI for word problems or failures
      if (!result) {
        const ai = await pollinationsMath(prob);
        if (ai && ai.length > 5) {
          result = ai.slice(0, 1200);
          method = 'AI Math Solver';
        }
      }

      if (!result) throw new Error('Could not solve the problem.');

      const body = '📋 *Problem:* _' + prob + '_\n━━━━━━━━━━━━━━\n\n' + result + (method ? '\n\n🔧 _Solved via ' + method + '_' : '');
      await sock.sendMessage(jid, {
        text: box('🧮 *ASTRA-X MATH*', body),
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box('🧮 *ASTRA-X MATH*', '❌ Error: ' + e.message) });
    }
  },
};

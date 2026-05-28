'use strict';
const https = require('https');
const http  = require('http');

// ── Free AI backend — Pollinations.ai (no API key needed) ─────────────────
// Drop-in replacement for Gemini. Same exports: ask, askWithImage, getImageFromMsg
// Uses openai-compatible endpoint at text.pollinations.ai

function ask(prompt, systemInstruction) {
  return new Promise((resolve, reject) => {
    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const body = JSON.stringify({
      model:    'openai',
      messages,
      seed:     42,
      private:  true,
    });

    const req = https.request({
      hostname: 'text.pollinations.ai',
      path:     '/openai',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'ASTRA-X-Bot/1.0',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const text = json?.choices?.[0]?.message?.content;
          if (text) return resolve(text.trim());
          reject(new Error(json?.error?.message || 'No response from AI'));
        } catch(e) { reject(new Error('AI parse error: ' + e.message)); }
      });
    });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('AI request timed out')); });
    req.on('error', e => reject(new Error('AI connection error: ' + e.message)));
    req.write(body);
    req.end();
  });
}

function askWithImage(imageBuffer, mimeType, prompt) {
  // Pollinations vision — encode image as base64 data URL in message content
  return new Promise((resolve, reject) => {
    const b64  = imageBuffer.toString('base64');
    const messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: 'data:' + mimeType + ';base64,' + b64 } },
        { type: 'text', text: prompt },
      ],
    }];

    const body = JSON.stringify({
      model:   'openai',
      messages,
      seed:    42,
      private: true,
    });

    const req = https.request({
      hostname: 'text.pollinations.ai',
      path:     '/openai',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'ASTRA-X-Bot/1.0',
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const text = json?.choices?.[0]?.message?.content;
          if (text) return resolve(text.trim());
          reject(new Error(json?.error?.message || 'No vision response'));
        } catch(e) { reject(new Error('Vision parse error: ' + e.message)); }
      });
    });
    req.setTimeout(45000, () => { req.destroy(); reject(new Error('Vision request timed out')); });
    req.on('error', e => reject(new Error('Vision connection error: ' + e.message)));
    req.write(body);
    req.end();
  });
}

async function getImageFromMsg(sock, msg) {
  const m      = msg.message;
  const quoted = m?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imgMsg = m?.imageMessage || quoted?.imageMessage;
  if (!imgMsg) return null;
  const isQuoted = !!quoted?.imageMessage;
  const target   = isQuoted ? { message: quoted } : msg;
  const buf      = await sock.downloadMediaMessage(target);
  return { buf: Buffer.isBuffer(buf) ? buf : Buffer.from(buf), mime: imgMsg.mimetype || 'image/jpeg' };
}

module.exports = { ask, askWithImage, getImageFromMsg };

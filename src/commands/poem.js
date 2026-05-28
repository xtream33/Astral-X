'use strict';
const { ask } = require('../utils/gemini');
const { box } = require('../utils/format');

function getQuotedText(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
      || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
      || null;
}

const CFG = {
  write:     { e:'✍️',  l:'WRITE',       u:'.write <topic>',          p:'Write a well-structured, engaging piece about: ', s:'Include an introduction, key points and a conclusion.', ex:'• .write benefits of exercise\n• .write short story about friendship' },
  poem:      { e:'📜',  l:'POEM',         u:'.poem <topic>',           p:'Write a beautiful, creative poem about: ',         s:'Make it rhyme where possible. Be expressive.',          ex:'• .poem love and life\n• .poem missing someone' },
  story:     { e:'📖',  l:'SHORT STORY',  u:'.story <topic>',          p:'Write an engaging short story about: ',            s:'Include characters, a plot twist and a satisfying ending. Under 400 words.', ex:'• .story mysterious island\n• .story a kind stranger' },
  code:      { e:'💻',  l:'CODE',         u:'.code <description>',     p:'Write clean, working code for: ',                  s:'Include brief comments. Format it clearly.',            ex:'• .code python rename files\n• .code HTML login form' },
  recipe:    { e:'🍳',  l:'RECIPE',       u:'.recipe <dish>',          p:'Give a complete recipe for: ',                     s:'Format: INGREDIENTS list, STEPS numbered, TIME and SERVES.', ex:'• .recipe chicken stew\n• .recipe pancakes' },
  advice:    { e:'💡',  l:'ADVICE',       u:'.advice <situation>',     p:'Give practical, honest and caring advice for: ',   s:'Be empathetic and give actionable steps.',              ex:'• .advice I have an exam tomorrow\n• .advice feeling lonely' },
  roastai:   { e:'🔥',  l:'AI ROAST',     u:'.roastai <name>',         p:'Write a funny, savage but not offensive roast for: ', s:'Playful and witty. Max 5 lines.',                   ex:'• .roastai John\n• .roastai my friend' },
  factcheck: { e:'🔍',  l:'FACT CHECK',   u:'.factcheck <claim>',      p:'Fact check this claim: ',                          s:'Give verdict: TRUE/FALSE/PARTIAL/UNVERIFIABLE then explain with evidence.', ex:'• .factcheck earth is flat\n• .factcheck humans use 10% of brain' },
  compare:   { e:'⚖️',  l:'COMPARE',      u:'.compare <A> vs <B>',     p:'Compare these two things: ',                       s:'List advantages and disadvantages of each, then give a verdict.',           ex:'• .compare iPhone vs Android\n• .compare Uganda vs Kenya' },
  email:     { e:'📧',  l:'EMAIL DRAFT',  u:'.email <purpose>',        p:'Write a professional email for: ',                 s:'Include Subject, greeting, body paragraphs, closing and signature.',        ex:'• .email job application\n• .email asking for day off' },
  diet:      { e:'🥗',  l:'MEAL PLAN',    u:'.diet <goal>',            p:'Create a practical 1-day meal plan for someone who wants to: ', s:'Include Breakfast, Lunch, Dinner, Snacks, hydration tips and foods to avoid.', ex:'• .diet lose weight\n• .diet build muscle' },
  translate: { e:'🌍',  l:'TRANSLATE',    u:'.translate <lang> <text>',p:'Translate the following text to ',                 s:'Only return the translated text, nothing else.',        ex:'• .translate French Hello how are you\n• .translate Swahili Good morning' },
};

const C = CFG['poem'];

module.exports = {
  name: 'poem',
  category: 'ai',
  description: C.u,
  execute: async (sock, msg, args) => {
    const jid = msg.key.remoteJid;

    let prompt, display;

    if ('poem' === 'translate') {
      const lang = args[0];
      const text = args.slice(1).join(' ').trim() || getQuotedText(msg);
      if (!lang || !text) return sock.sendMessage(jid, {
        text: box(C.e + ' *' + C.l + '*',
          '📌 *Usage:* ' + C.u + '\n\n💡 *Examples:*\n' + C.ex +
          '\n\nOr reply to a message:\n_.translate Spanish_'
        ),
      });
      prompt  = C.p + lang + '. Only return the translated text:\n\n' + text;
      display = C.e + ' *' + C.l + ' → ' + lang.toUpperCase() + '*';
    } else if ('poem' === 'factcheck') {
      const claim = args.join(' ').trim() || getQuotedText(msg);
      if (!claim) return sock.sendMessage(jid, {
        text: box(C.e + ' *' + C.l + '*', '📌 *Usage:* ' + C.u + '\n\n💡 *Examples:*\n' + C.ex),
      });
      prompt  = C.p + '"' + claim + '"\n\n' + C.s;
      display = C.e + ' *' + C.l + '*';
    } else if ('poem' === 'compare') {
      const text = args.join(' ');
      const hasSep = text.toLowerCase().includes(' vs ');
      if (!hasSep) return sock.sendMessage(jid, {
        text: box(C.e + ' *' + C.l + '*', '📌 *Usage:* ' + C.u + '\n\n💡 *Examples:*\n' + C.ex),
      });
      prompt  = C.p + text + '\n\n' + C.s;
      display = C.e + ' *' + C.l + '*';
    } else {
      const input = args.join(' ').trim() || (
        ['improve','summarize','grammar','formal','casual'].includes('poem') ? getQuotedText(msg) : ''
      );
      if (!input) return sock.sendMessage(jid, {
        text: box(C.e + ' *' + C.l + '*', '📌 *Usage:* ' + C.u + '\n\n💡 *Examples:*\n' + C.ex),
      });
      prompt  = C.p + input + '\n\n' + C.s;
      display = C.e + ' *' + C.l + ': ' + input.slice(0, 40) + (input.length > 40 ? '...' : '') + '*';
    }

    await sock.sendMessage(jid, {
      text: '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕\n┏━━━━━━━━━━━━━━━━━━━▣\n┃ ' + C.e + ' *' + C.l + '*\n┠─────────────────────\n┃ _Processing..._\n┗━━━━━━━━━━━━━━━━━━━▣',
    });

    try {
      const reply = await ask(prompt);
      await sock.sendMessage(jid, { text: box(display, reply) }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(jid, { text: box(C.e + ' *' + C.l + '*', '❌ Error: ' + e.message) });
    }
  },
};

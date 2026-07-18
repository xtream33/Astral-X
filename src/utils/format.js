'use strict';

const HEADER = '〔 ✧ ᴀsᴛʀᴀ-x ᴛᴇᴄʜ ✧ 〕';
const FOOTER = '_Powered by *ᴀsᴛʀᴀ-x ᴛᴇᴄʜ* 🌍_';
const DIV    = '┠─────────────────────';
const TOP    = '┏━━━━━━━━━━━━━━━━━━━▣';
const BOT    = '┗━━━━━━━━━━━━━━━━━━━▣';

/**
 * Build a bordered ASTRA-X response box
 * @param {string} title     - e.g. '🤖 *AI RESPONSE*'
 * @param {string} body      - main content lines (use \n between lines)
 * @param {string} [footer]  - optional custom footer line
 */
function box(title, body, footer) {
  const lines = body.split('\n').map(l => '┃ ' + l).join('\n');
  return (
    HEADER + '\n' +
    TOP + '\n' +
    '┃ ' + title + '\n' +
    DIV + '\n' +
    lines + '\n' +
    BOT + '\n' +
    (footer || FOOTER)
  );
}

/**
 * Simple box with just body lines (no title)
 */
function simpleBox(body, footer) {
  const lines = body.split('\n').map(l => '┃ ' + l).join('\n');
  return (
    HEADER + '\n' +
    TOP + '\n' +
    lines + '\n' +
    BOT + '\n' +
    (footer || FOOTER)
  );
}

module.exports = { box, simpleBox, HEADER, FOOTER, DIV, TOP, BOT };

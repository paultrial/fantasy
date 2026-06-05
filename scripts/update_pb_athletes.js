// ==UserScript==
// @name         Pinkbike Fantasy DH – Copy aAthletesKeyed
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Extracts aAthletesKeyed from the page and adds a copy button
// @match        https://www.pinkbike.com/contest/fantasy/dh/athletes*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const VAR_NAME = 'aAthletesKeyed';

  // ── Extraction logic ────────────────────────────────────────────────────────

  function extractBalancedObject(text, start) {
    let depth = 0, inString = null, escaped = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (escaped)         { escaped = false; continue; }
        if (ch === '\\')     { escaped = true;  continue; }
        if (ch === inString) { inString = null; }
        continue;
      }
      if (ch === '"' || ch === "'") { inString = ch; }
      else if (ch === '{') { depth++; }
      else if (ch === '}') { if (--depth === 0) return text.slice(start, i + 1); }
    }
    throw new Error('Unbalanced braces.');
  }

  function findAssignmentObject(html, varName) {
    let pos = html.indexOf(varName);
    while (pos !== -1) {
      const before = pos > 0 ? html[pos - 1] : ' ';
      const after  = html[pos + varName.length] ?? ' ';
      const notIdChar = c => !/[\w$]/.test(c);
      if (notIdChar(before) && notIdChar(after)) {
        const eqIdx    = html.indexOf('=', pos + varName.length);
        const braceIdx = html.indexOf('{', pos + varName.length);
        if (eqIdx !== -1 && braceIdx !== -1 && eqIdx < braceIdx) {
          return extractBalancedObject(html, braceIdx);
        }
      }
      pos = html.indexOf(varName, pos + varName.length);
    }
    throw new Error(`Could not find "${varName}" in page source.`);
  }

  // ── UI ──────────────────────────────────────────────────────────────────────

  function createButton(data) {
    const count = Object.keys(data).length;
    const btn = document.createElement('button');
    btn.textContent = `📋 Copy aAthletesKeyed (${count} athletes)`;
    Object.assign(btn.style, {
      position:     'fixed',
      top:          '10px',
      left:         '10px',
      zIndex:       '999999',
      padding:      '8px 14px',
      background:   '#2a7d2a',
      color:        '#fff',
      border:       'none',
      borderRadius: '6px',
      fontSize:     '13px',
      fontWeight:   'bold',
      cursor:       'pointer',
      boxShadow:    '0 2px 8px rgba(0,0,0,.35)',
    });

    btn.addEventListener('click', () => {
      const json = JSON.stringify(data, null, 2);
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(json);
      } else {
        navigator.clipboard.writeText(json).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = json;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        });
      }
      const prev = btn.textContent;
      btn.textContent = '✅ Copied!';
      setTimeout(() => { btn.textContent = prev; }, 1800);
    });

    document.body.appendChild(btn);
  }

  function createErrorButton(msg) {
    const btn = document.createElement('button');
    btn.textContent = `❌ ${msg}`;
    Object.assign(btn.style, {
      position: 'fixed', top: '10px', left: '10px', zIndex: '999999',
      padding: '8px 14px', background: '#a00', color: '#fff',
      border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold',
    });
    document.body.appendChild(btn);
  }

  // ── Main ────────────────────────────────────────────────────────────────────

  try {
    // Pull from inline <script> tags only — much faster than scanning all HTML
    const scripts = document.querySelectorAll('script:not([src])');
    let data = null;

    for (const script of scripts) {
      if (!script.textContent.includes(VAR_NAME)) continue;
      try {
        const objText = findAssignmentObject(script.textContent, VAR_NAME);
        data = JSON.parse(objText);
        break;
      } catch (_) { continue; }
    }

    if (!data) throw new Error('aAthletesKeyed not found in any inline script.');
    createButton(data);
  } catch (e) {
    console.error('[PB Fantasy]', e);
    createErrorButton(e.message);
  }

})();
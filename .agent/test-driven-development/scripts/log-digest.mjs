#!/usr/bin/env node
// log-digest.mjs - summarize large test/typecheck/build logs so agents never read raw logs.
// Zero dependencies. Handles UTF-8 and UTF-16LE (PowerShell `>` redirection) logs, strips ANSI.
//
// Usage:
//   node log-digest.mjs <log> [--compare <baseline.log>] [--full] [--limit N]
//   <command> 2>&1 | node log-digest.mjs -          (read stdin)
//
// Recognized shapes: TAP-like "ok - name" / "not ok - name", jest/vitest "✓ ✕ × FAIL PASS",
// summary lines such as "1685/1690 unit tests passed" or "Tests: 2 failed, 10 passed",
// TypeScript "file(line,col): error TS1234: msg" and "file:line:col - error TS1234: msg".
// Exit code: 0 no failures, 1 failures or TS errors found, 2 usage/read error.

import fs from 'node:fs';

const args = process.argv.slice(2);
let file = null, baseline = null, full = false, limit = 15;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--compare') baseline = args[++i];
  else if (args[i] === '--full') full = true;
  else if (args[i] === '--limit') limit = Number(args[++i]) || 15;
  else if (args[i] === '-h' || args[i] === '--help') usage(0);
  else file = args[i];
}
if (!file) usage(2);

function usage(code) {
  console.log('usage: log-digest.mjs <log|-> [--compare <baseline.log>] [--full] [--limit N]');
  process.exit(code);
}

function readText(p) {
  const buf = p === '-' ? fs.readFileSync(0) : fs.readFileSync(p);
  let enc = 'utf8';
  let text;
  if (buf[0] === 0xff && buf[1] === 0xfe) { enc = 'utf16le'; text = buf.slice(2).toString('utf16le'); }
  else if (buf[0] === 0xfe && buf[1] === 0xff) { enc = 'utf16be'; text = Buffer.from(buf.slice(2)).swap16().toString('utf16le'); }
  else {
    const sample = buf.slice(0, 4000);
    let nul = 0;
    for (let i = 1; i < sample.length; i += 2) if (sample[i] === 0) nul++;
    if (sample.length > 20 && nul > sample.length / 4) { enc = 'utf16le'; text = buf.toString('utf16le'); }
    else text = buf.toString('utf8').replace(/^\uFEFF/, '');
  }
  text = text.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\0/g, '');
  return { text, enc, bytes: buf.length };
}

const FAIL_RES = [
  /^\s*not ok\s+\d*\s*-?\s*(.+)$/i,
  /^\s*(?:✕|✗|×|✖)\s+(.+?)(?:\s+\(\d+\s*m?s\))?$/,
  /^\s*FAIL\s+(.+)$/,
];
const PASS_RES = [/^\s*ok\s+\d*\s*-?\s*(.+)$/i, /^\s*(?:✓|✔)\s+(.+)$/];
const TS_RES = [
  /^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/,
  /^(.+?):(\d+):(\d+)\s*-\s*error\s+(TS\d+):\s*(.+)$/,
];
const SUMMARY_RES = [
  /(\d+)\s*\/\s*(\d+)\s+[\w\s]*?tests?\s+passed/i,
  /Tests?:\s*(?:(\d+)\s+failed,\s*)?(?:(\d+)\s+skipped,\s*)?(\d+)\s+passed(?:,\s*(\d+)\s+total)?/i,
  /#\s*pass\s+(\d+)/i,
  /#\s*fail\s+(\d+)/i,
];
const ERROR_HINT = /(AssertionError|Error:|expected|Expected|Received|received|toBe|toEqual|actual|threw|TypeError|ReferenceError|Cannot find)/;

function digest(text) {
  const lines = text.split(/\r?\n/);
  const failures = [];
  const ts = [];
  let passed = 0, failedCount = 0, summary = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if (FAIL_RES.some(re => (m = line.match(re)))) {
      const name = m[1].trim();
      const ctx = [];
      for (let j = i + 1; j < Math.min(lines.length, i + 40) && ctx.length < (full ? 12 : 2); j++) {
        const l = lines[j].trim();
        if (!l) continue;
        if (PASS_RES.some(re => re.test(lines[j])) || FAIL_RES.some(re => re.test(lines[j]))) break;
        if (full || ERROR_HINT.test(l)) ctx.push(l.slice(0, 220));
      }
      failures.push({ name, ctx });
      failedCount++;
      continue;
    }
    if (PASS_RES.some(re => re.test(line))) { passed++; continue; }
    for (const re of TS_RES) {
      if ((m = line.match(re))) { ts.push({ file: m[1].trim(), line: m[2], code: m[4], msg: m[5].trim().slice(0, 160) }); break; }
    }
    if ((m = line.match(SUMMARY_RES[0]))) summary = { passed: +m[1], total: +m[2], failed: +m[2] - +m[1] };
    else if ((m = line.match(SUMMARY_RES[1]))) summary = { passed: +m[3], failed: +(m[1] || 0), total: +(m[4] || (+m[3] + +(m[1] || 0) + +(m[2] || 0))) };
  }
  return { lines: lines.length, passed, failedCount, failures, ts, summary };
}

const q = s => (/[",\n]/.test(s) ? `"${s.replace(/"/g, "'")}"` : s);

let cur;
try { cur = readText(file); } catch (e) { console.log(`error: cannot read ${file}: ${e.message}`); process.exit(2); }
const d = digest(cur.text);
const sum = d.summary || { passed: d.passed, failed: d.failedCount, total: d.passed + d.failedCount };

console.log(`log: ${file === '-' ? 'stdin' : file}`);
console.log(`encoding: ${cur.enc}${cur.enc !== 'utf8' ? ' (tip: pipe to log-digest or use Out-File -Encoding utf8 to halve size)' : ''}`);
console.log(`size: ${cur.bytes} bytes, ${d.lines} lines`);
console.log(`tests: passed=${sum.passed} failed=${sum.failed} total=${sum.total}${d.summary ? '' : ' (counted from lines; no summary line found)'}`);
if (d.summary && d.summary.failed !== d.failedCount && d.failedCount) console.log(`note: summary says ${d.summary.failed} failed, ${d.failedCount} failure lines parsed`);

if (d.failures.length) {
  const shown = d.failures.slice(0, limit);
  console.log(`failures[${d.failures.length}]{name,first_error}:`);
  for (const f of shown) console.log(`  ${q(f.name.slice(0, 160))},${q(f.ctx[0] || '-')}`);
  if (full) for (const f of shown) { console.log(`--- ${f.name}`); for (const c of f.ctx) console.log(`    ${c}`); }
  if (d.failures.length > limit) console.log(`  ... ${d.failures.length - limit} more (use --limit or --full)`);
} else if (!sum.failed) console.log('failures: none');

if (d.ts.length) {
  console.log(`ts_errors[${d.ts.length}]{file,line,code,msg}:`);
  for (const t of d.ts.slice(0, limit)) console.log(`  ${q(t.file)},${t.line},${t.code},${q(t.msg)}`);
} else console.log('ts_errors: none found');

let regressions = null;
if (baseline) {
  try {
    const b = digest(readText(baseline).text);
    const before = new Set(b.failures.map(f => f.name));
    const after = new Set(d.failures.map(f => f.name));
    regressions = [...after].filter(n => !before.has(n));
    const fixed = [...before].filter(n => !after.has(n));
    console.log(`compare: baseline_failed=${before.size} now_failed=${after.size} new=${regressions.length} fixed=${fixed.length}`);
    if (regressions.length) {
      console.log(`new_failures[${regressions.length}]:`);
      for (const n of regressions.slice(0, limit)) console.log(`  ${q(n.slice(0, 160))}`);
    }
  } catch (e) { console.log(`compare: error reading baseline: ${e.message}`); }
}

const bad = sum.failed > 0 || d.ts.length > 0;
if (regressions && regressions.length) console.log('next: new failures vs baseline - fix before claiming green');
else if (bad) console.log('next: inspect the named failures; use --full for context, open source only for those tests');
else console.log('next: green - record this digest as evidence');
process.exit(bad ? 1 : 0);

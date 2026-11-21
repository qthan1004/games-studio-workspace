#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node log-digest.mjs <log-file> [--file <log-file>] [--compare <baseline-log>] [--json] [--help]

Digests verbose test/build logs into compact failure/warning summaries so agents
never flood context windows with raw output.
`;

const { values, positionals } = parseArgs({
  options: {
    file: { type: 'string', default: '' },
    compare: { type: 'string', default: '' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

const targetLog = values.file || positionals[0] || '';
if (values.help || !targetLog) {
  process.stdout.write(USAGE);
  process.exit(values.help ? 0 : 2);
}

function analyzeLog(filePath) {
  const full = path.resolve(filePath);
  if (!fs.existsSync(full)) throw new Error(`Log file not found: ${full}`);
  const lines = fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const errorRe = /\b(FAIL|FAILED|ERROR|Exception|AssertionError|panic:|error CS\d+|SCRIPT ERROR)\b/;
  const warnRe = /\b(WARN|WARNING|warning CS\d+)\b/i;

  const errorLines = [];
  let warningCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (errorRe.test(line)) errorLines.push({ line: i + 1, text: line.trim().slice(0, 240) });
    else if (warnRe.test(line)) warningCount++;
  }
  return {
    file: full,
    totalLines: lines.length,
    errorCount: errorLines.length,
    warningCount,
    sampleErrors: errorLines.slice(0, 15),
    tail: lines.slice(-10).map(l => l.trim()).filter(Boolean)
  };
}

try {
  const current = analyzeLog(targetLog);
  let comparison = null;
  if (values.compare) {
    const base = analyzeLog(values.compare);
    const baseSet = new Set(base.sampleErrors.map(e => e.text));
    const newErrors = current.sampleErrors.filter(e => !baseSet.has(e.text));
    comparison = {
      baselineErrors: base.errorCount,
      deltaErrors: current.errorCount - base.errorCount,
      newErrorSamples: newErrors
    };
  }

  const out = { tool: 'log-digest', ...current, ...(comparison ? { comparison } : {}) };
  if (values.json) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } else {
    process.stdout.write(`Lines: ${current.totalLines} | Errors: ${current.errorCount} | Warnings: ${current.warningCount}\n`);
    for (const e of current.sampleErrors) process.stdout.write(`  [L${e.line}] ${e.text}\n`);
    if (comparison) process.stdout.write(`Delta vs baseline: ${comparison.deltaErrors >= 0 ? '+' : ''}${comparison.deltaErrors} error(s)\n`);
  }
} catch (err) {
  process.stderr.write(`ERROR: ${err.message}\n`);
  process.exit(2);
}

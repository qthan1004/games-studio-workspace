#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node check-sync.mjs [--project <game-root>] [--json] [--help]

Audits full-chain synchronization inside a game repository:
  - Verifies PROJECT.md, STYLE_ANCHOR.md, departments/MOC.md, and departments/registry.yaml
  - Validates relative links across MOC.md and living department specs (01..06)
  - Validates 'status: draft | locked' frontmatter on department specs
  - Ensures all owner/data_path/consumers entries in registry.yaml exist and flags [SYNC-REQUIRED]
`;

const { values } = parseArgs({
  options: {
    project: { type: 'string', default: process.cwd() },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const projectRoot = path.resolve(values.project);
const errors = [];
const warnings = [];

const requiredCore = ['PROJECT.md', 'STYLE_ANCHOR.md', 'departments/MOC.md', 'departments/registry.yaml'];
if (!fs.existsSync(path.join(projectRoot, 'PROJECT.md'))) {
  const msg = `No PROJECT.md found at ${projectRoot} (run inside a bootstrapped game repo under Projects/<slug>/)`;
  if (values.json) process.stdout.write(JSON.stringify({ ok: false, errors: [msg], warnings: [] }, null, 2) + '\n');
  else process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(2);
}

for (const req of requiredCore) {
  if (!fs.existsSync(path.join(projectRoot, req))) {
    errors.push(`Missing required studio anchor file: ${req}`);
  }
}

function walkMarkdown(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdown(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

const deptDir = path.join(projectRoot, 'departments');
const mdFiles = walkMarkdown(deptDir);

for (const file of mdFiles) {
  const rel = path.relative(projectRoot, file).replace(/\\/g, '/');
  const text = fs.readFileSync(file, 'utf8');

  if (rel !== 'departments/MOC.md') {
    const fmMatch = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) {
      warnings.push(`${rel}: missing YAML frontmatter (expected title, owner, status: draft|locked)`);
    } else if (!/^\s*status\s*:\s*["']?(draft|locked)["']?\s*$/m.test(fmMatch[1])) {
      errors.push(`${rel}: frontmatter missing valid 'status: draft | locked'`);
    }
  }

  if (/\[SYNC-REQUIRED\]|sync-required/i.test(text)) {
    warnings.push(`${rel}: contains unresolved [SYNC-REQUIRED] marker`);
  }

  for (const m of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]+)?\)/g)) {
    const link = m[1];
    if (/^(https?:|mailto:)/i.test(link) || link.includes('<')) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), link))) {
      errors.push(`${rel}: broken relative link '${link}'`);
    }
  }
}

const regFile = path.join(deptDir, 'registry.yaml');
if (fs.existsSync(regFile)) {
  const rawReg = fs.readFileSync(regFile, 'utf8');
  const regText = rawReg.split(/\r?\n/).filter(l => !/^\s*#/.test(l)).join('\n');
  if (/\[SYNC-REQUIRED\]|sync-required/i.test(regText)) {
    warnings.push('departments/registry.yaml: contains unresolved [SYNC-REQUIRED] marker');
  }
  for (const m of regText.matchAll(/^\s*(?:owner|data_path)\s*:\s*["']?([^"'\r\n#]+)["']?/gm)) {
    const target = m[1].trim();
    if (target && !fs.existsSync(path.join(projectRoot, target))) {
      errors.push(`departments/registry.yaml: referenced path '${target}' does not exist`);
    }
  }
  for (const m of regText.matchAll(/consumers\s*:\s*\[([^\]]*)\]/g)) {
    const items = m[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    for (const c of items) {
      if (!fs.existsSync(path.join(projectRoot, c))) {
        errors.push(`departments/registry.yaml: consumer path '${c}' does not exist`);
      }
    }
  }
}

const ok = errors.length === 0;
if (values.json) {
  process.stdout.write(JSON.stringify({
    tool: 'check-sync',
    ok,
    project: projectRoot,
    docsChecked: mdFiles.length,
    errors,
    warnings
  }, null, 2) + '\n');
} else {
  for (const e of errors) process.stdout.write(`ERROR: ${e}\n`);
  for (const w of warnings) process.stdout.write(`WARN: ${w}\n`);
  process.stdout.write(`Sync check (${mdFiles.length} docs): ${errors.length} error(s), ${warnings.length} warning(s).\n`);
}
process.exit(ok ? 0 : 1);

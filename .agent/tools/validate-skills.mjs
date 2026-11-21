#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node validate-skills.mjs [--root <skills-dir>] [--strict] [--json] [--help]

Validates Studio & Project SKILL.md files and cluster README.md roadmaps:
  - Required frontmatter: name, version (SemVer), released (YYYY-MM-DD), description
  - Directory name matches frontmatter 'name'
  - Line count <= 150 lines (keeps skills concise)
  - No machine-specific absolute paths or file:// URIs
  - Strict mode checks: 'Not for' boundary in description and '## Gotchas' section
`;

const { values } = parseArgs({
  options: {
    root: { type: 'string', default: path.resolve(import.meta.dirname, '..', 'skills') },
    strict: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const rootDir = path.resolve(values.root);
const errors = [];
const warnings = [];
let filesChecked = 0;

function parseFrontmatter(content) {
  const norm = content.replace(/\r\n/g, '\n');
  if (!norm.startsWith('---\n')) return null;
  const end = norm.indexOf('\n---\n', 4);
  if (end < 0) return null;
  const raw = norm.slice(4, end);
  const body = norm.slice(end + 5);
  const fields = {};
  let currentKey = null;
  for (const line of raw.split('\n')) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();
      fields[currentKey] = (val === '>' || val === '|') ? '' : val.replace(/^["']|["']$/g, '');
    } else if (currentKey && /^\s+\S/.test(line)) {
      fields[currentKey] = (fields[currentKey] ? fields[currentKey] + ' ' : '') + line.trim();
    }
  }
  return { fields, body, totalLines: norm.split('\n').length };
}

function walkSkillFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSkillFiles(full, acc);
    else if (entry.isFile() && entry.name === 'SKILL.md') acc.push(full);
  }
  return acc;
}

if (!fs.existsSync(rootDir)) {
  const msg = `Skills root does not exist: ${rootDir}`;
  if (values.json) process.stdout.write(JSON.stringify({ ok: false, errors: [msg], warnings: [] }, null, 2) + '\n');
  else process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(2);
}

if (!fs.existsSync(path.join(rootDir, 'README.md'))) {
  errors.push(`${path.relative(process.cwd(), rootDir)}: missing cluster roadmap README.md`);
}
for (const sub of ['general', 'roles']) {
  const subDir = path.join(rootDir, sub);
  if (fs.existsSync(subDir) && !fs.existsSync(path.join(subDir, 'README.md'))) {
    errors.push(`${path.relative(process.cwd(), subDir)}: missing cluster roadmap README.md`);
  }
}

const skillFiles = walkSkillFiles(rootDir);
const seenNames = new Set();

for (const file of skillFiles) {
  filesChecked++;
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const dirName = path.basename(path.dirname(file));
  const content = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    errors.push(`${rel}: missing or malformed YAML frontmatter`);
    continue;
  }

  const { fields, body, totalLines } = parsed;
  if (!fields.name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fields.name)) {
    errors.push(`${rel}: invalid or missing 'name' field`);
  } else if (fields.name !== dirName) {
    errors.push(`${rel}: frontmatter name '${fields.name}' does not match folder '${dirName}'`);
  } else if (seenNames.has(fields.name)) {
    errors.push(`${rel}: duplicate skill name '${fields.name}'`);
  } else {
    seenNames.add(fields.name);
  }

  if (!fields.version || !/^\d+\.\d+\.\d+$/.test(fields.version)) {
    errors.push(`${rel}: missing or invalid SemVer 'version' (expected X.Y.Z)`);
  }
  if (!fields.released || !/^\d{4}-\d{2}-\d{2}$/.test(fields.released)) {
    errors.push(`${rel}: missing or invalid 'released' date (expected YYYY-MM-DD)`);
  }
  if (!fields.description || fields.description.length < 30 || fields.description.length > 1024) {
    errors.push(`${rel}: 'description' must be between 30 and 1024 characters`);
  } else if (!/\bnot for\b/i.test(fields.description)) {
    (values.strict ? errors : warnings).push(`${rel}: description lacks 'Not for ...' boundary clause`);
  }

  if (totalLines > 150) {
    errors.push(`${rel}: ${totalLines} lines exceeds studio concise limit of 150 lines (extract complex steps to workflows/ or tools/)`);
  }
  if (!/^## Gotchas\b/m.test(body)) {
    (values.strict ? errors : warnings).push(`${rel}: missing '## Gotchas' section`);
  }
  if (/\]\(file:\/\/|[A-Za-z]:\\[A-Za-z]/.test(content)) {
    errors.push(`${rel}: contains non-portable absolute path or file:// URI`);
  }

  for (const linkMatch of body.matchAll(/\]\(([^)#\s]+)(?:#[^)]+)?\)/g)) {
    const target = linkMatch[1];
    if (/^(https?:|mailto:)/i.test(target) || target.includes('<')) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) {
      errors.push(`${rel}: broken relative link '${target}'`);
    }
  }
}

const ok = errors.length === 0;
if (values.json) {
  process.stdout.write(JSON.stringify({
    tool: 'validate-skills',
    ok,
    root: rootDir,
    filesChecked,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings
  }, null, 2) + '\n');
} else {
  for (const e of errors) process.stdout.write(`ERROR: ${e}\n`);
  for (const w of warnings) process.stdout.write(`WARN: ${w}\n`);
  process.stdout.write(`Summary: checked ${filesChecked} SKILL.md files — ${errors.length} error(s), ${warnings.length} warning(s).\n`);
}
process.exit(ok ? 0 : 1);

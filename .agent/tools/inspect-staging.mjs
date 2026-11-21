#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node inspect-staging.mjs [--repo <path>] [--message "<commit-msg>"] [--json] [--help]

Inspects Git staged files before committing:
  - Blocks .env secrets, project.local.yaml, .agent-runs/, References/, and Engine temp dirs
  - Warns when heavy binary assets (> 512 KB) are staged without Git LFS tracking
  - Validates Conventional Commit message format when --message is provided
`;

const { values } = parseArgs({
  options: {
    repo: { type: 'string', default: process.cwd() },
    message: { type: 'string', default: '' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const repoRoot = path.resolve(values.repo);
const FORBIDDEN_PATTERNS = [
  { re: /(^|\/)\.env(\..+)?$/i, allow: /(^|\/)\.env\.example$/i, reason: 'Secret .env file must never be committed' },
  { re: /(^|\/)project\.local\.yaml$/i, reason: 'Local developer override file must remain gitignored' },
  { re: /(^|\/)\.agent-runs\//i, reason: 'Ephemeral agent scratch directory must not be committed' },
  { re: /^References\//i, reason: 'Local References/ directory is excluded from repository pushes' },
  { re: /(^|\/)(Library|Temp|Obj|Logs|UserSettings)\//, reason: 'Unity generated cache directory' },
  { re: /(^|\/)\.godot\//, reason: 'Godot generated cache directory' },
  { re: /(^|\/)(Intermediate|Saved|DerivedDataCache|Binaries)\//, reason: 'Unreal generated cache/build directory' },
  { re: /(^|\/)node_modules\//, reason: 'Node dependency directory' }
];
const BINARY_EXT = /\.(psd|blend|fbx|glb|wav|ogg|mp3|mp4|tga|exr|hdr|tif|tiff|png|jpg)$/i;
const COMMIT_RE = /^(feat|fix|perf|balance|art|audio|docs|refactor|test|chore|build)(\([a-z0-9_/-]+\))?!?: [^\s].{2,70}$/;

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

const errors = [];
const warnings = [];
let branch = '';
let staged = [];
let unstagedCount = 0;

try {
  branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  const stagedRaw = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  staged = stagedRaw ? stagedRaw.split(/\r?\n/).filter(Boolean) : [];
  const statusRaw = git(['status', '--porcelain']);
  unstagedCount = statusRaw ? statusRaw.split(/\r?\n/).filter(l => l && !/^[MARCD] /.test(l)).length : 0;
} catch (err) {
  const msg = `Not a valid git repository at ${repoRoot}: ${err.message}`;
  if (values.json) process.stdout.write(JSON.stringify({ ok: false, errors: [msg] }, null, 2) + '\n');
  else process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(2);
}

for (const file of staged) {
  const norm = file.replace(/\\/g, '/');
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.re.test(norm) && !(rule.allow && rule.allow.test(norm))) {
      errors.push(`${norm}: ${rule.reason}`);
    }
  }
  const full = path.join(repoRoot, file);
  if (BINARY_EXT.test(norm) && fs.existsSync(full)) {
    const size = fs.statSync(full).size;
    if (size > 524288) {
      try {
        const attr = git(['check-attr', 'filter', '--', file]);
        if (!attr.includes('filter: lfs')) {
          warnings.push(`${norm}: binary asset (${Math.round(size / 1024)} KB) staged without Git LFS tracking`);
        }
      } catch {}
    }
  }
}

if (values.message) {
  const subject = values.message.split(/\r?\n/)[0].trim();
  if (!COMMIT_RE.test(subject) || subject.endsWith('.')) {
    errors.push(`Commit subject '${subject}' violates Conventional Commits (<type>(<scope>): <imperative summary <= 72 chars, no trailing dot>)`);
  }
}

const ok = errors.length === 0;
const report = {
  tool: 'inspect-staging',
  ok,
  branch,
  stagedCount: staged.length,
  unstagedOrUntrackedCount: unstagedCount,
  stagedFiles: staged,
  errors,
  warnings
};

if (values.json) {
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
} else {
  process.stdout.write(`Branch: ${branch} | Staged: ${staged.length} | Unstaged/Untracked: ${unstagedCount}\n`);
  for (const e of errors) process.stdout.write(`ERROR: ${e}\n`);
  for (const w of warnings) process.stdout.write(`WARN: ${w}\n`);
  process.stdout.write(`Result: ${ok ? 'CLEAN' : 'BLOCKED'}\n`);
}
process.exit(ok ? 0 : 1);

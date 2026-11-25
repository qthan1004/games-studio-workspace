#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node inspect-staging.mjs [--repo <path>] [--message "<commit-msg>"] [--json] [--help]

Inspects Git staged files before committing:
  - Blocks .env secrets, project.local.yaml, .agent-runs/, References/, and Engine temp dirs
  - Blocks orphan 160000 submodule gitlinks missing a valid .gitmodules URL entry
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

function git(args, cwd = repoRoot) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Parse staged .gitmodules from the Git index into a map keyed by submodule name.
function parseIndexedGitmodules() {
  try {
    git(['cat-file', '-e', ':.gitmodules']);
  } catch {
    return { existsInIndex: false, validSyntax: true, entries: [] };
  }
  let raw = '';
  try {
    raw = git(['config', '--blob', ':.gitmodules', '--list']);
  } catch {
    return { existsInIndex: true, validSyntax: false, entries: [] };
  }
  const byName = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq);
    const val = line.slice(eq + 1).trim();
    const m = key.match(/^submodule\.(.+)\.(path|url|branch)$/i);
    if (!m) continue;
    const [, name, rawField] = m;
    const cur = byName.get(name) || { name, path: '', url: '', branch: '' };
    const field = rawField.toLowerCase();
    cur[field] = field === 'path' ? val.replace(/\\/g, '/') : val;
    byName.set(name, cur);
  }
  return { existsInIndex: true, validSyntax: true, entries: [...byName.values()] };
}

const errors = [];
const warnings = [];
let branch = '';
let staged = [];
let cachedChangedAll = [];
let unstagedCount = 0;
let unstagedGitmodules = false;
const indexEntries = new Map();

try {
  try { branch = git(['symbolic-ref', '--short', 'HEAD']); } catch { branch = git(['rev-parse', '--abbrev-ref', 'HEAD']); }
  const stagedRaw = git(['-c', 'core.quotepath=false', 'diff', '--cached', '--name-only', '--diff-filter=ACMRT']);
  staged = stagedRaw ? stagedRaw.split(/\r?\n/).filter(Boolean) : [];
  const cachedAllRaw = git(['-c', 'core.quotepath=false', 'diff', '--cached', '--name-only']);
  cachedChangedAll = cachedAllRaw ? cachedAllRaw.split(/\r?\n/).filter(Boolean) : [];
  const stageInfo = git(['-c', 'core.quotepath=false', 'ls-files', '--stage']);
  for (const line of stageInfo.split(/\r?\n/).filter(Boolean)) {
    const m = line.match(/^(\d{6})\s+([0-9a-f]+)\s+\d+\t(.+)$/);
    if (m) indexEntries.set(m[3].replace(/\\/g, '/'), { mode: m[1], sha: m[2] });
  }
  unstagedGitmodules = Boolean(git(['diff', '--name-only', '--', '.gitmodules']));
  const statusRaw = git(['status', '--porcelain']);
  unstagedCount = statusRaw ? statusRaw.split(/\r?\n/).filter(l => l && !/^[MARCDT] /.test(l)).length : 0;
} catch (err) {
  const msg = `Not a valid git repository at ${repoRoot}: ${err.message}`;
  if (values.json) process.stdout.write(JSON.stringify({ ok: false, errors: [msg] }, null, 2) + '\n');
  else process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(2);
}

const gitlinksToInspect = new Set();
for (const file of staged) {
  const norm = file.replace(/\\/g, '/');
  for (const rule of FORBIDDEN_PATTERNS) {
    if (rule.re.test(norm) && !(rule.allow && rule.allow.test(norm))) {
      errors.push(`${norm}: ${rule.reason}`);
    }
  }
  if (indexEntries.get(norm)?.mode === '160000') {
    gitlinksToInspect.add(norm);
  }
  const full = path.join(repoRoot, file);
  if (BINARY_EXT.test(norm) && fs.existsSync(full) && fs.statSync(full).isFile()) {
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

// Re-validate all indexed gitlinks whenever .gitmodules itself is staged or deleted.
if (cachedChangedAll.some(f => f.replace(/\\/g, '/') === '.gitmodules')) {
  for (const [norm, info] of indexEntries.entries()) {
    if (info.mode === '160000') gitlinksToInspect.add(norm);
  }
}

if (gitlinksToInspect.size > 0) {
  const parsedModules = parseIndexedGitmodules();
  for (const norm of gitlinksToInspect) {
    const { sha } = indexEntries.get(norm);
    if (unstagedGitmodules) {
      errors.push(`${norm}: .gitmodules has unstaged modifications (run git add .gitmodules)`);
    }
    let matchedEntry = null;
    if (!parsedModules.existsInIndex) {
      errors.push(`${norm}: orphan 160000 gitlink staged without .gitmodules in index (run git add .gitmodules)`);
    } else if (!parsedModules.validSyntax) {
      errors.push(`${norm}: staged .gitmodules contains invalid git-config syntax`);
    } else {
      matchedEntry = parsedModules.entries.find(e => e.path === norm) || null;
      if (!matchedEntry) {
        errors.push(`${norm}: orphan 160000 gitlink missing matching submodule.<name>.path in staged .gitmodules`);
      } else if (!matchedEntry.url) {
        errors.push(`${norm}: submodule '${matchedEntry.name}' missing non-empty url in staged .gitmodules`);
      }
    }

    // Verify staged gitlink SHA is reachable on origin when local submodule repo has origin refs.
    const subDir = path.join(repoRoot, norm);
    let isInitializedSubmodule = false;
    if (fs.existsSync(path.join(subDir, '.git'))) {
      try {
        git(['rev-parse', '--git-dir'], subDir);
        isInitializedSubmodule = true;
      } catch {
        isInitializedSubmodule = false;
      }
    }
    if (isInitializedSubmodule) {
      let originRefs = '';
      try {
        originRefs = git(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/'], subDir);
      } catch {
        originRefs = '';
      }
      if (originRefs) {
        const targetBranch = matchedEntry?.branch || '';
        let hasTargetBranchRef = false;
        if (targetBranch) {
          try {
            git(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${targetBranch}`], subDir);
            hasTargetBranchRef = true;
          } catch {
            hasTargetBranchRef = false;
          }
        }
        if (hasTargetBranchRef) {
          try {
            git(['merge-base', '--is-ancestor', sha, `refs/remotes/origin/${targetBranch}`], subDir);
          } catch {
            errors.push(`${norm}: staged gitlink ${sha.slice(0, 7)} is not an ancestor of origin/${targetBranch} (checkout '${targetBranch}' and push submodule first)`);
          }
        } else {
          let reachableOnOrigin = false;
          try {
            const containing = git(['branch', '-r', '--contains', sha], subDir);
            reachableOnOrigin = containing
              .split(/\r?\n/)
              .map(s => s.replace(/^\*?\s+/, '').trim())
              .some(s => s.startsWith('origin/'));
          } catch {
            reachableOnOrigin = false;
          }
          if (!reachableOnOrigin) {
            errors.push(`${norm}: staged gitlink ${sha.slice(0, 7)} is not reachable on any origin/* remote-tracking ref`);
          }
        }
      }
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

#!/usr/bin/env node
// fleet.mjs - Windows-friendly worktree fleet helper for the captain/crew skills.
// Zero dependencies (Node >= 18, git >= 2.20). Output is compact TOON-style text.
//
// Commands:
//   spawn    --run R --task T --repo PATH --base WORK_BRANCH [--branch CHILD_BRANCH] [--shape ship|scout] [--open IDE_CMD] [--clip]
//   set      --run R --task T --state STATE --msg "text"        (crew/captain append a status event)
//   status   --run R [--task T]                                  (diff stats, risk flags, overlap)
//   watch    --run R [--interval 5] [--timeout 1200]             (blocks; exits on actionable event; use as background command)
//   report   --run R                                             (bearings data: decide / done / running / queued)
//   teardown --run R --task T --target BRANCH                    (refuses unlanded or dirty work; never forces)
//   runs                                                          (list runs)
//
// State root: $AGENT_RUNS_DIR, else nearest ancestor of cwd containing .agent-runs, else <repo parent>/.agent-runs on spawn.
// States: queued running needs-input blocked done failed landed closed. A status line is a wake event, not proof.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn as spawnProc } from 'node:child_process';

const STATES = ['queued', 'running', 'needs-input', 'blocked', 'done', 'failed', 'landed', 'closed'];
const ACTIONABLE = new Set(['needs-input', 'blocked', 'done', 'failed']);
const RISK_PATHS = [
  [/(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/, 'deps'],
  [/(^|\/)(\.agent|\.agents|\.claude|\.codex|\.kiro|\.cursor|\.gemini)\//, 'agent-config'],
  [/(^|\/)(AGENTS|CLAUDE|GEMINI|PREFLIGHT)\.md$/, 'agent-config'],
  [/(^|\/)(\.env[^/]*|runtime-env\.js)$/, 'env'],
];

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = {};
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    opt[k] = v;
  }
}

const now = () => {
  const d = new Date();
  const off = -d.getTimezoneOffset();
  const s = new Date(d.getTime() + off * 60000).toISOString().slice(0, 19);
  const sign = off >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
  const mm = String(Math.abs(off) % 60).padStart(2, '0');
  return `${s}${sign}${hh}:${mm}`;
};
const q = s => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, "'")}"` : String(s));
const fail = (msg, next) => { console.log(`error: ${msg}`); if (next) console.log(`next: ${next}`); process.exit(2); };
const need = (...keys) => { for (const k of keys) if (!opt[k] || opt[k] === true) fail(`missing --${k}`, `node fleet.mjs help`); };
const slug = s => /^[A-Za-z0-9][\w.-]{0,60}$/.test(s);

function git(cwd, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    if (allowFail) return null;
    fail(`git ${args.join(' ')} failed in ${cwd}: ${(e.stderr || e.message).toString().trim().split('\n')[0]}`);
  }
}

function findRoot(repo) {
  if (process.env.AGENT_RUNS_DIR) return path.resolve(process.env.AGENT_RUNS_DIR);
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, '.agent-runs'))) return path.join(dir, '.agent-runs');
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  if (repo) return path.join(path.dirname(path.resolve(repo)), '.agent-runs');
  return path.join(process.cwd(), '.agent-runs');
}

const runDir = (root, run) => path.join(root, run);
const taskDir = (root, run, task) => path.join(root, run, task);

function readMeta(dir) {
  const f = path.join(dir, 'meta.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

function lastStatus(dir) {
  const f = path.join(dir, 'status');
  if (!fs.existsSync(f)) return { ts: null, state: 'unknown', msg: '', lines: 0 };
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/).filter(Boolean);
  const last = lines[lines.length - 1] || '';
  const m = last.match(/^(\S+)\s+(\S+)\s*(.*)$/);
  return m ? { ts: m[1], state: m[2], msg: m[3], lines: lines.length } : { ts: null, state: 'unknown', msg: last, lines: lines.length };
}

function age(ts) {
  if (!ts) return '-';
  const s = Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 1000));
  if (s < 90) return `${s}s`;
  if (s < 5400) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
}

function tasksOf(root, run) {
  const dir = runDir(root, run);
  if (!fs.existsSync(dir)) fail(`run not found: ${dir}`, 'node fleet.mjs runs');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'meta.json')))
    .map(e => e.name)
    .sort();
}

function appendStatus(dir, state, msg) {
  const line = `${now()} ${state} ${String(msg || '').replace(/\r?\n/g, ' ').slice(0, 300)}\n`;
  fs.appendFileSync(path.join(dir, 'status'), line, 'utf8');
}

// ---------- spawn ----------
function cmdSpawn() {
  need('run', 'task', 'repo', 'base');
  if (opt.cli) fail('spawn prepares an unfilled brief; fill it and launch the interactive CLI separately');
  const { run, task, base } = opt;
  if (!slug(run) || !slug(task)) fail('run and task must be simple slugs (letters, digits, . _ -)');
  const shape = opt.shape || 'ship';
  if (!['ship', 'scout'].includes(shape)) fail('--shape must be ship or scout');
  const repo = path.resolve(opt.repo);
  const top = git(repo, ['rev-parse', '--show-toplevel']);
  if (path.resolve(top) !== repo) fail(`--repo must be the repository root (${top})`);
  if (/^(ci|merge-ci)([/_-]|$)/i.test(base) || /(^|\/)(ci|merge-ci)$/i.test(base)) fail(`refusing base "${base}": never build work on ci or merge-ci branches`);
  if (!/^(feature|fix-bug|hot-fix)\/.+/.test(base)) fail('--base must be the parent feature/fix-bug/hot-fix work branch, not main or a commit');
  if (git(repo, ['show-ref', '--verify', '--quiet', `refs/heads/${base}`], { allowFail: true }) === null) fail(`parent work branch not found locally: ${base}`);
  if (git(repo, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`], { allowFail: true }) === null) fail(`base not found: ${base}`, 'git fetch, or pick an existing local branch');
  const branch = opt.branch || `${base}-${task}`;
  if (typeof branch !== 'string' || !branch.startsWith(`${base}-`) || git(repo, ['check-ref-format', '--branch', branch], { allowFail: true }) === null) fail('--branch must be a valid task branch under the parent work branch name');
  if (git(repo, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { allowFail: true }) !== null) fail(`branch already exists: ${branch}`, 'pick another --task or reuse the existing worktree (relaunch, do not respawn)');
  const wt = path.join(path.dirname(repo), `${path.basename(repo)}-wt`, task);
  if (fs.existsSync(wt)) fail(`worktree path exists: ${wt}`, 'relaunch in the existing worktree instead of spawning a duplicate');

  const root = findRoot(repo);
  const tdir = taskDir(root, run, task);
  if (fs.existsSync(path.join(tdir, 'meta.json'))) fail(`task already registered: ${tdir}`);
  const dirty = git(repo, ['status', '--porcelain']);

  git(repo, ['worktree', 'add', '-b', branch, wt, base]);
  fs.mkdirSync(tdir, { recursive: true });
  const baseSha = git(repo, ['rev-parse', base]);
  const meta = { run, task, shape, repo, base, baseSha, branch, worktree: wt, created: now() };
  fs.writeFileSync(path.join(tdir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  const self = path.resolve(process.argv[1]);
  const skills = path.dirname(path.dirname(path.dirname(self)));
  const tpl = path.join(path.dirname(self), '..', 'references', 'brief-template.md');
  let brief = fs.existsSync(tpl) ? fs.readFileSync(tpl, 'utf8') : '# Brief {{RUN}}/{{TASK}}\n';
  const fill = {
    RUN: run, TASK: task, SHAPE: shape, REPO: repo, BASE: base, BASE_SHA: baseSha, BRANCH: branch, WORKTREE: wt,
    TASK_DIR: tdir, FLEET: self, SKILLS: skills, CREATED: meta.created,
  };
  brief = brief.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in fill ? fill[k] : m));
  const briefPath = path.join(tdir, 'brief.md');
  fs.writeFileSync(briefPath, brief, 'utf8');
  for (const f of ['inbox.md', 'notes.md']) if (!fs.existsSync(path.join(tdir, f))) fs.writeFileSync(path.join(tdir, f), f === 'inbox.md' ? '# Inbox (captain -> crew). Newest last. Mark handled items with [x].\n' : '# Crew notes (durable memory across slices and compaction)\n', 'utf8');
  appendStatus(tdir, 'queued', `spawned ${shape} on ${branch} from ${base}`);

  const launch = `Read ${briefPath} and follow it exactly, starting with ${path.join(skills, 'crew', 'SKILL.md')}.`;
  console.log(`spawned: ${run}/${task}`);
  console.log(`shape: ${shape}`);
  console.log(`worktree: ${wt}`);
  console.log(`branch: ${branch} (from ${base} @ ${baseSha.slice(0, 9)})`);
  console.log(`brief: ${briefPath}  (fill User intent, Spec, Acceptance, Permissions before launch)`);
  if (dirty) console.log('note: primary checkout has local changes; they are untouched and not in the worktree');
  console.log(`launch_line: ${launch}`);

  if (opt.clip) {
    try { execFileSync('clip', { input: launch }); console.log('clipboard: launch_line copied'); } catch { console.log('clipboard: unavailable'); }
  }
  if (opt.open && opt.open !== true) {
    try {
      spawnProc(opt.open, [wt], { detached: true, stdio: 'ignore', shell: true }).unref();
      console.log(`opened: ${opt.open} ${wt}`);
    } catch (e) { console.log(`open: failed (${e.message})`); }
  }
  console.log('next: edit brief, then launch crew; run `node fleet.mjs watch --run ' + run + '` as a background command');
}

// ---------- set ----------
function cmdSet() {
  need('run', 'task', 'state');
  if (!STATES.includes(opt.state)) fail(`state must be one of ${STATES.join('|')}`);
  const root = findRoot();
  const tdir = taskDir(root, opt.run, opt.task);
  if (!readMeta(tdir)) fail(`task not found: ${tdir}`);
  appendStatus(tdir, opt.state, opt.msg === true ? '' : opt.msg);
  console.log(`ok: ${opt.run}/${opt.task} -> ${opt.state}`);
}

// ---------- status ----------
function changedFiles(meta) {
  if (!fs.existsSync(meta.worktree)) return { exists: false };
  const committed = (git(meta.worktree, ['diff', '--name-status', `${meta.baseSha}...HEAD`], { allowFail: true }) || '').split('\n').filter(Boolean);
  const working = (git(meta.worktree, ['status', '--porcelain'], { allowFail: true }) || '').split('\n').filter(Boolean);
  const ahead = Number(git(meta.worktree, ['rev-list', '--count', `${meta.baseSha}..HEAD`], { allowFail: true }) || 0);
  const files = new Map();
  for (const l of committed) { const [st, ...p] = l.split('\t'); files.set(p[p.length - 1], st[0]); }
  for (const l of working) { const st = l.slice(0, 2).trim(); const p = l.slice(3).split(' -> ').pop(); files.set(p, st[0] || 'M'); }
  const flags = new Set();
  for (const [f, st] of files) {
    const fp = f.replace(/\\/g, '/');
    for (const [re, flag] of RISK_PATHS) if (re.test(fp)) flags.add(flag);
    if (st === 'D' && /(\.|_|\/)(test|spec)s?(\.|\/)|__tests__\//i.test(fp)) flags.add('test-deleted');
  }
  const branch = git(meta.worktree, ['rev-parse', '--abbrev-ref', 'HEAD'], { allowFail: true });
  if (branch && branch !== meta.branch) flags.add(`wrong-branch:${branch}`);
  return { exists: true, files, ahead, dirty: working.length, flags };
}

function cmdStatus() {
  need('run');
  const root = findRoot();
  const tasks = opt.task && opt.task !== true ? [opt.task] : tasksOf(root, opt.run);
  const rows = [];
  const byFile = new Map();
  for (const t of tasks) {
    const tdir = taskDir(root, opt.run, t);
    const meta = readMeta(tdir);
    if (!meta) { rows.push(`  ${t},missing,-,-,-,-,-`); continue; }
    const st = lastStatus(tdir);
    const c = changedFiles(meta);
    if (!c.exists) { rows.push(`  ${t},${st.state},${age(st.ts)},-,-,-,worktree-missing`); continue; }
    for (const f of c.files.keys()) byFile.set(f, [...(byFile.get(f) || []), t]);
    rows.push(`  ${t},${st.state},${age(st.ts)},${c.ahead},${c.dirty},${c.files.size},${[...c.flags].join('|') || '-'}`);
  }
  console.log(`run: ${opt.run}`);
  console.log(`tasks[${rows.length}]{task,state,age,commits,dirty,files,flags}:`);
  console.log(rows.join('\n'));
  const overlap = [...byFile].filter(([, ts]) => ts.length > 1);
  if (overlap.length) {
    console.log(`overlap[${overlap.length}]{file,tasks}:`);
    for (const [f, ts] of overlap.slice(0, 20)) console.log(`  ${q(f)},${ts.join('|')}`);
  } else console.log('overlap: none');
  console.log('note: states are crew claims; verify in the worktree before reporting');
}

// ---------- watch ----------
function snapshot(root, run) {
  const out = {};
  for (const t of tasksOf(root, run)) out[t] = lastStatus(taskDir(root, run, t));
  return out;
}

function cmdWatch() {
  need('run');
  const root = findRoot();
  const interval = Math.max(2, Number(opt.interval) || 5) * 1000;
  const timeout = Math.max(30, Number(opt.timeout) || 1200) * 1000;
  const seenFile = path.join(runDir(root, opt.run), '.seen.json');
  const seen = fs.existsSync(seenFile) ? JSON.parse(fs.readFileSync(seenFile, 'utf8')) : {};
  const start = Date.now();
  const tick = () => {
    const snap = snapshot(root, opt.run);
    const events = [];
    for (const [t, s] of Object.entries(snap)) {
      const key = `${s.lines}`;
      if (seen[t] !== key && ACTIONABLE.has(s.state)) events.push([t, s]);
    }
    if (events.length) {
      for (const [t, s] of events) seen[t] = `${s.lines}`;
      fs.writeFileSync(seenFile, JSON.stringify(seen), 'utf8');
      console.log(`run: ${opt.run}`);
      console.log(`events[${events.length}]{task,state,age,msg}:`);
      for (const [t, s] of events) console.log(`  ${t},${s.state},${age(s.ts)},${q(s.msg)}`);
      const hints = events.map(([t, s]) => (s.state === 'done' ? `verify ${t} (fleet status + rerun gates + adversarial-review)` : s.state === 'needs-input' ? `answer ${t} via inbox.md (decision policy)` : `inspect ${t} (recovery ladder)`));
      console.log(`next: ${hints.join(' ; ')}`);
      process.exit(0);
    }
    if (Date.now() - start >= timeout) {
      console.log(`heartbeat: no actionable events in ${Math.round(timeout / 60000)}m`);
      console.log(`states: ${Object.entries(snap).map(([t, s]) => `${t}=${s.state}(${age(s.ts)})`).join(' ') || 'none'}`);
      console.log('next: check stale running tasks (age); re-arm watch if healthy');
      process.exit(3);
    }
    setTimeout(tick, interval);
  };
  tick();
}

// ---------- report ----------
function cmdReport() {
  need('run');
  const root = findRoot();
  const sections = { decide: [], done: [], running: [], queued: [] };
  for (const t of tasksOf(root, opt.run)) {
    const tdir = taskDir(root, opt.run, t);
    const s = lastStatus(tdir);
    const meta = readMeta(tdir);
    let outcome = '';
    const rp = path.join(tdir, 'report.md');
    if (fs.existsSync(rp)) {
      const m = fs.readFileSync(rp, 'utf8').match(/^\s*[-*]?\s*\**Outcome\**\s*[:-]\s*(.+)$/im);
      if (m) outcome = m[1].trim().slice(0, 160);
    }
    const row = `  ${t},${meta.shape},${s.state},${age(s.ts)},${q(outcome || s.msg)}`;
    if (s.state === 'needs-input' || s.state === 'blocked' || s.state === 'failed') sections.decide.push(row);
    else if (['done', 'landed', 'closed'].includes(s.state)) sections.done.push(row);
    else if (s.state === 'running') sections.running.push(row);
    else sections.queued.push(row);
  }
  const away = path.join(runDir(root, opt.run), 'away.md');
  console.log(`run: ${opt.run}${fs.existsSync(away) ? ' (away posture active)' : ''}`);
  const label = { decide: 'can_quyet', done: 'da_xong', running: 'dang_chay', queued: 'hang_cho' };
  for (const [k, rows] of Object.entries(sections)) {
    if (rows.length) { console.log(`${label[k]}[${rows.length}]{task,shape,state,age,outcome}:`); console.log(rows.join('\n')); }
    else console.log(`${label[k]}: none`);
  }
  console.log('next: verify every done item before calling it done; render the four sections in Vietnamese');
}

// ---------- teardown ----------
function cmdTeardown() {
  need('run', 'task', 'target');
  const root = findRoot();
  const tdir = taskDir(root, opt.run, opt.task);
  const meta = readMeta(tdir);
  if (!meta) fail(`task not found: ${tdir}`);
  if (opt.target !== meta.base) fail(`target must be the recorded parent work branch: ${meta.base}`);
  const expectedWorktree = path.join(path.dirname(meta.repo), `${path.basename(meta.repo)}-wt`, meta.task);
  if (path.resolve(meta.worktree) !== path.resolve(expectedWorktree)) fail('worktree target is outside the recorded fleet directory');
  const reasons = [];
  if (fs.existsSync(meta.worktree)) {
    const dirty = git(meta.worktree, ['status', '--porcelain']);
    if (dirty) reasons.push(`uncommitted changes (${dirty.split('\n').length} paths)`);
  }
  const landed = git(meta.repo, ['merge-base', '--is-ancestor', meta.branch, opt.target], { allowFail: true }) !== null;
  if (!landed) reasons.push(`worker branch ${meta.branch} is not merged into ${opt.target}`);
  if (reasons.length) {
    console.log(`refused: ${opt.run}/${opt.task}`);
    console.log(`reasons[${reasons.length}]:`);
    for (const r of reasons) console.log(`  ${r}`);
    console.log('next: investigate; land the work or get an explicit discard decision from the user. Never force.');
    process.exit(1);
  }
  if (fs.existsSync(meta.worktree)) git(meta.repo, ['worktree', 'remove', meta.worktree]);
  const del = git(meta.repo, ['branch', '-d', meta.branch], { allowFail: true });
  if (del === null) fail('worktree removed but Git refused safe branch deletion; branch retained and task not closed');
  appendStatus(tdir, 'closed', `teardown ok (target ${opt.target})`);
  console.log(`closed: ${opt.run}/${opt.task}`);
  console.log(`worktree: removed`);
  console.log(`branch: ${del === null ? 'kept (git refused safe delete)' : 'deleted'}`);
}

function cmdRuns() {
  const root = findRoot();
  if (!fs.existsSync(root)) { console.log(`runs: none (${root})`); return; }
  const runs = fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort();
  console.log(`root: ${root}`);
  console.log(`runs[${runs.length}]{run,tasks}:`);
  for (const r of runs) {
    let n = 0;
    try { n = tasksOf(root, r).length; } catch { /* ignore */ }
    console.log(`  ${r},${n}`);
  }
}

function help() {
  console.log(fs.readFileSync(process.argv[1], 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'));
}

const table = { spawn: cmdSpawn, set: cmdSet, status: cmdStatus, watch: cmdWatch, report: cmdReport, teardown: cmdTeardown, runs: cmdRuns, help };
(table[cmd] || help)();

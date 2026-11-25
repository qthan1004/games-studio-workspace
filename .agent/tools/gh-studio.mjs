#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node gh-studio.mjs <subcommand> [options]

Cloud-first GitHub Repo, Project Board, Milestones, Issues & MR helper:
  repo-init      --repo <owner/slug> --project-dir <Projects/slug> [--public] [--no-submodule] [--title "<Board Title>"] [--json]
  submodule-sync --repo <owner/slug> --project-dir <Projects/slug> [--base main] [--json]
  milestone      --repo <owner/repo> --title "<M1-Foundation>" [--body "<desc>"] [--json]
  list           --repo <owner/repo> [--label <tag>] [--state open|closed] [--limit 20] [--json]
  view           --repo <owner/repo> --issue <number> [--json]
  create         --repo <owner/repo> --title "<title>" (--body "<body>" | --body-file <md>) [--label "a,b"] [--milestone "<m>"] [--json]
  close          --repo <owner/repo> --issue <number> [--body "<closing-summary>" | --body-file <md>] [--json]
  comment        --repo <owner/repo> --issue <number> (--body "<md>" | --body-file <md>) [--json]
  mr-create      --repo <owner/repo> --title "<title>" (--body-file <md> | --body "<md>") [--base main] [--head <branch>] [--draft] [--json]
  mr-edit        --repo <owner/repo> --pr <number|branch> (--body-file <md> | --body "<md>") [--title "<title>"] [--json]
  mr-merge       --repo <owner/repo> --pr <number|branch> [--method merge|squash|rebase] [--delete-branch] [--json]
  mr-list        --repo <owner/repo> [--state open|closed|merged|all] [--limit 20] [--json]
  mr-view        --repo <owner/repo> --pr <number|branch> [--json]
`;

const DEPT_LABELS = [
  ['Producer', 'e59a38', 'Producer & Orchestration'],
  ['Research', '2f9e8f', 'Pre-Production Research'],
  ['Narrative', 'c9655b', '01 Narrative & Lore'],
  ['Design', 'e06d44', '02 Game Design'],
  ['Balance', '3ca370', '03 Balance & Economy'],
  ['Level', '749c4e', '04 Level & World'],
  ['Art-Audio', 'd65d92', '05 Art, VFX & Audio'],
  ['Architect', '4c78a8', '06 Architecture & Tech'],
  ['Engineer', '3898b8', 'Gameplay Engineering & Tests'],
  ['QA', '8264b5', '07 Independent QA & Critique']
];

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');

function runGh(args, cwd = process.cwd()) {
  return execFileSync('gh', args, { cwd, encoding: 'utf8' }).trim();
}

function runGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Resolve target workspace root from explicit override, script workspace, or active CWD.
function resolveWorkspaceRoot(absProj, wsOverride = '') {
  if (wsOverride) {
    return fs.existsSync(wsOverride) ? fs.realpathSync(wsOverride) : path.resolve(wsOverride);
  }
  const defaultWs = fs.existsSync(workspaceRoot) ? fs.realpathSync(workspaceRoot) : workspaceRoot;
  if (/^Projects\/[^/]+$/.test(path.relative(defaultWs, absProj).replace(/\\/g, '/'))) {
    return defaultWs;
  }
  const cwdWs = fs.existsSync(process.cwd()) ? fs.realpathSync(process.cwd()) : process.cwd();
  if (fs.existsSync(path.join(cwdWs, '.git')) && /^Projects\/[^/]+$/.test(path.relative(cwdWs, absProj).replace(/\\/g, '/'))) {
    return cwdWs;
  }
  return defaultWs;
}

// Register or sync a standalone Projects/<slug> repository as a workspace Git submodule.
export function registerWorkspaceSubmodule(repoSlug, projDir, branch = 'main', wsOverride = '') {
  const sshUrl = `git@github.com:${repoSlug}.git`;
  const absProj = fs.existsSync(projDir) ? fs.realpathSync(projDir) : path.resolve(projDir);
  const wsRoot = resolveWorkspaceRoot(absProj, wsOverride);
  const relPath = path.relative(wsRoot, absProj).replace(/\\/g, '/');
  if (!fs.existsSync(path.join(wsRoot, '.git')) || !/^Projects\/[^/]+$/.test(relPath)) {
    return { registered: false, path: relPath, url: sshUrl };
  }
  if (!fs.existsSync(path.join(absProj, '.git'))) {
    throw new Error(`Target directory is not a git repository: ${absProj}`);
  }
  const currentBranch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], absProj);
  if (currentBranch !== branch) {
    throw new Error(`Submodule '${relPath}' is on branch '${currentBranch}' (expected '${branch}'); checkout '${branch}' before syncing.`);
  }
  const headSha = runGit(['rev-parse', 'HEAD'], absProj);
  let hasOriginBranch = false;
  try {
    runGit(['show-ref', '--verify', '--quiet', `refs/remotes/origin/${branch}`], absProj);
    hasOriginBranch = true;
  } catch {
    hasOriginBranch = false;
  }
  if (hasOriginBranch) {
    try {
      runGit(['merge-base', '--is-ancestor', headSha, `refs/remotes/origin/${branch}`], absProj);
    } catch {
      throw new Error(`Submodule '${relPath}' HEAD (${headSha.slice(0, 7)}) has unpushed or diverged commits relative to 'origin/${branch}'.`);
    }
  } else {
    let originRefs = '';
    try {
      originRefs = runGit(['for-each-ref', '--format=%(refname)', 'refs/remotes/origin/'], absProj);
    } catch {
      originRefs = '';
    }
    if (originRefs) {
      throw new Error(`Submodule '${relPath}' branch '${branch}' is missing 'origin/${branch}' remote tracking ref; push '${branch}' first.`);
    }
  }

  const gitmodulesPath = path.join(wsRoot, '.gitmodules');
  let subName = relPath;
  let configuredUrl = '';
  if (fs.existsSync(gitmodulesPath)) {
    try {
      const cfgLines = runGit(['config', '-f', '.gitmodules', '--list'], wsRoot);
      for (const line of cfgLines.split(/\r?\n/)) {
        const eq = line.indexOf('=');
        if (eq < 0) continue;
        const m = line.slice(0, eq).match(/^submodule\.(.+)\.path$/i);
        if (m && line.slice(eq + 1).trim().replace(/\\/g, '/') === relPath) {
          subName = m[1];
          break;
        }
      }
      configuredUrl = runGit(['config', '-f', '.gitmodules', '--get', `submodule.${subName}.url`], wsRoot);
    } catch {
      configuredUrl = '';
    }
  }
  const indexEntry = runGit(['-c', 'core.quotepath=false', 'ls-files', '--stage', '--', relPath], wsRoot);
  if (!configuredUrl || !indexEntry.startsWith('160000 ')) {
    // Register project sub-repo in .gitmodules and add its 160000 gitlink.
    runGit(['submodule', 'add', '-f', '-b', branch, sshUrl, relPath], wsRoot);
  } else {
    // Sync existing .gitmodules URL and tracked branch when already registered.
    if (configuredUrl !== sshUrl) {
      runGit(['config', '-f', '.gitmodules', `submodule.${subName}.url`, sshUrl], wsRoot);
    }
    let configuredBranch = '';
    try {
      configuredBranch = runGit(['config', '-f', '.gitmodules', '--get', `submodule.${subName}.branch`], wsRoot);
    } catch {
      configuredBranch = '';
    }
    if (configuredBranch !== branch) {
      runGit(['config', '-f', '.gitmodules', `submodule.${subName}.branch`, branch], wsRoot);
    }
    runGit(['submodule', 'sync', '--', relPath], wsRoot);
  }
  // Absorb nested .git directory and stage both .gitmodules and the gitlink pointer.
  runGit(['submodule', 'absorbgitdirs', relPath], wsRoot);
  runGit(['add', '--', '.gitmodules', relPath], wsRoot);
  return { registered: true, path: relPath, url: sshUrl, branch, commit: headSha };
}

function resolveBody(opts = {}) {
  let raw = '';
  const bodyFile = opts['body-file'] ?? '';
  if (bodyFile) {
    const p = path.resolve(bodyFile);
    if (!fs.existsSync(p)) throw new Error(`Body file not found: ${p}`);
    raw = fs.readFileSync(p, 'utf8');
  } else {
    raw = opts.body || '';
  }
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

// Validate Markdown code fences, inline spans, and heading newlines before GitHub submission.
export function validateMarkdownFormatting(markdown, label = 'Markdown body') {
  if (!markdown) return;
  if (markdown.includes('\\n') && !markdown.includes('\n')) {
    throw new Error(`${label} contains literal escaped '\\n' with zero real newlines; write a real UTF-8 file and pass --body-file.`);
  }
  const lines = markdown.split('\n');
  let activeFence = null;
  const proseLines = [];
  for (const line of lines) {
    if (!activeFence) {
      const openMatch = line.match(/^[ \t]*(`{3,}|~{3,})(.*)$/);
      if (openMatch) {
        const fenceSeq = openMatch[1];
        const rest = openMatch[2] || '';
        const ch = fenceSeq[0];
        if (ch === '`' && rest.includes('`')) {
          // Treat backtick lines whose remainder contains backticks as inline prose per CommonMark 4.5.
          proseLines.push(line);
          continue;
        }
        activeFence = { char: ch, len: fenceSeq.length };
        continue;
      }
      proseLines.push(line);
    } else {
      const closeRe = new RegExp(`^[ \\t]*${activeFence.char}{${activeFence.len},}[ \\t]*$`);
      if (closeRe.test(line)) activeFence = null;
    }
  }
  if (activeFence) {
    throw new Error(`${label} has an unclosed Markdown code fence (${activeFence.char.repeat(activeFence.len)}).`);
  }
  const inlineSpanRe = /(?<!`)(`+)(?!`).+?(?<!`)\1(?!`)/g;
  const proseNoInlineCode = proseLines
    .map(l => {
      const stripped = l.replace(inlineSpanRe, 'code');
      if (/(`{3,}|~{3,})/.test(stripped)) {
        throw new Error(`${label} has an unclosed inline Markdown code fence on line: ${l.slice(0, 80)}`);
      }
      return stripped;
    })
    .join('\n');
  if (/\S[ \t]+#{2,6}[ \t]+\S/.test(proseNoInlineCode)) {
    throw new Error(`${label} has collapsed inline headings (e.g. 'text ## Heading' on one line — often caused by PowerShell string[] flattening). Ensure real newlines before every heading.`);
  }
  if (markdown.length > 220 && !markdown.includes('\n')) {
    throw new Error(`${label} (${markdown.length} chars) is a single unformatted line; break sections/lists across real newlines.`);
  }
}

export function validateMrTemplate(markdown) {
  validateMarkdownFormatting(markdown, 'MR description');
  const missing = [];
  if (!/(^|\n)##[ \t]+Name[ \t]*\n/.test(markdown)) missing.push('## Name (on its own line)');
  if (!/(^|\n)##[ \t]+Agent[ \t]*\n/.test(markdown)) missing.push('## Agent (on its own line)');
  if (!/(^|\n)##[ \t]+Description[ \t]*\n/.test(markdown)) missing.push('## Description (on its own line)');
  if (missing.length > 0) {
    throw new Error(`MR description violates studio 'mr' template; missing section(s): ${missing.join(', ')}`);
  }
}

// Execute CLI subcommands only when invoked directly as a standalone script.
const isDirectRun = Boolean(process.argv[1]) && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isDirectRun) {
  const { values, positionals } = parseArgs({
    options: {
      repo: { type: 'string', default: '' },
      'project-dir': { type: 'string', default: '' },
      issue: { type: 'string', default: '' },
      pr: { type: 'string', default: '' },
      title: { type: 'string', default: '' },
      body: { type: 'string', default: '' },
      'body-file': { type: 'string', default: '' },
      base: { type: 'string', default: 'main' },
      head: { type: 'string', default: '' },
      label: { type: 'string', default: '' },
      milestone: { type: 'string', default: '' },
      method: { type: 'string', default: 'merge' },
      state: { type: 'string', default: 'open' },
      limit: { type: 'string', default: '20' },
      public: { type: 'boolean', default: false },
      'no-submodule': { type: 'boolean', default: false },
      draft: { type: 'boolean', default: false },
      'delete-branch': { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false }
    },
    allowPositionals: true
  });

  const sub = positionals[0] || '';
  if (values.help || !sub) {
    process.stdout.write(USAGE);
    process.exit(values.help ? 0 : 2);
  }
  if (!values.repo) {
    process.stderr.write('ERROR: --repo <owner/repo> is required.\n');
    process.exit(2);
  }

  try {
    let result;
    if (sub === 'repo-init') {
      if (!values['project-dir']) throw new Error('--project-dir <Projects/slug> is required');
      const projDir = path.resolve(values['project-dir']);
      if (!fs.existsSync(path.join(projDir, '.git'))) {
        throw new Error(`Target directory is not a standalone git repository: ${projDir}`);
      }
      const targetBranch = values.base || 'main';

      // Ensure baseline commit exists on target branch before pushing remote.
      const statusOut = runGit(['status', '--porcelain'], projDir);
      let hasHead = true;
      try { runGit(['rev-parse', '--verify', 'HEAD'], projDir); } catch { hasHead = false; }
      if (!hasHead || statusOut) {
        runGit(['add', '-A'], projDir);
        try { runGit(['commit', '-m', 'chore(init): scaffold standalone studio game repository'], projDir); } catch {}
      }

      let repoUrl = '';
      try {
        const existing = JSON.parse(runGh(['repo', 'view', values.repo, '--json', 'url,sshUrl']));
        repoUrl = existing.url;
      } catch {
        const visFlag = values.public ? '--public' : '--private';
        repoUrl = runGh(['repo', 'create', values.repo, visFlag, '--source', projDir, '--remote', 'origin', '--push']);
      }

      // Ensure origin remote and push target branch if repo pre-existed.
      try { runGit(['remote', 'get-url', 'origin'], projDir); } catch {
        runGit(['remote', 'add', 'origin', `git@github.com:${values.repo}.git`], projDir);
      }
      try { runGit(['push', '-u', 'origin', targetBranch], projDir); } catch {}

      // Provision standard department labels idempotently.
      for (const [name, color, desc] of DEPT_LABELS) {
        try { runGh(['label', 'create', name, '--repo', values.repo, '--color', color, '--description', desc, '--force']); } catch {}
      }

      // Create initial M1-Foundation milestone idempotently.
      let milestoneCreated = false;
      try {
        runGh(['api', `repos/${values.repo}/milestones`, '-f', 'title=M1-Foundation', '-f', 'description=Initial full-department studio foundation']);
        milestoneCreated = true;
      } catch {}

      // Attempt GitHub Project v2 creation if token carries 'project' scope.
      let projectBoard = null;
      let projectBoardHint = '';
      const [owner] = values.repo.split('/');
      try {
        const boardTitle = values.title || `${values.repo.split('/')[1]} Studio Board`;
        const pOut = runGh(['project', 'create', '--owner', owner, '--title', boardTitle, '--format', 'json']);
        projectBoard = JSON.parse(pOut);
        if (projectBoard?.number) {
          try { runGh(['project', 'link', String(projectBoard.number), '--owner', owner, '--repo', values.repo]); } catch {}
        }
      } catch {
        projectBoardHint = "GitHub CLI token lacks 'project' scope for Projects v2; Issues & Milestones are active (run 'gh auth refresh -h github.com -s project' anytime to enable board creation).";
      }

      const wsRoot = resolveWorkspaceRoot(projDir);
      const relProjPath = path.relative(wsRoot, projDir).replace(/\\/g, '/');
      const submodule = values['no-submodule']
        ? { registered: false, path: relProjPath, url: `git@github.com:${values.repo}.git` }
        : registerWorkspaceSubmodule(values.repo, projDir, targetBranch);

      result = { repo: values.repo, url: repoUrl, milestoneCreated, projectBoard, projectBoardHint, submodule };
    } else if (sub === 'submodule-sync') {
      if (!values['project-dir']) throw new Error('--project-dir <Projects/slug> is required');
      const projDir = path.resolve(values['project-dir']);
      const submodule = registerWorkspaceSubmodule(values.repo, projDir, values.base || 'main');
      if (!submodule.registered) {
        throw new Error(`Project path '${submodule.path}' must resolve inside <workspace>/Projects/<slug>`);
      }
      result = submodule;
    } else if (sub === 'milestone') {
      if (!values.title) throw new Error('--title is required');
      const out = runGh(['api', `repos/${values.repo}/milestones`, '-f', `title=${values.title}`, '-f', `description=${resolveBody(values)}`]);
      result = JSON.parse(out);
    } else if (sub === 'list') {
      const args = ['issue', 'list', '--repo', values.repo, '--state', values.state, '--limit', values.limit, '--json', 'number,title,state,labels,milestone,updatedAt,url'];
      if (values.label) args.push('--label', values.label);
      result = JSON.parse(runGh(args));
    } else if (sub === 'view') {
      if (!values.issue) throw new Error('--issue <number> is required');
      const args = ['issue', 'view', values.issue, '--repo', values.repo, '--json', 'number,title,state,body,labels,milestone,comments,url'];
      result = JSON.parse(runGh(args));
    } else if (sub === 'create') {
      if (!values.title) throw new Error('--title is required');
      const body = resolveBody(values);
      validateMarkdownFormatting(body, 'Issue body');
      const tmpFile = path.join(os.tmpdir(), `studio-issue-${process.pid}-${Date.now()}.md`);
      try {
        fs.writeFileSync(tmpFile, body, 'utf8');
        const args = ['issue', 'create', '--repo', values.repo, '--title', values.title, '--body-file', tmpFile];
        if (values.label) args.push('--label', values.label);
        if (values.milestone) args.push('--milestone', values.milestone);
        const url = runGh(args);
        result = { created: true, url };
      } finally {
        if (fs.existsSync(tmpFile)) fs.rmSync(tmpFile, { force: true });
      }
    } else if (sub === 'comment') {
      const body = resolveBody(values);
      if (!values.issue || !body) throw new Error('--issue and --body/--body-file are required');
      validateMarkdownFormatting(body, 'Issue/PR comment');
      const tmpFile = path.join(os.tmpdir(), `studio-comment-${process.pid}-${Date.now()}.md`);
      try {
        fs.writeFileSync(tmpFile, body, 'utf8');
        const url = runGh(['issue', 'comment', values.issue, '--repo', values.repo, '--body-file', tmpFile]);
        result = { commented: true, issue: Number(values.issue), url };
      } finally {
        if (fs.existsSync(tmpFile)) fs.rmSync(tmpFile, { force: true });
      }
    } else if (sub === 'mr-create' || sub === 'pr-create') {
      if (!values.title) throw new Error('--title is required');
      const body = resolveBody(values);
      validateMrTemplate(body);
      const tmpFile = path.join(os.tmpdir(), `studio-mr-${process.pid}-${Date.now()}.md`);
      try {
        fs.writeFileSync(tmpFile, body, 'utf8');
        const args = ['pr', 'create', '--repo', values.repo, '--base', values.base, '--title', values.title, '--body-file', tmpFile];
        if (values.head) args.push('--head', values.head);
        if (values.label) args.push('--label', values.label);
        if (values.milestone) args.push('--milestone', values.milestone);
        if (values.draft) args.push('--draft');
        const url = runGh(args);
        result = { created: true, base: values.base, head: values.head || 'current', url };
      } finally {
        if (fs.existsSync(tmpFile)) fs.rmSync(tmpFile, { force: true });
      }
    } else if (sub === 'mr-edit' || sub === 'pr-edit') {
      if (!values.pr) throw new Error('--pr <number|branch> is required');
      const body = resolveBody(values);
      validateMrTemplate(body);
      const tmpFile = path.join(os.tmpdir(), `studio-mr-edit-${process.pid}-${Date.now()}.md`);
      try {
        fs.writeFileSync(tmpFile, body, 'utf8');
        const args = ['pr', 'edit', values.pr, '--repo', values.repo, '--body-file', tmpFile];
        if (values.title) args.push('--title', values.title);
        const out = runGh(args);
        result = { updated: true, pr: values.pr, url: out };
      } finally {
        if (fs.existsSync(tmpFile)) fs.rmSync(tmpFile, { force: true });
      }
    } else if (sub === 'mr-list' || sub === 'pr-list') {
      const args = ['pr', 'list', '--repo', values.repo, '--state', values.state, '--limit', values.limit, '--json', 'number,title,state,headRefName,baseRefName,author,updatedAt,url'];
      result = JSON.parse(runGh(args));
    } else if (sub === 'close') {
      if (!values.issue) throw new Error('--issue <number> is required');
      const body = resolveBody(values);
      if (body) {
        validateMarkdownFormatting(body, 'Issue closing comment');
        const tmpFile = path.join(os.tmpdir(), `studio-close-${process.pid}-${Date.now()}.md`);
        try {
          fs.writeFileSync(tmpFile, body, 'utf8');
          runGh(['issue', 'comment', values.issue, '--repo', values.repo, '--body-file', tmpFile]);
        } finally {
          if (fs.existsSync(tmpFile)) fs.rmSync(tmpFile, { force: true });
        }
      }
      const out = runGh(['issue', 'close', values.issue, '--repo', values.repo]);
      result = { closed: true, issue: Number(values.issue), output: out };
    } else if (sub === 'mr-merge' || sub === 'pr-merge') {
      if (!values.pr) throw new Error('--pr <number|branch> is required');
      if (!['merge', 'squash', 'rebase'].includes(values.method)) {
        throw new Error(`Invalid --method '${values.method}' (expected merge, squash, or rebase)`);
      }
      const methodFlag = values.method === 'squash' ? '--squash' : values.method === 'rebase' ? '--rebase' : '--merge';
      const args = ['pr', 'merge', values.pr, '--repo', values.repo, methodFlag];
      if (values['delete-branch']) args.push('--delete-branch');
      const out = runGh(args);
      result = { merged: true, pr: values.pr, method: values.method, deletedBranch: values['delete-branch'], output: out };
    } else if (sub === 'mr-view' || sub === 'pr-view') {
      if (!values.pr) throw new Error('--pr <number|branch> is required');
      const args = ['pr', 'view', values.pr, '--repo', values.repo, '--json', 'number,title,state,headRefName,baseRefName,body,comments,reviews,url'];
      result = JSON.parse(runGh(args));
    } else {
      throw new Error(`Unknown subcommand '${sub}'`);
    }

    if (values.json) {
      process.stdout.write(JSON.stringify({ ok: true, subcommand: sub, data: result }, null, 2) + '\n');
    } else {
      process.stdout.write(typeof result === 'string' ? result + '\n' : JSON.stringify(result, null, 2) + '\n');
    }
  } catch (err) {
    if (values.json) {
      process.stdout.write(JSON.stringify({ ok: false, error: err.message }, null, 2) + '\n');
    } else {
      process.stderr.write(`ERROR: ${err.message}\n`);
    }
    process.exit(1);
  }
}

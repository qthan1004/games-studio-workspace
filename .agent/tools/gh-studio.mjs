#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node gh-studio.mjs <subcommand> [options]

Cloud-first GitHub Repo, Project Board, Milestones, Issues & MR helper:
  repo-init  --repo <owner/slug> --project-dir <Projects/slug> [--public] [--title "<Board Title>"] [--json]
  milestone  --repo <owner/repo> --title "<M1-Foundation>" [--body "<desc>"] [--json]
  list       --repo <owner/repo> [--label <tag>] [--state open|closed] [--limit 20] [--json]
  view       --repo <owner/repo> --issue <number> [--json]
  create     --repo <owner/repo> --title "<title>" (--body "<body>" | --body-file <md>) [--label "a,b"] [--milestone "<m>"] [--json]
  close      --repo <owner/repo> --issue <number> [--body "<closing-summary>" | --body-file <md>] [--json]
  comment    --repo <owner/repo> --issue <number> (--body "<md>" | --body-file <md>) [--json]
  mr-create  --repo <owner/repo> --title "<title>" (--body-file <md> | --body "<md>") [--base main] [--head <branch>] [--draft] [--json]
  mr-edit    --repo <owner/repo> --pr <number|branch> (--body-file <md> | --body "<md>") [--title "<title>"] [--json]
  mr-merge   --repo <owner/repo> --pr <number|branch> [--method merge|squash|rebase] [--delete-branch] [--json]
  mr-list    --repo <owner/repo> [--state open|closed|merged|all] [--limit 20] [--json]
  mr-view    --repo <owner/repo> --pr <number|branch> [--json]
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

function runGh(args, cwd = process.cwd()) {
  return execFileSync('gh', args, { cwd, encoding: 'utf8' }).trim();
}

function runGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function resolveBody() {
  let raw = '';
  if (values['body-file']) {
    const p = path.resolve(values['body-file']);
    if (!fs.existsSync(p)) throw new Error(`Body file not found: ${p}`);
    raw = fs.readFileSync(p, 'utf8');
  } else {
    raw = values.body || '';
  }
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

function validateMarkdownFormatting(markdown, label = 'Markdown body') {
  if (!markdown) return;
  if (markdown.includes('\\n') && !markdown.includes('\n')) {
    throw new Error(`${label} contains literal escaped '\\n' with zero real newlines; write a real UTF-8 file and pass --body-file.`);
  }
  const lines = markdown.split('\n');
  let activeFence = null;
  const proseLines = [];
  for (const line of lines) {
    if (!activeFence) {
      const openMatch = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (openMatch) {
        const fenceSeq = openMatch[1];
        const rest = openMatch[2] || '';
        const ch = fenceSeq[0];
        if (ch === '`' && rest.includes('`')) {
          const closingIdx = rest.indexOf(fenceSeq);
          if (closingIdx < 0) {
            throw new Error(`${label} has an unclosed single-line code fence (${fenceSeq}).`);
          }
          continue;
        }
        activeFence = { char: ch, len: fenceSeq.length };
        continue;
      }
      proseLines.push(line);
    } else {
      const closeRe = new RegExp(`^ {0,3}${activeFence.char}{${activeFence.len},}[ \\t]*$`);
      if (closeRe.test(line)) activeFence = null;
    }
  }
  if (activeFence) {
    throw new Error(`${label} has an unclosed Markdown code fence (${activeFence.char.repeat(activeFence.len)}).`);
  }
  const proseNoInlineCode = proseLines
    .map(l => l.replace(/`+[^`]*`+/g, 'code'))
    .join('\n');
  if (/\S[ \t]+#{2,6}[ \t]+\S/.test(proseNoInlineCode)) {
    throw new Error(`${label} has collapsed inline headings (e.g. 'text ## Heading' on one line — often caused by PowerShell string[] flattening). Ensure real newlines before every heading.`);
  }
  if (markdown.length > 220 && !markdown.includes('\n')) {
    throw new Error(`${label} (${markdown.length} chars) is a single unformatted line; break sections/lists across real newlines.`);
  }
}

function validateMrTemplate(markdown) {
  validateMarkdownFormatting(markdown, 'MR description');
  const missing = [];
  if (!/(^|\n)##[ \t]+Name[ \t]*\n/.test(markdown)) missing.push('## Name (on its own line)');
  if (!/(^|\n)##[ \t]+Agent[ \t]*\n/.test(markdown)) missing.push('## Agent (on its own line)');
  if (!/(^|\n)##[ \t]+Description[ \t]*\n/.test(markdown)) missing.push('## Description (on its own line)');
  if (missing.length > 0) {
    throw new Error(`MR description violates studio 'mr' template; missing section(s): ${missing.join(', ')}`);
  }
}

try {
  let result;
  if (sub === 'repo-init') {
    if (!values['project-dir']) throw new Error('--project-dir <Projects/slug> is required');
    const projDir = path.resolve(values['project-dir']);
    if (!fs.existsSync(path.join(projDir, '.git'))) {
      throw new Error(`Target directory is not a standalone git repository: ${projDir}`);
    }

    // Ensure baseline commit exists on main before pushing remote.
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

    // Ensure origin remote and push main if repo pre-existed.
    try { runGit(['remote', 'get-url', 'origin'], projDir); } catch {
      runGit(['remote', 'add', 'origin', `git@github.com:${values.repo}.git`], projDir);
    }
    try { runGit(['push', '-u', 'origin', 'main'], projDir); } catch {}

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

    result = { repo: values.repo, url: repoUrl, milestoneCreated, projectBoard, projectBoardHint };
  } else if (sub === 'milestone') {
    if (!values.title) throw new Error('--title is required');
    const out = runGh(['api', `repos/${values.repo}/milestones`, '-f', `title=${values.title}`, '-f', `description=${resolveBody()}`]);
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
    const body = resolveBody();
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
    const body = resolveBody();
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
    const body = resolveBody();
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
    const body = resolveBody();
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
    const body = resolveBody();
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

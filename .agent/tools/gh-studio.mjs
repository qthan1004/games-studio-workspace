#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node gh-studio.mjs <subcommand> [options]

Cloud-first GitHub Issues & Merge/Pull Request helper (zero local report clutter):
  list       --repo <owner/repo> [--label <tag>] [--state open|closed] [--limit 20] [--json]
  view       --repo <owner/repo> --issue <number> [--json]
  create     --repo <owner/repo> --title "<title>" --body "<body>" [--label "a,b"] [--milestone "<m>"] [--json]
  comment    --repo <owner/repo> --issue <number> --body "<markdown-report>" [--json]
  mr-create  --repo <owner/repo> --title "<title>" (--body-file <md> | --body "<md>") [--base main] [--head <branch>] [--draft] [--json]
  mr-list    --repo <owner/repo> [--state open|closed|merged|all] [--limit 20] [--json]
  mr-view    --repo <owner/repo> --pr <number|branch> [--json]
`;

const { values, positionals } = parseArgs({
  options: {
    repo: { type: 'string', default: '' },
    issue: { type: 'string', default: '' },
    pr: { type: 'string', default: '' },
    title: { type: 'string', default: '' },
    body: { type: 'string', default: '' },
    'body-file': { type: 'string', default: '' },
    base: { type: 'string', default: 'main' },
    head: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
    milestone: { type: 'string', default: '' },
    state: { type: 'string', default: 'open' },
    limit: { type: 'string', default: '20' },
    draft: { type: 'boolean', default: false },
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

function runGh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' }).trim();
}

function resolveBody() {
  if (values['body-file']) {
    const p = path.resolve(values['body-file']);
    if (!fs.existsSync(p)) throw new Error(`Body file not found: ${p}`);
    return fs.readFileSync(p, 'utf8');
  }
  return values.body || '';
}

function validateMrTemplate(markdown) {
  const missing = [];
  if (!/(^|\n)##\s+Name\b|(^|\n)\*\*Name:\*\*/i.test(markdown)) missing.push('Name');
  if (!/(^|\n)##\s+Agent\b|(^|\n)\*\*Agent:\*\*/i.test(markdown)) missing.push('Agent');
  if (!/(^|\n)##\s+Description\b|(^|\n)\*\*Description:\*\*/i.test(markdown)) missing.push('Description');
  if (missing.length > 0) {
    throw new Error(`MR description violates studio 'mr' template; missing section(s): ${missing.join(', ')}`);
  }
}

try {
  let result;
  if (sub === 'list') {
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
    const args = ['issue', 'create', '--repo', values.repo, '--title', values.title, '--body', body];
    if (values.label) args.push('--label', values.label);
    if (values.milestone) args.push('--milestone', values.milestone);
    const url = runGh(args);
    result = { created: true, url };
  } else if (sub === 'comment') {
    const body = resolveBody();
    if (!values.issue || !body) throw new Error('--issue and --body/--body-file are required');
    const url = runGh(['issue', 'comment', values.issue, '--repo', values.repo, '--body', body]);
    result = { commented: true, issue: Number(values.issue), url };
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
  } else if (sub === 'mr-list' || sub === 'pr-list') {
    const args = ['pr', 'list', '--repo', values.repo, '--state', values.state, '--limit', values.limit, '--json', 'number,title,state,headRefName,baseRefName,author,updatedAt,url'];
    result = JSON.parse(runGh(args));
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

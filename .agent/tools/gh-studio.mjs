#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node gh-studio.mjs <subcommand> [options]

Cloud-first GitHub Issues & PR helper (zero local report clutter):
  list     --repo <owner/repo> [--label <tag>] [--state open|closed] [--limit 20] [--json]
  view     --repo <owner/repo> --issue <number> [--json]
  create   --repo <owner/repo> --title "<title>" --body "<body>" [--label "a,b"] [--milestone "<m>"] [--json]
  comment  --repo <owner/repo> --issue <number> --body "<markdown-report>" [--json]
`;

const { values, positionals } = parseArgs({
  options: {
    repo: { type: 'string', default: '' },
    issue: { type: 'string', default: '' },
    title: { type: 'string', default: '' },
    body: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
    milestone: { type: 'string', default: '' },
    state: { type: 'string', default: 'open' },
    limit: { type: 'string', default: '20' },
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
    const args = ['issue', 'create', '--repo', values.repo, '--title', values.title, '--body', values.body || ''];
    if (values.label) args.push('--label', values.label);
    if (values.milestone) args.push('--milestone', values.milestone);
    const url = runGh(args);
    result = { created: true, url };
  } else if (sub === 'comment') {
    if (!values.issue || !values.body) throw new Error('--issue and --body are required');
    const url = runGh(['issue', 'comment', values.issue, '--repo', values.repo, '--body', values.body]);
    result = { commented: true, issue: Number(values.issue), url };
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

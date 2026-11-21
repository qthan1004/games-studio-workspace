#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function respond(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'PROJECT.md'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

let raw = '';
const timer = setTimeout(() => respond({}), 4000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('error', () => { clearTimeout(timer); respond({}); });
process.stdin.on('end', () => {
  clearTimeout(timer);
  try {
    const payload = raw.trim() ? JSON.parse(raw) : {};
    const projectRoot = findProjectRoot(payload.cwd || process.cwd());
    if (!projectRoot) return respond({});

    const projText = fs.readFileSync(path.join(projectRoot, 'PROJECT.md'), 'utf8');
    const nameMatch = projText.match(/^\s*project_name\s*:\s*["']?([^"'\r\n]+)["']?/m);
    const repoMatch = projText.match(/^\s*repo\s*:\s*["']?([^"'\r\n]+)["']?/m);
    const msMatch = projText.match(/^\s*current_milestone\s*:\s*["']?([^"'\r\n]+)["']?/m);

    let branch = 'unknown';
    try {
      branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: projectRoot, timeout: 1500, encoding: 'utf8' }).trim();
    } catch {}

    let readySummary = '';
    const repoSlug = repoMatch ? repoMatch[1].trim() : '';
    if (repoSlug && !repoSlug.includes('{{') && repoSlug.includes('/')) {
      try {
        const out = execFileSync('gh', ['issue', 'list', '--repo', repoSlug, '--state', 'open', '--limit', '3', '--json', 'number,title'], {
          cwd: projectRoot,
          timeout: 2500,
          encoding: 'utf8'
        });
        const issues = JSON.parse(out);
        if (Array.isArray(issues) && issues.length > 0) {
          readySummary = ` | Open Issues: ${issues.map(i => `#${i.number} ${i.title}`).join('; ')}`;
        }
      } catch {}
    }

    const msg = `[Studio Pulse] Project: ${nameMatch ? nameMatch[1].trim() : path.basename(projectRoot)} | Milestone: ${msMatch ? msMatch[1].trim() : 'N/A'} | Branch: ${branch}${readySummary}`;
    return respond({
      injectSteps: [{ systemMessage: { systemMessage: msg } }]
    });
  } catch {
    return respond({});
  }
});

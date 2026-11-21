#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function respond(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, 'PROJECT.md')) && fs.existsSync(path.join(dir, 'departments', 'MOC.md'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

let raw = '';
const timer = setTimeout(() => respond({ decision: 'allow' }), 4000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('error', () => { clearTimeout(timer); respond({ decision: 'allow' }); });
process.stdin.on('end', () => {
  clearTimeout(timer);
  try {
    const payload = raw.trim() ? JSON.parse(raw) : {};
    if (payload.continuationActive || payload.terminationReason !== 'NO_TOOL_CALL') {
      return respond({ decision: 'allow' });
    }

    const projectRoot = findProjectRoot(payload.cwd || process.cwd());
    if (!projectRoot) return respond({ decision: 'allow' });

    const registryPath = path.join(projectRoot, 'departments', 'registry.yaml');
    if (fs.existsSync(registryPath)) {
      const regText = fs.readFileSync(registryPath, 'utf8');
      const pathMatches = [...regText.matchAll(/^\s*(?:owner|data_path)\s*:\s*["']?([^"'\r\n#]+)["']?/gm)];
      for (const match of pathMatches) {
        const rel = match[1].trim();
        if (rel && !fs.existsSync(path.join(projectRoot, rel))) {
          return respond({
            decision: 'continue',
            reason: `Full-Chain Sync Guard: departments/registry.yaml points to missing path '${rel}'. Reconcile registry.yaml and MOC.md before finishing.`
          });
        }
      }
    }

    return respond({ decision: 'allow' });
  } catch {
    return respond({ decision: 'allow' });
  }
});

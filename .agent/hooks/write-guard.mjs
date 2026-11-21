#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROLE_RULES = {
  qa: { allow: [], denyAll: true },
  research: { allow: [], denyAll: true },
  producer: { allow: [/(^|\/)departments\/MOC\.md$/i] },
  narrative: { allow: [/(^|\/)departments\/01_narrative\//i, /(^|\/)data\/(dialogue|localization)\//i, /(^|\/)departments\/registry\.yaml$/i] },
  designer: { allow: [/(^|\/)departments\/02_game_design\//i, /(^|\/)departments\/registry\.yaml$/i] },
  balance: { allow: [/(^|\/)departments\/03_balance_economy\//i, /(^|\/)departments\/registry\.yaml$/i, /(^|\/)data\/balance\//i, /(^|\/)tools\/simulators\//i] },
  level: { allow: [/(^|\/)departments\/04_level_world\//i, /(^|\/)data\/levels\//i] },
  'art-audio': { allow: [/(^|\/)departments\/05_art_vfx_audio\//i, /(^|\/)(assets|assets_source|Content)\//i] },
  architect: { allow: [/(^|\/)departments\/06_architecture_tech\//i, /(^|\/)PROJECT\.md$/i, /(^|\/)departments\/registry\.yaml$/i] },
  engineer: { deny: [/(^|\/)departments\/0[1-5]_/i] }
};

function respond(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function readHeaderStatus(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > 262144) return null;
    const head = fs.readFileSync(filePath, 'utf8').slice(0, 1200);
    if (!head.startsWith('---')) return null;
    const end = head.indexOf('\n---', 3);
    if (end < 0) return null;
    const fm = head.slice(0, end);
    const m = fm.match(/^\s*status\s*:\s*["']?([a-zA-Z0-9_-]+)["']?\s*$/m);
    return m ? m[1].toLowerCase() : null;
  } catch {
    return null;
  }
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
    const args = payload?.toolCall?.args || payload?.tool_input || {};
    const targetRaw = args.Path || args.TargetFile || args.file_path || args.path || '';
    if (!targetRaw || typeof targetRaw !== 'string') return respond({ decision: 'allow' });

    const baseDir = payload?.cwd || process.cwd();
    const absPath = path.resolve(baseDir, targetRaw);
    const normPath = absPath.replace(/\\/g, '/');
    const baseName = path.basename(normPath);

    if (/^\.env(\..+)?$/i.test(baseName) && !/^\.env\.example$/i.test(baseName)) {
      return respond({
        decision: 'ask',
        reason: `Protected environment file (${baseName}). Confirm with the Director before writing.`
      });
    }

    const status = readHeaderStatus(absPath);
    if (status === 'locked') {
      return respond({
        decision: 'ask',
        reason: `Target document (${baseName}) has 'status: locked'. Ask the Director before modifying locked specs.`
      });
    }

    const activeRole = (process.env.STUDIO_ROLE || '').trim().toLowerCase();
    if (activeRole && ROLE_RULES[activeRole]) {
      const rule = ROLE_RULES[activeRole];
      if (rule.denyAll) {
        return respond({
          decision: 'deny',
          reason: `Role '${activeRole}' is strictly read-only on local repository files.`
        });
      }
      if (rule.deny && rule.deny.some(re => re.test(normPath))) {
        return respond({
          decision: 'deny',
          reason: `Role '${activeRole}' cannot edit restricted department path: ${targetRaw}`
        });
      }
      if (rule.allow && !rule.allow.some(re => re.test(normPath))) {
        return respond({
          decision: 'deny',
          reason: `Role '${activeRole}' write scope does not cover: ${targetRaw}`
        });
      }
    }

    return respond({ decision: 'allow' });
  } catch {
    return respond({ decision: 'allow' });
  }
});

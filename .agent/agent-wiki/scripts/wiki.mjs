#!/usr/bin/env node
// wiki.mjs - agent wiki helper (Obsidian-compatible markdown vault). Zero dependencies.
// Output is compact TOON-style text. Never prints the whole vault.
//
// Commands:
//   index                                   rebuild MANIFEST.json, INDEX.md (notes) and DOCS.md (doc registry)
//   find  --q "words" [--domain D] [--type T] [--docs|--all] [--limit 5]
//   hot   --domain D                        hot notes for a domain plus _global (task start)
//   open  <id|slug>                         print one note with a staleness verdict
//   sha   <source>                          hash for a source pointer, e.g. repo/src/a.ts#L10-L40
//   new   --domain D --type T --slug S --title "..."      draft in inbox/ (needs approval)
//   approve <inbox-file|slug> [--bump major|minor|patch] [--app-release X] [--change "..."]
//   retire  <id> --reason "..." [--superseded-by ID]       move to archive/, never delete
//   check [--domain D]                      stale sources, overdue review_by, decay suggestions
//
// Vault root: $AGENT_WIKI_DIR, else nearest ancestor of cwd containing .agent-wiki.
// Source pointers are relative to the vault's parent folder (the workspace root).

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const TYPES = ['decision', 'rule', 'contract', 'flow', 'gotcha', 'runbook', 'pref', 'glossary'];
const DOC_EXT = new Set(['.md', '.html', '.txt', '.log', '.json', '.pdf']);

const argv = process.argv.slice(2);
const cmd = argv[0];
const pos = [];
const opt = {};
for (let i = 1; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    opt[k] = v;
  } else pos.push(a);
}

const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const q = s => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, "'")}"` : String(s));
const fail = (msg, next) => { console.log(`error: ${msg}`); if (next) console.log(`next: ${next}`); process.exit(2); };

function findVault() {
  if (process.env.AGENT_WIKI_DIR) return path.resolve(process.env.AGENT_WIKI_DIR);
  let dir = process.cwd();
  for (;;) {
    if (fs.existsSync(path.join(dir, '.agent-wiki'))) return path.join(dir, '.agent-wiki');
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  fail('no .agent-wiki found from cwd', 'set AGENT_WIKI_DIR or run inside the workspace');
}

const VAULT = cmd && cmd !== 'help' ? findVault() : null;
const WS = VAULT ? path.dirname(VAULT) : null;
const rel = p => path.relative(VAULT, p).replace(/\\/g, '/');

function config() {
  const f = path.join(VAULT, 'wiki.config.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { docRoots: [] };
}

// ---------- frontmatter ----------
function parseNote(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const fm = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (!kv) continue;
      let v = kv[2].trim();
      if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      else v = v.replace(/^["']|["']$/g, '');
      fm[kv[1]] = v;
    }
  }
  return { fm, body: m ? m[2] : text, text };
}

function serialize(fm, body) {
  const order = ['id', 'domain', 'type', 'title', 'summary', 'tags', 'source', 'source_sha', 'confidence', 'tier', 'version', 'released', 'app_release', 'review_by', 'supersedes', 'superseded_by', 'links'];
  const keys = [...order.filter(k => k in fm), ...Object.keys(fm).filter(k => !order.includes(k))];
  const val = v => (Array.isArray(v) ? `[${v.map(x => (/[,\[\]]/.test(x) ? `"${x}"` : x)).join(', ')}]` : /[:#]/.test(String(v)) && !/^".*"$/.test(String(v)) ? `"${String(v).replace(/"/g, "'")}"` : String(v));
  return `---\n${keys.map(k => `${k}: ${val(fm[k])}`).join('\n')}\n---\n${body.startsWith('\n') ? body : `\n${body}`}`;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function loadNotes() {
  return walk(path.join(VAULT, 'domains'))
    .filter(f => f.endsWith('.md') && !/(^|[\\/])(CHANGELOG|README)\.md$/.test(f))
    .map(f => {
      const { fm } = parseNote(f);
      const domain = fm.domain || rel(f).split('/')[1];
      const slug = path.basename(f, '.md');
      return { ...fm, id: `${domain}/${slug}`, slug, domain, file: rel(f) };
    });
}

// ---------- source hashing ----------
function hashSource(source) {
  if (!source) return null;
  const [p, anchor] = String(source).split('#');
  const abs = path.resolve(WS, p);
  if (!fs.existsSync(abs)) return { missing: true };
  let content = fs.readFileSync(abs, 'utf8');
  const lr = anchor && anchor.match(/^L(\d+)(?:-L?(\d+))?$/);
  if (lr) {
    const lines = content.split(/\r?\n/);
    content = lines.slice(+lr[1] - 1, +(lr[2] || lr[1])).map(l => l.trim()).join('\n');
  } else content = content.replace(/\r\n/g, '\n');
  return { sha: crypto.createHash('sha1').update(content).digest('hex').slice(0, 10) };
}

function staleness(n) {
  if (!n.source) return 'no-source';
  const h = hashSource(n.source);
  if (h.missing) return 'source-missing';
  if (!n.source_sha) return 'unhashed';
  return h.sha === n.source_sha ? 'fresh' : 'stale';
}

// ---------- docs registry ----------
function loadDocs() {
  const docs = [];
  for (const r of config().docRoots || []) {
    const root = path.resolve(WS, r.path);
    const files = r.recursive === false
      ? (fs.existsSync(root) ? fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isFile()).map(e => path.join(root, e.name)) : [])
      : walk(root);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (!DOC_EXT.has(ext)) continue;
      const name = path.basename(f);
      const st = fs.statSync(f);
      let title = name;
      if (ext === '.md') {
        const head = fs.readFileSync(f, 'utf8').slice(0, 2000).match(/^#\s+(.+)$/m);
        if (head) title = head[1].trim();
      }
      const dm = name.match(/(20\d{2})[-_]?(\d{2})[-_]?(\d{2})/);
      const tickets = [...new Set((name + ' ' + title).match(/[A-Z]{2,6}-\d{2,6}/g) || [])];
      docs.push({
        id: path.relative(WS, f).replace(/\\/g, '/'),
        domain: r.domain,
        kind: ext === '.log' ? 'log' : ext === '.md' ? 'doc' : ext.slice(1),
        title: title.slice(0, 140),
        date: dm ? `${dm[1]}-${dm[2]}-${dm[3]}` : st.mtime.toISOString().slice(0, 10),
        tickets,
        bytes: st.size,
      });
    }
  }
  return docs;
}

// ---------- commands ----------
function cmdIndex(quiet = false) {
  const notes = loadNotes();
  const docs = loadDocs();
  const manifest = {
    generated: new Date().toISOString(),
    notes: notes.map(n => ({ id: n.id, domain: n.domain, type: n.type, title: n.title, summary: n.summary, tags: n.tags || [], confidence: n.confidence, tier: n.tier, version: n.version, released: n.released, app_release: n.app_release, source: n.source, file: n.file })),
    docs,
  };
  fs.writeFileSync(path.join(VAULT, 'MANIFEST.json'), JSON.stringify(manifest, null, 1), 'utf8');

  const byDomain = d => [...new Set(d.map(x => x.domain))].sort();
  const lines = ['# INDEX (generated by wiki.mjs index - do not edit)', '', `${notes.length} notes. Agents: use \`wiki.mjs find\`/\`hot\` instead of reading this file.`, ''];
  for (const d of byDomain(notes)) {
    lines.push(`## ${d}`, '', '| note | type | v | released | conf | tier | summary |', '|---|---|---|---|---|---|---|');
    for (const n of notes.filter(x => x.domain === d).sort((a, b) => String(a.type).localeCompare(String(b.type)) || a.slug.localeCompare(b.slug))) {
      lines.push(`| [[${n.file.replace(/\.md$/, '')}\\|${n.slug}]] | ${n.type || ''} | ${n.version || ''} | ${n.released || ''} | ${n.confidence || ''} | ${n.tier || ''} | ${(n.summary || '').replace(/\|/g, '/')} |`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(VAULT, 'INDEX.md'), lines.join('\n'), 'utf8');

  const dl = ['# DOCS registry (generated - long-form SSOT documents live outside the vault)', ''];
  for (const d of byDomain(docs)) {
    dl.push(`## ${d}`, '', '| date | kind | doc | tickets | KB |', '|---|---|---|---|---|');
    for (const x of docs.filter(y => y.domain === d).sort((a, b) => b.date.localeCompare(a.date))) {
      dl.push(`| ${x.date} | ${x.kind} | [${x.title.replace(/\|/g, '/')}](../${x.id.replace(/ /g, '%20')}) | ${x.tickets.join(' ')} | ${Math.round(x.bytes / 1024)} |`);
    }
    dl.push('');
  }
  fs.writeFileSync(path.join(VAULT, 'DOCS.md'), dl.join('\n'), 'utf8');
  if (!quiet) {
    console.log(`indexed: notes=${notes.length} docs=${docs.length}`);
    console.log(`domains: ${byDomain([...notes, ...docs]).join(' ') || 'none'}`);
  }
  return manifest;
}

function manifest() {
  const f = path.join(VAULT, 'MANIFEST.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : cmdIndex(true);
}

function score(words, hay, tags = []) {
  const h = hay.toLowerCase();
  const t = tags.map(x => String(x).toLowerCase());
  return words.reduce((s, w) => s + (t.includes(w) ? 3 : h.includes(w) ? 1 : 0), 0);
}

function cmdFind() {
  if (!opt.q || opt.q === true) fail('missing --q');
  const words = String(opt.q).toLowerCase().split(/\s+/).filter(Boolean);
  const limit = Number(opt.limit) || 5;
  const m = manifest();
  const dom = opt.domain && opt.domain !== true ? opt.domain : null;
  const wantNotes = !opt.docs;
  const wantDocs = opt.docs || opt.all;
  console.log(`q: "${opt.q}"${dom ? ` domain: ${dom}` : ''}`);
  if (wantNotes) {
    const hits = m.notes
      .filter(n => (!dom || n.domain === dom || n.domain === '_global') && (!opt.type || n.type === opt.type))
      .map(n => ({ n, s: score(words, `${n.id} ${n.title} ${n.summary}`, n.tags) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit);
    if (hits.length) {
      console.log(`notes[${hits.length}]{id,type,v,conf,state,summary}:`);
      for (const { n } of hits) {
        const full = loadNotes().find(x => x.id === n.id) || n;
        console.log(`  ${n.id},${n.type},${n.version || '-'},${n.confidence || '-'},${staleness(full)},${q(n.summary || n.title || '')}`);
      }
    } else console.log('notes: 0 hits');
  }
  if (wantDocs) {
    const hits = m.docs
      .filter(d => !dom || d.domain === dom)
      .map(d => ({ d, s: score(words, `${d.id} ${d.title}`, d.tickets.map(t => t.toLowerCase())) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s || b.d.date.localeCompare(a.d.date))
      .slice(0, limit);
    if (hits.length) {
      console.log(`docs[${hits.length}]{path,kind,date,KB,title}:`);
      for (const { d } of hits) console.log(`  ${q(d.id)},${d.kind},${d.date},${Math.round(d.bytes / 1024)},${q(d.title)}`);
    } else console.log('docs: 0 hits');
  }
  console.log('next: wiki.mjs open <id> (max 3); docs: read only the needed section; logs: use log-digest.mjs');
}

function cmdHot() {
  const dom = opt.domain && opt.domain !== true ? opt.domain : null;
  if (!dom) fail('missing --domain');
  const notes = loadNotes().filter(n => (n.domain === dom || n.domain === '_global') && n.tier === 'hot');
  if (!notes.length) { console.log(`hot: none for ${dom}`); console.log('next: wiki.mjs find --q "<topic>" --domain ' + dom); return; }
  console.log(`hot[${notes.length}]{id,type,v,conf,state,summary}:`);
  for (const n of notes.slice(0, 15)) console.log(`  ${n.id},${n.type},${n.version || '-'},${n.confidence || '-'},${staleness(n)},${q(n.summary || n.title || '')}`);
  if (notes.length > 15) console.log(`  ... ${notes.length - 15} more; demote some to warm`);
}

function resolveNote(key) {
  const notes = loadNotes();
  const hits = notes.filter(n => n.id === key || n.slug === key);
  if (!hits.length) fail(`note not found: ${key}`, 'wiki.mjs find --q "<words>"');
  if (hits.length > 1) fail(`ambiguous slug ${key}: ${hits.map(h => h.id).join(', ')}`);
  return hits[0];
}

function cmdOpen() {
  const n = resolveNote(pos[0]);
  const st = staleness(n);
  console.log(`note: ${n.id} v${n.version || '-'} released ${n.released || '-'} app_release ${n.app_release || '-'}`);
  console.log(`state: ${st}${st === 'stale' ? ' - source changed since this version; re-verify before relying on it' : ''}${n.confidence === 'hypothesis' ? ' | hypothesis - not evidence for Gate 1' : ''}`);
  console.log('---');
  console.log(fs.readFileSync(path.join(VAULT, n.file), 'utf8'));
}

function cmdSha() {
  if (!pos[0]) fail('usage: wiki.mjs sha <path#Lx-Ly>');
  const h = hashSource(pos[0]);
  console.log(h.missing ? `source: missing (${pos[0]} relative to ${WS})` : `source_sha: ${h.sha}`);
}

function cmdNew() {
  for (const k of ['domain', 'type', 'slug']) if (!opt[k] || opt[k] === true) fail(`missing --${k}`);
  if (!TYPES.includes(opt.type)) fail(`--type must be one of ${TYPES.join('|')}`);
  if (!/^[a-z0-9][a-z0-9-]{2,80}$/.test(opt.slug)) fail('--slug must be kebab-case');
  const tplFile = path.join(VAULT, '_templates', 'note.md');
  const existing = loadNotes().find(n => n.domain === opt.domain && n.slug === opt.slug);
  const base = existing ? parseNote(path.join(VAULT, existing.file)) : fs.existsSync(tplFile) ? parseNote(tplFile) : { fm: {}, body: '\n' };
  const { fm, body } = base;
  if (existing) {
    if (existing.type !== opt.type) fail(`slug exists with type ${existing.type}; use --type ${existing.type}`);
  } else Object.assign(fm, { id: `${opt.domain}/${opt.slug}`, domain: opt.domain, type: opt.type, title: opt.title && opt.title !== true ? opt.title : opt.slug, version: '0.0.0', released: '' });
  fs.mkdirSync(path.join(VAULT, 'inbox'), { recursive: true });
  const out = path.join(VAULT, 'inbox', `${opt.domain}__${opt.slug}.md`);
  if (fs.existsSync(out)) fail(`draft exists: ${rel(out)}`);
  fs.writeFileSync(out, serialize(fm, body), 'utf8');
  console.log(`draft: ${rel(out)}${existing ? ` (prefilled from v${existing.version}; edit, then approve with --bump and --change)` : ''}`);
  console.log('next: fill summary/source/body, run `wiki.mjs sha <source>`, then ask the user before `wiki.mjs approve`');
}

function bump(v, kind) {
  const [a, b, c] = String(v || '0.0.0').split('.').map(x => Number(x) || 0);
  if (kind === 'major') return `${a + 1}.0.0`;
  if (kind === 'patch') return `${a}.${b}.${c + 1}`;
  return `${a}.${b + 1}.0`;
}

function appendChangelog(domain, row) {
  const f = path.join(VAULT, 'domains', domain, 'CHANGELOG.md');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, `# CHANGELOG - ${domain}\n\n| released | note | version | change | app_release |\n|---|---|---|---|---|\n`, 'utf8');
  fs.appendFileSync(f, `| ${row.released} | [[${row.file}\\|${row.slug}]] | ${row.version} | ${row.change.replace(/\|/g, '/')} | ${row.app_release || '-'} |\n`, 'utf8');
}

function cmdApprove() {
  const key = pos[0];
  if (!key) fail('usage: wiki.mjs approve <inbox-file|slug>');
  let src = path.isAbsolute(key) ? key : path.join(VAULT, key);
  if (!fs.existsSync(src)) src = walk(path.join(VAULT, 'inbox')).find(f => path.basename(f, '.md').endsWith(`__${key}`) || path.basename(f, '.md') === key);
  if (!src || !fs.existsSync(src)) fail(`draft not found: ${key}`);
  const { fm, body } = parseNote(src);
  for (const k of ['domain', 'type', 'summary']) if (!fm[k]) fail(`draft missing ${k}`);
  if (!TYPES.includes(fm.type)) fail(`bad type ${fm.type}`);
  if (String(fm.summary).length > 160) fail('summary longer than 160 chars');
  const slug = String(fm.id || '').split('/').pop() || path.basename(src, '.md').split('__').pop();
  const dest = path.join(VAULT, 'domains', fm.domain, fm.type, `${slug}.md`);
  let version = '1.0.0';
  let change = opt.change && opt.change !== true ? opt.change : 'created';
  let newBody = body;
  if (fs.existsSync(dest)) {
    const old = parseNote(dest);
    version = bump(old.fm.version, opt.bump || 'minor');
    if (!opt.change) change = `updated (${opt.bump || 'minor'})`;
    const arch = path.join(VAULT, 'archive', fm.domain, `${slug}@${old.fm.version || '0'}.md`);
    fs.mkdirSync(path.dirname(arch), { recursive: true });
    fs.writeFileSync(arch, serialize({ ...old.fm, superseded_by: `${fm.domain}/${slug}@${version}` }, old.body), 'utf8');
    const oldLog = (old.body.match(/## Changelog[\s\S]*$/) || [''])[0];
    if (oldLog && !/## Changelog/.test(newBody)) newBody = `${newBody.trimEnd()}\n\n${oldLog}`;
  }
  const released = today();
  const h = hashSource(fm.source);
  Object.assign(fm, { id: `${fm.domain}/${slug}`, version, released });
  if (opt['app-release'] && opt['app-release'] !== true) fm.app_release = opt['app-release'];
  if (h && h.sha) fm.source_sha = h.sha;
  if (!fm.tier) fm.tier = 'warm';
  const entry = `- ${version} | ${released} | ${change} | app_release ${fm.app_release || '-'}`;
  newBody = /## Changelog/.test(newBody) ? newBody.replace(/## Changelog\s*\n/, m => `${m}${entry}\n`) : `${newBody.trimEnd()}\n\n## Changelog\n\n${entry}\n`;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, serialize(fm, newBody), 'utf8');
  fs.unlinkSync(src);
  appendChangelog(fm.domain, { released, slug, file: rel(dest).replace(/\.md$/, ''), version, change, app_release: fm.app_release });
  cmdIndex(true);
  console.log(`approved: ${fm.domain}/${slug} v${version} (${released})${h && h.missing ? ' | warning: source missing' : ''}`);
}

function cmdRetire() {
  const n = resolveNote(pos[0]);
  if (!opt.reason || opt.reason === true) fail('missing --reason');
  const src = path.join(VAULT, n.file);
  const { fm, body } = parseNote(src);
  const arch = path.join(VAULT, 'archive', n.domain, `${n.slug}@${fm.version || '0'}.md`);
  fs.mkdirSync(path.dirname(arch), { recursive: true });
  const sup = opt['superseded-by'] && opt['superseded-by'] !== true ? opt['superseded-by'] : 'retired';
  fs.writeFileSync(arch, serialize({ ...fm, superseded_by: sup }, `${body.trimEnd()}\n- retired | ${today()} | ${opt.reason}\n`), 'utf8');
  fs.unlinkSync(src);
  appendChangelog(n.domain, { released: today(), slug: n.slug, file: rel(arch).replace(/\.md$/, ''), version: fm.version || '-', change: `retired: ${opt.reason}`, app_release: fm.app_release });
  cmdIndex(true);
  console.log(`retired: ${n.id} -> ${rel(arch)}`);
}

function cmdCheck() {
  const dom = opt.domain && opt.domain !== true ? opt.domain : null;
  const notes = loadNotes().filter(n => !dom || n.domain === dom);
  const t = today();
  const daysSince = d => (d ? Math.floor((Date.parse(t) - Date.parse(d)) / 86400000) : 9999);
  const issues = [];
  for (const n of notes) {
    const st = staleness(n);
    if (st === 'stale' || st === 'source-missing') issues.push([n.id, st, 're-verify against source, then approve a new version or retire']);
    if (n.review_by && n.review_by < t) issues.push([n.id, 'review-overdue', `review_by ${n.review_by}`]);
    if (n.confidence === 'hypothesis' && daysSince(n.released) > 30) issues.push([n.id, 'old-hypothesis', 'verify or retire']);
    if (n.tier === 'hot' && daysSince(n.released) > 90) issues.push([n.id, 'decay', 'suggest hot -> warm']);
    if (n.tier === 'warm' && daysSince(n.released) > 365) issues.push([n.id, 'decay', 'suggest warm -> cold']);
    if (!n.summary) issues.push([n.id, 'no-summary', 'add a one-line summary']);
  }
  const inbox = walk(path.join(VAULT, 'inbox')).filter(f => f.endsWith('.md'));
  console.log(`checked: ${notes.length} notes${dom ? ` in ${dom}` : ''}; inbox drafts: ${inbox.length}`);
  if (!issues.length) { console.log('issues: none'); return; }
  console.log(`issues[${issues.length}]{note,kind,action}:`);
  for (const [a, b, c] of issues) console.log(`  ${a},${b},${q(c)}`);
  console.log('next: nothing is changed automatically; propose fixes to the user');
}

function help() {
  console.log(fs.readFileSync(process.argv[1], 'utf8').split('\n').filter(l => l.startsWith('//')).map(l => l.slice(3)).join('\n'));
}

const table = { index: () => cmdIndex(), find: cmdFind, hot: cmdHot, open: cmdOpen, sha: cmdSha, new: cmdNew, approve: cmdApprove, retire: cmdRetire, check: cmdCheck, help };
(table[cmd] || help)();

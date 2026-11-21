#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const USAGE = `Usage: node bootstrap-game.mjs --slug <kebab-slug> --name "<Game Name>" [--engine Godot|Unity|Unreal|Web|Custom] [--genre "<Genre>"] [--rigor minimal|standard|full] [--owner <github-user>] [--vault] [--json] [--help]

Scaffolds a lean, standalone game repository under Projects/<slug>/ inheriting Studio skills.
`;

const ENGINE_MAP = {
  Godot: { code: 'src/', assets: 'assets/', tests: 'tests/', locks: '".tscn", ".tres", "project.godot"', ignore: '.godot/\n*.import\nexport_presets.cfg\n' },
  Unity: { code: 'Assets/_Game/Scripts/', assets: 'Assets/_Game/Art/', tests: 'Assets/Tests/', locks: '".unity", ".prefab", ".asset"', ignore: '[Ll]ibrary/\n[Tt]emp/\n[Oo]bj/\n[Bb]uild/\n[Bb]uilds/\n[Ll]ogs/\n[Uu]ser[Ss]ettings/\n' },
  Unreal: { code: 'Source/', assets: 'Content/_Game/', tests: 'Source/Tests/', locks: '".uasset", ".umap"', ignore: 'Binaries/\nDerivedDataCache/\nIntermediate/\nSaved/\n*.VC.db\n*.opensdf\n' },
  Web: { code: 'src/', assets: 'public/assets/', tests: 'tests/', locks: '"index.html"', ignore: 'node_modules/\ndist/\n.vite/\n' },
  Custom: { code: 'src/', assets: 'assets/', tests: 'tests/', locks: '".scene"', ignore: 'build/\ncache/\n' }
};

const { values } = parseArgs({
  options: {
    slug: { type: 'string', default: '' },
    name: { type: 'string', default: '' },
    engine: { type: 'string', default: 'Godot' },
    genre: { type: 'string', default: 'TBD' },
    rigor: { type: 'string', default: 'minimal' },
    owner: { type: 'string', default: 'qthan1004' },
    vault: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help || !values.slug || !values.name) {
  process.stdout.write(USAGE);
  process.exit(values.help ? 0 : 2);
}

const workspaceRoot = path.resolve(import.meta.dirname, '..', '..');
const templateDir = path.join(workspaceRoot, '.agent', '_TEMPLATE', 'project-scaffold');
const targetDir = path.join(workspaceRoot, 'Projects', values.slug);

if (fs.existsSync(targetDir)) {
  process.stderr.write(`ERROR: Target directory already exists: ${targetDir}\n`);
  process.exit(1);
}

const eng = ENGINE_MAP[values.engine] || ENGINE_MAP.Custom;
const today = new Date().toISOString().slice(0, 10);

function render(tplName) {
  const raw = fs.readFileSync(path.join(templateDir, tplName), 'utf8');
  return raw
    .replaceAll('{{PROJECT_NAME}}', values.name)
    .replaceAll('{{SLUG}}', values.slug)
    .replaceAll('{{OWNER}}', values.owner)
    .replaceAll('{{GENRE}}', values.genre)
    .replaceAll('{{ENGINE}}', values.engine)
    .replaceAll('{{RIGOR}}', values.rigor)
    .replaceAll('{{CODE_ROOT}}', eng.code)
    .replaceAll('{{ASSET_ROOT}}', eng.assets)
    .replaceAll('{{TEST_ROOT}}', eng.tests)
    .replaceAll('{{SCENE_LOCKS}}', eng.locks)
    .replaceAll('{{DATE}}', today);
}

const dirs = [
  '.agent/skills',
  '.github/workflows',
  'departments/01_narrative',
  'departments/02_game_design',
  'departments/03_balance_economy',
  'departments/04_level_world',
  'departments/05_art_vfx_audio',
  'departments/06_architecture_tech',
  'data',
  'prototypes',
  'tools',
  eng.code,
  eng.assets,
  eng.tests
];

for (const d of dirs) fs.mkdirSync(path.join(targetDir, d), { recursive: true });

fs.writeFileSync(path.join(targetDir, 'PROJECT.md'), render('PROJECT.md'));
fs.writeFileSync(path.join(targetDir, 'STYLE_ANCHOR.md'), render('STYLE_ANCHOR.md'));
fs.writeFileSync(path.join(targetDir, '.versionrc.json'), render('versionrc.json'));
fs.writeFileSync(path.join(targetDir, '.github', 'workflows', 'studio-board.yml'), render('studio-board.yml'));
fs.writeFileSync(path.join(targetDir, 'departments', 'MOC.md'), render('MOC.md'));
fs.writeFileSync(path.join(targetDir, 'departments', 'registry.yaml'), render('registry.yaml'));
fs.writeFileSync(path.join(targetDir, '.agent', 'skills', 'README.md'), render('skills-README.md'));

const brief = `---\ntitle: "${values.name} — Tóm Tắt Thiết Kế (Game Brief)"\nowner: "designer"\nstatus: "draft"\nupdated: "${today}"\n---\n\n# ${values.name} — Tóm Tắt Cốt Lõi (One-Page Brief)\n\n- **Trải nghiệm cốt lõi (\`Core Fantasy\`):** TBD\n- **60 Giây đầu tiên:** TBD\n- **Vòng lặp chính (\`Core Loop\`):** TBD\n- **Thứ tự dựng bản chơi thử (\`Build Order\`):**\n  1. Điều khiển & cảm giác phản hồi cơ bản\n  2. Cơ chế tương tác / thử thách trọng tâm\n  3. Khép vòng lặp thắng/thua & cổng kiểm thử nhanh\n`;
fs.writeFileSync(path.join(targetDir, 'departments', '02_game_design', 'game-brief.md'), brief);

const entrypoint = `# ${values.name} — Agent Entrypoint\n\nRead and follow in order:\n1. [../../.agent/PREFLIGHT.md](../../.agent/PREFLIGHT.md)\n2. [../../.agent/DIRECTOR_PROFILE.md](../../.agent/DIRECTOR_PROFILE.md)\n3. [PROJECT.md](PROJECT.md) & [STYLE_ANCHOR.md](STYLE_ANCHOR.md)\n4. [departments/MOC.md](departments/MOC.md) & [.agent/skills/README.md](.agent/skills/README.md)\n`;
for (const ep of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) {
  fs.writeFileSync(path.join(targetDir, ep), entrypoint);
}

fs.writeFileSync(path.join(targetDir, '.agent', 'skills.json'), JSON.stringify({
  inherits: [{ path: '../../.agent/skills.json' }],
  entries: [{ path: '.agent/skills' }]
}, null, 2) + '\n');

fs.writeFileSync(path.join(targetDir, '.gitignore'), `# Studio & local overrides\nproject.local.yaml\n.agent-runs/\n.env\n.env.*\n!.env.example\n.DS_Store\nThumbs.db\n\n# Engine (${values.engine})\n${eng.ignore}`);
fs.writeFileSync(path.join(targetDir, '.gitattributes'), `*.psd filter=lfs diff=lfs merge=lfs -text\n*.blend filter=lfs diff=lfs merge=lfs -text\n*.fbx filter=lfs diff=lfs merge=lfs -text\n*.glb filter=lfs diff=lfs merge=lfs -text\n*.wav filter=lfs diff=lfs merge=lfs -text\n*.ogg filter=lfs diff=lfs merge=lfs -text\n*.mp4 filter=lfs diff=lfs merge=lfs -text\n`);

execFileSync('git', ['init', '-b', 'main'], { cwd: targetDir, stdio: 'ignore' });

let vaultLinked = false;
if (values.vault) {
  const vaultRoot = path.join(workspaceRoot, 'StudioVault');
  fs.mkdirSync(vaultRoot, { recursive: true });
  const linkPath = path.join(vaultRoot, values.slug);
  if (!fs.existsSync(linkPath)) {
    fs.symlinkSync(path.join(targetDir, 'departments'), linkPath, 'junction');
    vaultLinked = true;
  }
}

const out = { ok: true, slug: values.slug, path: targetDir, engine: values.engine, vaultLinked };
if (values.json) process.stdout.write(JSON.stringify(out, null, 2) + '\n');
else process.stdout.write(`Bootstrapped ${values.name} at ${targetDir}\n`);

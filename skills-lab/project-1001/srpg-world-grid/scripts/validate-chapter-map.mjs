#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const TOOL_VERSION = '0.1.0';

const LIMITS = Object.freeze({
  maxGridWidth: 36,
  maxGridHeight: 36,
  tileSizeMeters: 2.0,
  elevationStepMeters: 1.0,
  globalTurnBaseTicks: 100,
  mirelleBellIntervalTicks: 60,
  maxActiveUnits: 48,
  maxTrapsPerThreeChokeWidth: 1,
  maxThreatOverlap: 2,
  enemySpawnApMin: 25,
  enemySpawnApMax: 30,
  alliedSpawnApMin: 30,
  alliedSpawnApMax: 35,
  clpStandardMax: 10,
  clpClimaxMax: 12,
  shotClockMinSec: 30,
  shotClockMaxSec: 60,
  highSpeedThreshold: 22,
  minRegionTilesForChokeSplit: 4,
  defaultSeeds: 1000,
  poolPlacementAttempts: 5
});

const NO_GO_RANGES = Object.freeze({
  C14: { min: 4, max: 9 },
  C15: { min: 2, max: 6 },
  C28: { min: 1, max: 8 },
  C38: { min: 2, max: 6 }
});

const HIGH_SPEED_DEFAULTS = Object.freeze({
  C18: { spd: 23, move: 6, maxRange: 1 },
  C19: { spd: 25, move: 5, maxRange: 2 },
  C23: { spd: 24, move: 6, maxRange: 1 },
  C24: { spd: 27, move: 6, maxRange: 1 },
  C31: { spd: 24, move: 6, maxRange: 2 },
  C35: { spd: 28, move: 6, maxRange: 1 },
  C39: { spd: 27, move: 5, maxRange: 2 }
});

const USAGE = `Usage: node scripts/validate-chapter-map.mjs --map <path.json> [--seeds 1000] [--json] [--help]

Validates Project 1001 chapter MapBlueprint JSON files against v0.1.0 WorldState & Tactical Grid invariants.
`;

// Advance deterministic 32-bit PRNG state using Mulberry32 mixing.
function createMulberry32(seed) {
  let state = seed >>> 0;
  return function nextFloat() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert array or object coordinate notation into a normalized [x, y] pair.
function normalizeCoord(raw) {
  if (Array.isArray(raw) && raw.length >= 2 && Number.isInteger(raw[0]) && Number.isInteger(raw[1])) {
    return [raw[0], raw[1]];
  }
  if (raw && typeof raw === 'object' && Number.isInteger(raw.x) && Number.isInteger(raw.y)) {
    return [raw.x, raw.y];
  }
  return null;
}

// Extract normalized unit archetype codes from flexible deployment record shapes.
function extractUnitCodes(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const codes = [];
  for (const single of [entry.unitCode, entry.unit_code, entry.archetype]) {
    if (typeof single === 'string' && single.trim()) codes.push(single.trim());
  }
  for (const list of [entry.unitCodes, entry.unit_codes, entry.archetypes]) {
    if (Array.isArray(list)) {
      for (const item of list) {
        if (typeof item === 'string' && item.trim()) codes.push(item.trim());
      }
    }
  }
  if (Array.isArray(entry.units)) {
    for (const unit of entry.units) {
      if (typeof unit === 'string' && unit.trim()) codes.push(unit.trim());
      else if (unit && typeof unit === 'object') codes.push(...extractUnitCodes(unit));
    }
  }
  return codes;
}

// Classify a 2D matrix cell into solid, walkable, or destructible-breach passability.
function classifyGridCell(cell) {
  if (cell === false || cell === 0 || cell === null || cell === undefined) return 'solid';
  if (cell === true || cell === 1) return 'walkable';
  if (typeof cell === 'string') {
    const token = cell.trim().toLowerCase();
    if (!token || token === '#' || token === 'wall' || token === 'solid' || token === 'cliff' || token === 'void' || token === 'pillar') {
      return 'solid';
    }
    if (token.includes('breach') || token.includes('destructible')) return 'breach';
    return 'walkable';
  }
  if (cell && typeof cell === 'object') {
    if (cell.destructible || cell.isBreachWall || cell.kitId === 'kit_wall_breach_1x1') return 'breach';
    if (cell.walkable === false || cell.blocked === true) return 'solid';
    return 'walkable';
  }
  return 'walkable';
}

// Measure connected component sizes after excluding a candidate cut-vertex tile.
function findSplitComponentSizes(passableSet, width, height, blockedKey) {
  const visited = new Set([blockedKey]);
  const sizes = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const key of passableSet) {
    if (visited.has(key)) continue;
    let count = 0;
    const queue = [key];
    visited.add(key);
    while (queue.length > 0) {
      const cur = queue.pop();
      count++;
      const [cx, cy] = cur.split(',').map(Number);
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nKey = `${nx},${ny}`;
        if (!visited.has(nKey) && passableSet.has(nKey)) {
          visited.add(nKey);
          queue.push(nKey);
        }
      }
    }
    sizes.push(count);
  }
  return sizes;
}

// Detect 1-tile orthogonal cut-vertices lacking any flank or destructible-wall bypass.
function findUnbypassedOneTileCorridors(matrix, width, height) {
  const passable = new Set();
  const walkable = new Set();
  for (let y = 0; y < height; y++) {
    const row = matrix[y];
    if (!Array.isArray(row)) continue;
    for (let x = 0; x < width; x++) {
      const kind = classifyGridCell(row[x]);
      if (kind === 'walkable' || kind === 'breach') passable.add(`${x},${y}`);
      if (kind === 'walkable') walkable.add(`${x},${y}`);
    }
  }
  const narrowCutCoords = [];
  for (const key of walkable) {
    const [x, y] = key.split(',').map(Number);
    const leftOpen = passable.has(`${x - 1},${y}`);
    const rightOpen = passable.has(`${x + 1},${y}`);
    const upOpen = passable.has(`${x},${y - 1}`);
    const downOpen = passable.has(`${x},${y + 1}`);
    const isVerticalTube = !leftOpen && !rightOpen && upOpen && downOpen;
    const isHorizontalTube = !upOpen && !downOpen && leftOpen && rightOpen;
    if (!isVerticalTube && !isHorizontalTube) continue;
    const sizes = findSplitComponentSizes(passable, width, height, key);
    const majorRegions = sizes.filter((s) => s >= LIMITS.minRegionTilesForChokeSplit);
    if (majorRegions.length >= 2) narrowCutCoords.push([x, y]);
  }
  return narrowCutCoords;
}

// Count how many placed No-Go Zone emitters cover a target coordinate via Manhattan distance.
function computeThreatOverlapAt(coord, emitters) {
  const [tx, ty] = coord;
  let overlap = 0;
  for (const emitter of emitters) {
    const dist = Math.abs(tx - emitter.coord[0]) + Math.abs(ty - emitter.coord[1]);
    if (dist >= emitter.minRange && dist <= emitter.maxRange) overlap++;
  }
  return overlap;
}

// Shuffle indices deterministically in-place via Fisher-Yates to sample pool candidates.
function sampleDistinctIndices(length, count, rng) {
  const idx = Array.from({ length }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = idx[i];
    idx[i] = idx[j];
    idx[j] = tmp;
  }
  return idx.slice(0, count);
}

// Validate a parsed chapter MapBlueprint object and return structured diagnostics.
export function validateChapterMap(raw, seedCount = LIMITS.defaultSeeds) {
  const errors = [];
  const warnings = [];
  const checks = {
    gridBounds: true,
    globalTurnBaseTicks: true,
    activeUnitCap: true,
    chokeCorridors: true,
    noGoZoneSlotPool: true,
    spawnApBounds: true,
    cognitiveLoadPoints: true,
    seedSimulation: true
  };

  const fail = (checkKey, message) => {
    checks[checkKey] = false;
    errors.push(message);
  };

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    fail('gridBounds', 'Root chapter map payload must be a JSON object.');
    return { ok: false, chapterId: 'unknown', seedsTested: 0, checks, errors, warnings };
  }

  const chapterId = String(raw.chapterId ?? raw.chapter_id ?? 'unnamed_chapter');
  const grid = raw.grid && typeof raw.grid === 'object' ? raw.grid : {};
  const width = grid.width ?? raw.grid_width ?? raw.width;
  const height = grid.height ?? raw.grid_height ?? raw.height;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > LIMITS.maxGridWidth || height > LIMITS.maxGridHeight) {
    fail('gridBounds', `Grid bounds must be integers within 1..${LIMITS.maxGridWidth}x1..${LIMITS.maxGridHeight}; got ${width}x${height}.`);
  }

  const tileSize = grid.tileSizeMeters ?? grid.tile_size_m ?? raw.grid_tile_size_m;
  if (tileSize !== undefined && tileSize !== LIMITS.tileSizeMeters) {
    fail('gridBounds', `grid.tileSizeMeters must equal ${LIMITS.tileSizeMeters}; got ${tileSize}.`);
  }

  const elevStep = grid.elevationStepMeters ?? grid.elevation_step_m ?? raw.grid_elevation_step_m;
  if (elevStep !== undefined && elevStep !== LIMITS.elevationStepMeters) {
    fail('gridBounds', `grid.elevationStepMeters must equal ${LIMITS.elevationStepMeters}; got ${elevStep}.`);
  }

  const baseTicks = raw.globalTurnBaseTicks ?? raw.global_turn_base_ticks;
  if (baseTicks !== LIMITS.globalTurnBaseTicks) {
    fail('globalTurnBaseTicks', `global_turn_base_ticks must strictly equal ${LIMITS.globalTurnBaseTicks}; got ${baseTicks}.`);
  }

  const bellTicks = raw.mirelleBellIntervalTicks ?? raw.mirelle_bell_interval_ticks;
  if (bellTicks !== undefined && bellTicks !== LIMITS.mirelleBellIntervalTicks) {
    fail('globalTurnBaseTicks', `mirelle_bell_interval_ticks must equal ${LIMITS.mirelleBellIntervalTicks} when specified; got ${bellTicks}.`);
  }

  const sanity = (raw.sanityClamp ?? raw.sanity_clamp) || {};
  const activeUnitCap = sanity.maxActiveUnits ?? sanity.active_unit_cap ?? raw.active_unit_cap ?? raw.maxActiveUnits;
  if (!Number.isInteger(activeUnitCap) || activeUnitCap < 1 || activeUnitCap > LIMITS.maxActiveUnits) {
    fail('activeUnitCap', `active_unit_cap must be an integer within 1..${LIMITS.maxActiveUnits}; got ${activeUnitCap}.`);
  }

  const trapCap = sanity.maxTrapsPerThreeChokeWidth ?? sanity.max_traps_per_three_choke_width ?? raw.max_traps_per_three_choke_width;
  if (trapCap !== undefined && (!Number.isFinite(trapCap) || trapCap < 0 || trapCap > LIMITS.maxTrapsPerThreeChokeWidth)) {
    fail('activeUnitCap', `maxTrapsPerThreeChokeWidth must be within 0..${LIMITS.maxTrapsPerThreeChokeWidth}; got ${trapCap}.`);
  }

  const chokes = raw.chokes ?? raw.chokePoints ?? raw.choke_points ?? raw.corridors ?? grid.chokes ?? grid.corridors ?? [];
  const criticalCoords = [];
  if (Array.isArray(chokes)) {
    for (let i = 0; i < chokes.length; i++) {
      const choke = chokes[i];
      if (!choke || typeof choke !== 'object') continue;
      const chokeId = choke.id ?? choke.chokeId ?? choke.choke_id ?? `choke_${i}`;
      const widthTiles = choke.widthTiles ?? choke.width_tiles ?? choke.width;
      const role = String(choke.role ?? choke.type ?? choke.axis ?? 'main').toLowerCase();
      const isMain = (choke.isMain ?? choke.is_main) ?? (role !== 'flank' && role !== 'side' && role !== 'bypass');
      const hasBypass = Boolean(
        choke.hasDestructibleBypass ?? choke.has_destructible_bypass ??
        choke.hasFlankBypass ?? choke.has_flank_bypass ??
        choke.hasBypass ?? choke.has_bypass ??
        choke.bypassWallId ?? choke.bypass_wall_id ??
        choke.flankRouteId ?? choke.flank_route_id
      );
      if (!Number.isInteger(widthTiles) || widthTiles < 1) {
        fail('chokeCorridors', `Choke '${chokeId}' must specify an integer width >= 1; got ${widthTiles}.`);
      } else if (widthTiles === 1 && isMain && !hasBypass) {
        fail('chokeCorridors', `Main choke corridor '${chokeId}' is 1 tile wide without a destructible breach wall or flank bypass.`);
      } else if (widthTiles === 1 && isMain && hasBypass) {
        warnings.push(`Main choke '${chokeId}' is 1 tile wide; prefer 2-3 tile choke gates even when a bypass exists.`);
      }
      for (const c of (choke.coords ?? choke.tiles ?? (choke.coord ? [choke.coord] : []))) {
        const norm = normalizeCoord(c);
        if (norm) criticalCoords.push(norm);
      }
    }
  }

  const tileMatrix = grid.tiles ?? grid.walkableGrid ?? grid.walkable_grid ?? raw.tiles ?? raw.walkable_grid;
  if (Array.isArray(tileMatrix) && Number.isInteger(width) && Number.isInteger(height) && checks.gridBounds) {
    if (tileMatrix.length !== height || tileMatrix.some((row) => !Array.isArray(row) || row.length !== width)) {
      fail('gridBounds', `2D tile matrix dimensions must match ${width}x${height}.`);
    } else {
      const cutTiles = findUnbypassedOneTileCorridors(tileMatrix, width, height);
      if (cutTiles.length > 0) {
        const sample = cutTiles.slice(0, 3).map(([x, y]) => `(${x},${y})`).join(', ');
        fail('chokeCorridors', `Detected ${cutTiles.length} narrow 1-tile main corridor bottleneck(s) without destructible/flank bypass at ${sample}.`);
      }
    }
  }

  const playerSpawns = [];
  for (const rawSpawn of (raw.playerSpawns ?? raw.player_spawns ?? raw.deploymentRules?.playerSpawns ?? raw.deployment_rules?.player_spawns ?? [])) {
    const norm = normalizeCoord(rawSpawn);
    if (norm) {
      playerSpawns.push(norm);
      criticalCoords.push(norm);
    }
  }

  const deploy = (raw.deploymentRules ?? raw.deployment_rules) || {};
  const maxOverlapCfg = deploy.maxThreatOverlapLongRange ?? deploy.max_threat_overlap ?? raw.max_threat_overlap ?? raw.maxThreatOverlap ?? LIMITS.maxThreatOverlap;
  if (!Number.isFinite(maxOverlapCfg) || maxOverlapCfg < 0 || maxOverlapCfg > LIMITS.maxThreatOverlap) {
    fail('noGoZoneSlotPool', `max_threat_overlap must be within 0..${LIMITS.maxThreatOverlap}; got ${maxOverlapCfg}.`);
  }

  const observedOverlap = raw.observed_max_threat_overlap ?? deploy.observedMaxThreatOverlap ?? deploy.observed_max_threat_overlap;
  if (observedOverlap !== undefined && (!Number.isFinite(observedOverlap) || observedOverlap > LIMITS.maxThreatOverlap)) {
    fail('noGoZoneSlotPool', `Observed threat overlap (${observedOverlap}) exceeds ceiling of ${LIMITS.maxThreatOverlap}.`);
  }

  const fixedList = Array.isArray(deploy.fixed ?? raw.fixed) ? (deploy.fixed ?? raw.fixed) : [];
  const slotPools = Array.isArray(deploy.slotPools ?? deploy.slot_pools ?? raw.slot_pools) ? (deploy.slotPools ?? deploy.slot_pools ?? raw.slot_pools) : [];
  const zoneScatters = Array.isArray(deploy.zoneScatters ?? deploy.zone_scatters ?? raw.zone_scatters) ? (deploy.zoneScatters ?? deploy.zone_scatters ?? raw.zone_scatters) : [];

  const knownAnchorIds = new Set();
  let initialUnitCount = playerSpawns.length;

  for (const item of fixedList) {
    const id = item?.slotId ?? item?.slot_id ?? item?.id;
    if (id) knownAnchorIds.add(id);
    const codes = extractUnitCodes(item);
    initialUnitCount += Math.max(codes.length, item?.unitCode || item?.unit_code ? 1 : 0);
    for (const code of codes) {
      if (Object.hasOwn(NO_GO_RANGES, code)) {
        fail('noGoZoneSlotPool', `No-Go Zone archetype '${code}' found in FIXED; must be placed via SLOT_POOL.`);
      }
    }
    if (item?.coord !== undefined && checks.gridBounds) {
      const c = normalizeCoord(item.coord);
      if (!c || c[0] < 0 || c[0] >= width || c[1] < 0 || c[1] >= height) {
        fail('gridBounds', `FIXED slot '${id ?? 'unnamed'}' coordinate is out of bounds.`);
      }
    }
  }

  for (const item of zoneScatters) {
    const codes = extractUnitCodes(item);
    initialUnitCount += Number.isInteger(item?.count) ? item.count : codes.length;
    for (const code of codes) {
      if (Object.hasOwn(NO_GO_RANGES, code)) {
        fail('noGoZoneSlotPool', `No-Go Zone archetype '${code}' found in ZONE_SCATTER; must be placed via SLOT_POOL.`);
      }
    }
  }

  for (const topUnit of (Array.isArray(raw.units) ? raw.units : [])) {
    const tier = String(topUnit?.placement ?? topUnit?.tier ?? 'FIXED').toUpperCase();
    for (const code of extractUnitCodes(topUnit)) {
      if (Object.hasOwn(NO_GO_RANGES, code) && tier !== 'SLOT_POOL') {
        fail('noGoZoneSlotPool', `No-Go Zone archetype '${code}' assigned to '${tier}'; SLOT_POOL is required.`);
      }
    }
  }

  const parsedPools = [];
  for (let i = 0; i < slotPools.length; i++) {
    const pool = slotPools[i];
    const poolId = pool?.poolId ?? pool?.pool_id ?? pool?.id ?? `pool_${i}`;
    knownAnchorIds.add(poolId);
    const codes = extractUnitCodes(pool);
    initialUnitCount += codes.length;
    const rawCandidates = pool?.candidateCoords ?? pool?.candidate_coords ?? pool?.candidates ?? pool?.coords ?? [];
    const candidates = [];
    for (const rc of rawCandidates) {
      const c = normalizeCoord(rc);
      if (!c || (checks.gridBounds && (c[0] < 0 || c[0] >= width || c[1] < 0 || c[1] >= height))) {
        fail('gridBounds', `SLOT_POOL '${poolId}' contains out-of-bounds candidate coordinate.`);
      } else if (c) {
        candidates.push(c);
      }
    }
    if (codes.length > 0 && candidates.length < codes.length) {
      fail('noGoZoneSlotPool', `SLOT_POOL '${poolId}' has ${codes.length} unit(s) but only ${candidates.length} valid candidateCoords.`);
    }
    if (pool?.maxThreatOverlap !== undefined || pool?.max_threat_overlap !== undefined) {
      const pOverlap = pool.maxThreatOverlap ?? pool.max_threat_overlap;
      if (!Number.isFinite(pOverlap) || pOverlap > LIMITS.maxThreatOverlap) {
        fail('noGoZoneSlotPool', `SLOT_POOL '${poolId}' maxThreatOverlap (${pOverlap}) exceeds ${LIMITS.maxThreatOverlap}.`);
      }
    }
    parsedPools.push({ poolId, codes, candidates, minRange: pool?.minRange ?? pool?.min_range, maxRange: pool?.maxRange ?? pool?.max_range });
  }

  for (const scatter of zoneScatters) {
    const anchorId = scatter?.anchorPoolId ?? scatter?.anchor_pool_id;
    if (anchorId && !knownAnchorIds.has(anchorId)) {
      fail('seedSimulation', `ZONE_SCATTER '${scatter.zoneId ?? scatter.zone_id ?? 'unnamed'}' references missing Virtual Squad Anchor '${anchorId}'.`);
    }
  }

  if (checks.activeUnitCap && initialUnitCount > activeUnitCap) {
    fail('activeUnitCap', `Initial deployed unit count (${initialUnitCount}) exceeds active_unit_cap (${activeUnitCap}).`);
  }

  const reinfRules = (raw.reinforcementRules ?? raw.reinforcement_rules) || {};
  const enemyApCap = raw.enemy_spawn_ap_cap ?? raw.enemySpawnApCap ?? reinfRules.enemySpawnApCap ?? reinfRules.enemy_spawn_ap_cap;
  if (enemyApCap !== undefined && (!Number.isFinite(enemyApCap) || enemyApCap < LIMITS.enemySpawnApMin || enemyApCap > LIMITS.enemySpawnApMax)) {
    fail('spawnApBounds', `enemy_spawn_ap_cap must be within ${LIMITS.enemySpawnApMin}..${LIMITS.enemySpawnApMax}; got ${enemyApCap}.`);
  }

  const alliedApCfg = raw.allied_spawn_ap ?? raw.alliedSpawnAp ?? reinfRules.alliedSpawnAp ?? reinfRules.allied_spawn_ap;
  if (alliedApCfg !== undefined) {
    if (typeof alliedApCfg === 'number') {
      if (!Number.isFinite(alliedApCfg) || alliedApCfg < LIMITS.alliedSpawnApMin || alliedApCfg > LIMITS.alliedSpawnApMax) {
        fail('spawnApBounds', `allied_spawn_ap must be within ${LIMITS.alliedSpawnApMin}..${LIMITS.alliedSpawnApMax}; got ${alliedApCfg}.`);
      }
    } else if (Array.isArray(alliedApCfg) && alliedApCfg.length === 2) {
      if (alliedApCfg[0] < LIMITS.alliedSpawnApMin || alliedApCfg[1] > LIMITS.alliedSpawnApMax || alliedApCfg[0] > alliedApCfg[1]) {
        fail('spawnApBounds', `allied_spawn_ap range [${alliedApCfg.join(', ')}] must stay within ${LIMITS.alliedSpawnApMin}..${LIMITS.alliedSpawnApMax}.`);
      }
    } else if (alliedApCfg && typeof alliedApCfg === 'object') {
      const aMin = alliedApCfg.min ?? alliedApCfg.minAp;
      const aMax = alliedApCfg.max ?? alliedApCfg.maxAp;
      if (!Number.isFinite(aMin) || !Number.isFinite(aMax) || aMin < LIMITS.alliedSpawnApMin || aMax > LIMITS.alliedSpawnApMax || aMin > aMax) {
        fail('spawnApBounds', `allied_spawn_ap object must stay within ${LIMITS.alliedSpawnApMin}..${LIMITS.alliedSpawnApMax}.`);
      }
    } else {
      fail('spawnApBounds', 'allied_spawn_ap must be a number or [min, max] range within 30..35.');
    }
  }

  const effectiveEnemyMaxAp = Number.isFinite(enemyApCap) ? Math.min(enemyApCap, LIMITS.enemySpawnApMax) : LIMITS.enemySpawnApMax;
  const turnEvents = Array.isArray(raw.turnLineEvents ?? raw.turn_line_events) ? (raw.turnLineEvents ?? raw.turn_line_events) : [];
  const allReinforcements = [...(Array.isArray(raw.reinforcements) ? raw.reinforcements : [])];

  for (let i = 0; i < turnEvents.length; i++) {
    const ev = turnEvents[i];
    if (!ev || typeof ev !== 'object') continue;
    const triggerTurn = ev.triggerTurn ?? ev.trigger_turn;
    const telegraphTurn = ev.telegraphTurn ?? ev.telegraph_turn;
    if (telegraphTurn !== undefined && triggerTurn !== undefined && triggerTurn - telegraphTurn < 1) {
      fail('spawnApBounds', `turnLineEvents[${i}] violates 1-Turn telegraph rule (triggerTurn=${triggerTurn}, telegraphTurn=${telegraphTurn}).`);
    }
    if (Array.isArray(ev.reinforcements)) {
      for (const r of ev.reinforcements) allReinforcements.push(r);
    }
  }

  for (let i = 0; i < allReinforcements.length; i++) {
    const r = allReinforcements[i];
    if (!r || typeof r !== 'object') continue;
    const faction = String(r.faction ?? r.side ?? 'enemy').toLowerCase();
    const spawnAp = r.spawnAp ?? r.spawn_ap;
    if (typeof spawnAp !== 'number' || !Number.isFinite(spawnAp)) {
      fail('spawnApBounds', `Reinforcement[${i}] is missing numeric spawnAp.`);
      continue;
    }
    if (faction === 'enemy' || faction === 'amber' || faction === 'hostile') {
      if (spawnAp < LIMITS.enemySpawnApMin || spawnAp > effectiveEnemyMaxAp) {
        fail('spawnApBounds', `Enemy reinforcement[${i}] spawnAp (${spawnAp}) must be within ${LIMITS.enemySpawnApMin}..${effectiveEnemyMaxAp}.`);
      }
    } else if (faction === 'ally' || faction === 'allied' || faction === 'azure' || faction === 'player') {
      if (spawnAp < LIMITS.alliedSpawnApMin || spawnAp > LIMITS.alliedSpawnApMax) {
        fail('spawnApBounds', `Allied reinforcement[${i}] spawnAp (${spawnAp}) must be within ${LIMITS.alliedSpawnApMin}..${LIMITS.alliedSpawnApMax}.`);
      }
    } else {
      fail('spawnApBounds', `Reinforcement[${i}] has unknown faction '${faction}'.`);
    }
  }

  const clp = raw.cognitive_load_points ?? raw.cognitiveLoadPoints ?? raw.cognitiveLoadScore ?? raw.clp;
  const climaxOverride = Boolean(raw.climax_override ?? raw.climaxOverride ?? raw.isClimaxChapter ?? raw.is_climax_chapter);
  const clpCeiling = climaxOverride ? LIMITS.clpClimaxMax : LIMITS.clpStandardMax;
  if (typeof clp !== 'number' || !Number.isFinite(clp) || clp < 0 || clp > clpCeiling) {
    fail('cognitiveLoadPoints', `cognitive_load_points must be within 0..${clpCeiling}${climaxOverride ? ' (climax override)' : ''}; got ${clp}.`);
  }

  const hasFog = Boolean(
    raw.hasAshlungFog ?? raw.has_ashlung_fog ??
    turnEvents.some((ev) => (ev?.phenomenonId ?? ev?.phenomenon_id) === 'phenom_ashlung_surge')
  );
  if ((raw.allowFogBlindArtillery ?? raw.allow_fog_blind_artillery) === true || (hasFog && (raw.fogArtilleryLock ?? raw.fog_artillery_lock) === false)) {
    fail('cognitiveLoadPoints', 'Ashlung Fog blind-artillery ban violated (Fog Artillery Lock must remain enabled).');
  }

  const shotClock = raw.shotClockHardSeconds ?? raw.shot_clock_hard_sec;
  if (shotClock !== undefined && (!Number.isFinite(shotClock) || shotClock < LIMITS.shotClockMinSec || shotClock > LIMITS.shotClockMaxSec)) {
    fail('cognitiveLoadPoints', `shotClockHardSeconds must be within ${LIMITS.shotClockMinSec}..${LIMITS.shotClockMaxSec}; got ${shotClock}.`);
  }

  const hasNoGoInPools = parsedPools.some((p) => p.codes.some((c) => Object.hasOwn(NO_GO_RANGES, c)));
  const hasHighSpdCheck = playerSpawns.length > 0 && parsedPools.some((p) => p.codes.some((c) => Object.hasOwn(HIGH_SPEED_DEFAULTS, c)));
  const seedsToRun = checks.gridBounds && checks.noGoZoneSlotPool && (hasNoGoInPools || hasHighSpdCheck) ? seedCount : (checks.gridBounds ? Math.min(seedCount, 64) : 0);

  const evalCoords = criticalCoords.length > 0 ? criticalCoords : [];
  if (evalCoords.length === 0 && hasNoGoInPools && checks.gridBounds) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!Array.isArray(tileMatrix) || classifyGridCell(tileMatrix[y]?.[x]) !== 'solid') {
          evalCoords.push([x, y]);
        }
      }
    }
  }

  const allowedOverlap = Math.min(Number.isFinite(maxOverlapCfg) ? maxOverlapCfg : LIMITS.maxThreatOverlap, LIMITS.maxThreatOverlap);
  let failedOverlapSeeds = 0;
  let failedFairStartSeeds = 0;

  for (let s = 1; s <= seedsToRun; s++) {
    const rng = createMulberry32(s * 2654435761);
    let seedOverlapOk = false;
    let seedFairOk = false;
    for (let attempt = 0; attempt < LIMITS.poolPlacementAttempts; attempt++) {
      const emitters = [];
      let fairAttemptOk = true;
      for (const pool of parsedPools) {
        if (pool.codes.length === 0 || pool.candidates.length < pool.codes.length) continue;
        const picked = sampleDistinctIndices(pool.candidates.length, pool.codes.length, rng);
        for (let u = 0; u < pool.codes.length; u++) {
          const code = pool.codes[u];
          const coord = pool.candidates[picked[u]];
          if (Object.hasOwn(NO_GO_RANGES, code)) {
            const def = NO_GO_RANGES[code];
            emitters.push({ coord, minRange: pool.minRange ?? def.min, maxRange: pool.maxRange ?? def.max });
          }
          if (playerSpawns.length > 0 && Object.hasOwn(HIGH_SPEED_DEFAULTS, code)) {
            const prof = HIGH_SPEED_DEFAULTS[code];
            const kAp = prof.spd >= LIMITS.highSpeedThreshold ? 2 : 1;
            const minSafeDist = kAp * prof.move + prof.maxRange;
            for (const sp of playerSpawns) {
              if (Math.abs(coord[0] - sp[0]) + Math.abs(coord[1] - sp[1]) <= minSafeDist) {
                fairAttemptOk = false;
                break;
              }
            }
          }
        }
      }
      let overlapAttemptOk = true;
      if (emitters.length > allowedOverlap) {
        for (const target of evalCoords) {
          if (computeThreatOverlapAt(target, emitters) > allowedOverlap) {
            overlapAttemptOk = false;
            break;
          }
        }
      }
      if (overlapAttemptOk && fairAttemptOk) {
        seedOverlapOk = true;
        seedFairOk = true;
        break;
      }
      if (overlapAttemptOk) seedOverlapOk = true;
      if (fairAttemptOk) seedFairOk = true;
    }
    if (!seedOverlapOk) failedOverlapSeeds++;
    if (!seedFairOk) failedFairStartSeeds++;
  }

  if (failedOverlapSeeds > 0) {
    fail('noGoZoneSlotPool', `SLOT_POOL No-Go Zone ThreatOverlap exceeded ${allowedOverlap} on ${failedOverlapSeeds}/${seedsToRun} deterministic seeds.`);
  }
  if (failedFairStartSeeds > 0) {
    fail('seedSimulation', `AP-Aware Fair Start (K_AP=2 for SPD>=22) failed on ${failedFairStartSeeds}/${seedsToRun} deterministic seeds.`);
  }

  return {
    tool: 'validate-chapter-map',
    version: TOOL_VERSION,
    ok: errors.length === 0,
    chapterId,
    seedsTested: seedsToRun,
    errorCount: errors.length,
    warningCount: warnings.length,
    checks,
    errors,
    warnings
  };
}

// Execute CLI entrypoint when invoked directly from Node.js.
function runCli() {
  const { values } = parseArgs({
    options: {
      map: { type: 'string', short: 'm' },
      seeds: { type: 'string', short: 's', default: String(LIMITS.defaultSeeds) },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false }
    },
    allowPositionals: true
  });

  if (values.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  if (!values.map) {
    const msg = 'Missing required --map <path.json> argument.';
    if (values.json) process.stdout.write(JSON.stringify({ tool: 'validate-chapter-map', ok: false, errors: [msg] }, null, 2) + '\n');
    else process.stderr.write(`ERROR: ${msg}\n${USAGE}`);
    process.exit(2);
  }

  const mapPath = path.resolve(values.map);
  if (!fs.existsSync(mapPath)) {
    const msg = `Chapter map file not found: ${mapPath}`;
    if (values.json) process.stdout.write(JSON.stringify({ tool: 'validate-chapter-map', ok: false, errors: [msg] }, null, 2) + '\n');
    else process.stderr.write(`ERROR: ${msg}\n`);
    process.exit(2);
  }

  const seeds = Number.parseInt(values.seeds, 10);
  if (!Number.isInteger(seeds) || seeds < 1 || seeds > 100000) {
    const msg = `Invalid --seeds count '${values.seeds}'; expected integer in 1..100000.`;
    if (values.json) process.stdout.write(JSON.stringify({ tool: 'validate-chapter-map', ok: false, errors: [msg] }, null, 2) + '\n');
    else process.stderr.write(`ERROR: ${msg}\n`);
    process.exit(2);
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } catch (err) {
    const msg = `Invalid JSON in ${path.basename(mapPath)}: ${err.message}`;
    if (values.json) process.stdout.write(JSON.stringify({ tool: 'validate-chapter-map', ok: false, errors: [msg] }, null, 2) + '\n');
    else process.stderr.write(`ERROR: ${msg}\n`);
    process.exit(2);
  }

  const report = validateChapterMap(parsedJson, seeds);
  if (values.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    for (const err of report.errors) process.stdout.write(`ERROR: ${err}\n`);
    for (const warn of report.warnings) process.stdout.write(`WARN: ${warn}\n`);
    process.stdout.write(
      `[${report.ok ? 'PASS' : 'FAIL'}] ${report.chapterId} — ${report.errorCount} error(s), ${report.warningCount} warning(s) across ${report.seedsTested} seed(s).\n`
    );
  }
  process.exit(report.ok ? 0 : 1);
}

if (import.meta.filename && path.resolve(process.argv[1] ?? '') === path.resolve(import.meta.filename)) {
  runCli();
}

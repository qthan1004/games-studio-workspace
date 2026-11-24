#!/usr/bin/env node
import { parseArgs } from 'node:util';

// Clamp numeric value into inclusive bounds.
function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

// Create deterministic Mulberry32 PRNG with unbiased 0..99 integer rolls.
function createPrng(seed) {
  let state = seed >>> 0;
  function nextUint32() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }
  function nextInt100() {
    const limit = 4294967200;
    let u = nextUint32();
    while (u >= limit) u = nextUint32();
    return u % 100;
  }
  function nextFloat() {
    return nextUint32() / 4294967296;
  }
  return { nextUint32, nextInt100, nextFloat };
}

// Pack hot unit fields into an exact 14-byte binary snapshot.
function packUnitHotState(u) {
  const buf = new ArrayBuffer(14);
  const view = new DataView(buf);
  const hp = clamp(u.currentHp, 0, 1000) & 0x3ff;
  const gray = clamp(u.lockedGrayHp, 0, 1000) & 0x3ff;
  const poise = clamp(u.poise, 0, 10) & 0x0f;
  const slot = clamp(u.weaponSlot, 0, 5) & 0x07;
  const friction = clamp(u.friction, 0, 5) & 0x07;
  const control = clamp(u.control, 0, 3) & 0x03;
  const word0 = (hp | (gray << 10) | (poise << 20) | (slot << 24) | (friction << 27) | (control << 30)) >>> 0;
  view.setUint32(0, word0, true);
  view.setUint8(4, clamp(u.rawAp, -50, 205) + 50);
  view.setUint8(5, clamp(u.currentSp, 0, 200));
  const flags = ((u.retaliationTokens & 0x03) | ((u.preCharge ? 1 : 0) << 2) | ((u.bastion ? 1 : 0) << 3)) & 0xffff;
  view.setUint16(6, flags, true);
  view.setUint8(8, u.gridX & 0xff);
  view.setUint8(9, u.gridY & 0xff);
  view.setUint16(10, u.statMods & 0xffff, true);
  view.setUint16(12, u.linksCooldowns & 0xffff, true);
  return { buf, view };
}

// Unpack key tactical fields from the 14-byte UnitHotState buffer.
function unpackUnitHotState(view) {
  const word0 = view.getUint32(0, true);
  const biasedAp = view.getUint8(4);
  const flags = view.getUint16(6, true);
  return {
    byteLength: view.byteLength,
    currentHp: word0 & 0x3ff,
    lockedGrayHp: (word0 >>> 10) & 0x3ff,
    poise: (word0 >>> 20) & 0x0f,
    weaponSlot: (word0 >>> 24) & 0x07,
    biasedAp,
    rawAp: biasedAp - 50,
    currentSp: view.getUint8(5),
    retaliationTokens: flags & 0x03,
    preCharge: Boolean((flags >>> 2) & 0x01)
  };
}

// Evaluate counter eligibility and single-target 80% Might [FF: OFF] payload.
function evaluateRetaliation(defenderState, weaponMight, suppressedBySkill = false) {
  if (suppressedBySkill) return { canCounter: false, reason: 'FLASH_SUPPRESS' };
  if (defenderState.rawAp < 0) return { canCounter: false, reason: 'NEGATIVE_AP' };
  if (defenderState.preCharge) return { canCounter: false, reason: 'PRE_CHARGE' };
  if (defenderState.poise <= 0) return { canCounter: false, reason: 'ZERO_POISE' };
  if (defenderState.retaliationTokens <= 0) return { canCounter: false, reason: 'NO_TOKEN' };
  return {
    canCounter: true,
    nextTokens: defenderState.retaliationTokens - 1,
    counterMight: Math.round(weaponMight * 0.8),
    singleTarget: true,
    friendlyFire: false
  };
}

// Compute exact combinatoric probability for 2-RN integer average over 0..99.
function exact2RnRate(threshold) {
  const t = clamp(threshold, 0, 100);
  let hits = 0;
  for (let r1 = 0; r1 < 100; r1++) {
    for (let r2 = 0; r2 < 100; r2++) {
      if (Math.floor((r1 + r2) / 2) < t) hits++;
    }
  }
  return hits / 10000;
}

// Verify 2-RN Hit vs 1-RN Crit analytically and via seeded Monte Carlo rolls.
function checkRngDistributions(prng, trials) {
  const exactHit30 = exact2RnRate(30);
  const exactHit72 = exact2RnRate(72);
  const exactCrit15OneRn = 0.15;
  const exactCrit15BuggyTwoRn = exact2RnRate(15);
  const critLossIfTwoRn = (exactCrit15OneRn - exactCrit15BuggyTwoRn) / exactCrit15OneRn;

  let mcHit30 = 0;
  let mcHit72 = 0;
  let mcCrit15 = 0;
  for (let i = 0; i < trials; i++) {
    if (Math.floor((prng.nextInt100() + prng.nextInt100()) / 2) < 30) mcHit30++;
    if (Math.floor((prng.nextInt100() + prng.nextInt100()) / 2) < 72) mcHit72++;
    if (prng.nextInt100() < 15) mcCrit15++;
  }
  const hit30Rate = mcHit30 / trials;
  const hit72Rate = mcHit72 / trials;
  const crit15Rate = mcCrit15 / trials;
  const ok =
    Math.abs(exactHit30 - 0.183) < 1e-9 &&
    Math.abs(exactHit72 - 0.846) < 1e-9 &&
    Math.abs(critLossIfTwoRn - 0.69) < 1e-9 &&
    Math.abs(hit30Rate - exactHit30) < 0.015 &&
    Math.abs(hit72Rate - exactHit72) < 0.015 &&
    Math.abs(crit15Rate - exactCrit15OneRn) < 0.012;

  return {
    ok,
    exact: { hit30_2rn: exactHit30, hit72_2rn: exactHit72, crit15_1rn: exactCrit15OneRn, crit15_buggy_2rn: exactCrit15BuggyTwoRn, crit15_2rn_loss: Number(critLossIfTwoRn.toFixed(4)) },
    monteCarlo: { trials, hit30_2rn: Number(hit30Rate.toFixed(4)), hit72_2rn: Number(hit72Rate.toFixed(4)), crit15_1rn: Number(crit15Rate.toFixed(4)) }
  };
}

// Simulate integer AP accumulation and action turnaround over fixed battle ticks.
function simulateApTimeline({ frameCon, baseStr, baseSpd, weaponWt, actionApCost, ticks = 500, useEffCon = true }) {
  const effCon = frameCon + Math.floor(baseStr / 8);
  const weightPen = useEffCon ? Math.max(0, weaponWt - effCon) : weaponWt;
  const effSpd = Math.max(4, baseSpd - weightPen);
  let rawAp = 35 + Math.floor((3 * effSpd) / 2);
  const integerInitOk = Number.isInteger(rawAp);
  let turns = 0;
  let tokenRefreshes = 0;
  let negativeTicks = 0;

  for (let t = 1; t <= ticks; t++) {
    rawAp = clamp(rawAp + effSpd, -50, 205);
    if (rawAp < 0) negativeTicks++;
    if (rawAp >= 100) {
      turns++;
      tokenRefreshes++;
      rawAp = clamp(rawAp - actionApCost, -50, 205);
    }
  }
  return { effCon, weightPen, effSpd, turns, tokenRefreshes, negativeTicks, integerInitOk, finalBiasedAp: rawAp + 50 };
}

// Verify FrameCon/EffCon eliminates heavy double-tax while penalizing off-frame heavy gear.
function checkEffConTurnaround() {
  const bramwellNew = simulateApTimeline({ frameCon: 13, baseStr: 26, baseSpd: 12, weaponWt: 12, actionApCost: 105, useEffCon: true });
  const bramwellLegacy = simulateApTimeline({ frameCon: 13, baseStr: 26, baseSpd: 12, weaponWt: 12, actionApCost: 105, useEffCon: false });
  const seraStiletto = simulateApTimeline({ frameCon: 5, baseStr: 15, baseSpd: 25, weaponWt: 1, actionApCost: 67, useEffCon: true });
  const seraWarhammer = simulateApTimeline({ frameCon: 5, baseStr: 15, baseSpd: 25, weaponWt: 12, actionApCost: 117, useEffCon: true });
  const oddSpdInit = 35 + Math.floor((3 * 13) / 2);

  const ok =
    oddSpdInit === 54 &&
    bramwellNew.effCon === 16 &&
    bramwellNew.weightPen === 0 &&
    bramwellNew.turns === 57 &&
    bramwellLegacy.turns === 19 &&
    bramwellNew.turns >= bramwellLegacy.turns * 3 &&
    seraStiletto.turns === 187 &&
    seraWarhammer.weightPen === 6 &&
    seraWarhammer.turns === 81;

  return { ok, oddSpdInit54: oddSpdInit, bramwellNew, bramwellLegacyTurns: bramwellLegacy.turns, seraStilettoTurns: seraStiletto.turns, seraWarhammer };
}

// Compute expected DP100AP using 2-RN hit, 1-RN crit, and weapon archetype formulas.
function computeDp100Ap(attacker, weapon, target) {
  const uiHit = clamp(weapon.hit + 2 * attacker.dex + Math.floor(attacker.lck / 2) + weapon.schoolHit - target.avoid, 5, 100);
  const uiCrit = clamp(weapon.crit + Math.floor(attacker.dex / 2) - target.lck, 0, 100);
  const pHit = exact2RnRate(uiHit);
  const pCrit = uiCrit / 100;

  let perStrikeDmg = 0;
  let strikes = 1;
  if (weapon.kind === 'TWIN_BLADES') {
    strikes = 2;
    const rawStrike = weapon.buggyScaleStr
      ? Math.round(0.6 * (attacker.str + weapon.might) * 0.85)
      : Math.round((attacker.str + 0.6 * weapon.might) * 0.85);
    perStrikeDmg = Math.max(1, rawStrike - target.def);
  } else if (weapon.kind === 'RAPIER') {
    const raw = Math.round((attacker.str + weapon.might) * 0.85);
    const effDef = Math.floor(target.def * (1 - weapon.defIgnore));
    perStrikeDmg = Math.max(1, raw - effDef);
  } else if (weapon.kind === 'PEERLESS_WARHAMMER') {
    const raw = Math.round((attacker.str + weapon.might) * 1.4);
    const effDef = Math.floor(target.def * (1 - weapon.defIgnore));
    perStrikeDmg = Math.max(1, raw - effDef);
  } else if (weapon.kind === 'ELEMENTAL_TOME') {
    perStrikeDmg = Math.max(1, attacker.mag + weapon.might - target.res);
  }

  const expectedPerStrike = pHit * perStrikeDmg * (1 + pCrit * (2.0 - 1.0));
  const dp100Ap = ((strikes * expectedPerStrike) / weapon.apCost) * 100;
  return Number(dp100Ap.toFixed(2));
}

// Resolve Reinhart bloodline Flash Suppress strike with 0% counter and min(DEF, RES) echo.
function resolveReinhartFlashSuppress(attacker, target, defenderHotState) {
  const mainHit = Math.max(1, Math.round(attacker.str * 1.35) - target.def);
  const adaptiveDef = Math.min(target.def, target.res);
  const echoHit = Math.max(1, Math.round((attacker.str + attacker.mag) * 0.55) - adaptiveDef);
  const counterCheck = evaluateRetaliation(defenderHotState, 10, true);
  return { totalDmg: mainHit + echoHit, adaptiveDefUsed: adaptiveDef, targetCanCounter: counterCheck.canCounter };
}

// Verify Twin Blades vs Peerless DP100AP counter-cycle, Rapier 20% pen, and Flash Suppress.
function checkCombatCounterCycle() {
  const swiftUser = { str: 21, mag: 8, dex: 19, lck: 12 };
  const heavyUser = { str: 23, mag: 6, dex: 19, lck: 12 };
  const mageUser = { str: 6, mag: 22, dex: 18, lck: 12 };
  const assassinC19 = { hp: 68, def: 10, res: 14, avoid: 58, lck: 14 };
  const heavyArmorC12 = { hp: 125, def: 26, res: 9, avoid: 18, lck: 8 };

  const twinV25 = { kind: 'TWIN_BLADES', might: 10, hit: 88, crit: 10, schoolHit: 20, apCost: 65, buggyScaleStr: false };
  const twinBuggy = { ...twinV25, buggyScaleStr: true };
  const rapier20 = { kind: 'RAPIER', might: 8, hit: 90, crit: 15, schoolHit: 20, apCost: 60, defIgnore: 0.2 };
  const warhammer = { kind: 'PEERLESS_WARHAMMER', might: 12, hit: 74, crit: 5, schoolHit: -20, apCost: 105, defIgnore: 0.25 };
  const tome = { kind: 'ELEMENTAL_TOME', might: 11, hit: 85, crit: 5, schoolHit: 0, apCost: 80 };

  const twinVsAssassin = computeDp100Ap(swiftUser, twinV25, assassinC19);
  const twinBuggyVsAssassin = computeDp100Ap(swiftUser, twinBuggy, assassinC19);
  const twinVsHeavy = computeDp100Ap(swiftUser, twinV25, heavyArmorC12);
  const rapierVsHeavy = computeDp100Ap(swiftUser, rapier20, heavyArmorC12);
  const warhammerVsHeavy = computeDp100Ap(heavyUser, warhammer, heavyArmorC12);
  const warhammerVsAssassin = computeDp100Ap(heavyUser, warhammer, assassinC19);
  const tomeVsHeavy = computeDp100Ap(mageUser, tome, heavyArmorC12);

  const reinhart = resolveReinhartFlashSuppress(
    { str: 24, mag: 20 },
    heavyArmorC12,
    { rawAp: 40, poise: 5, preCharge: false, retaliationTokens: 2 }
  );

  const ok =
    twinVsAssassin > 40.0 &&
    twinBuggyVsAssassin < 20.0 &&
    twinVsHeavy < 4.0 &&
    warhammerVsHeavy > rapierVsHeavy * 2.8 &&
    warhammerVsHeavy > twinVsHeavy * 7.5 &&
    twinVsAssassin > warhammerVsAssassin * 2.5 &&
    tomeVsHeavy > 30.0 &&
    reinhart.targetCanCounter === false &&
    reinhart.adaptiveDefUsed === 9;

  return {
    ok,
    dp100Ap: { twinVsAssassin, twinBuggyVsAssassin, twinVsHeavy, rapierVsHeavy, warhammerVsHeavy, warhammerVsAssassin, tomeVsHeavy },
    reinhartFlashSuppress: reinhart
  };
}

// Clamp non-confirmed damage to 1 HP when target holds [STORY_SPARE_FLOOR: 1 HP].
function applyDamageWithSpareFloor(target, rawDamage, source, confirmManualKill = false) {
  let nextHp = Math.max(0, target.currentHp - rawDamage);
  const protectedSource = source === 'ALLY_AI' || source === 'RETALIATION' || source === 'FF_AOE';
  if (target.storySpareFloorOneHp && (protectedSource || !confirmManualKill)) {
    nextHp = Math.max(1, nextHp);
  }
  return nextHp;
}

// Run symmetric 4-Layer Utility AI pipeline with Fairness Caps, >35% UI tag, and filtered Softmax.
function evaluateFourLayerUtilityAi({ candidates, mandate, focusCounts, maxFocusCap, aoeTokensLeft, baseWeights, contextMods, roleTier, prng }) {
  const layer1 = candidates.filter(c => {
    if (mandate === 'HOLD_TILE' && !mandate.override && c.moveTiles > 0) return false;
    return true;
  });

  const layer2 = layer1.map(c => {
    if (c.target?.storySpareFloorOneHp && c.target.currentHp <= 1) {
      return { ...c, tacticalScore: 0 };
    }
    if (c.targetId && (focusCounts[c.targetId] ?? 0) >= maxFocusCap) {
      return { ...c, tacticalScore: 0 };
    }
    if (c.isBigAoe && aoeTokensLeft <= 0) {
      return { ...c, tacticalScore: 0 };
    }
    return { ...c, tacticalScore: c.rawScore };
  });

  const bestPure = layer2.reduce((best, c) => (c.tacticalScore > best.tacticalScore ? c : best), layer2[0]);
  const layer3 = layer2.map(c => {
    const baseW = baseWeights[c.bucket] ?? 1.0;
    const ctxM = contextMods[c.bucket] ?? 1.0;
    const effWeight = clamp(baseW * ctxM, 0.05, 3.0);
    const weightedScore = c.tacticalScore * effWeight;
    const relativeShift = Math.abs(effWeight - baseW) / Math.max(0.05, baseW);
    return { ...c, effWeight, weightedScore, psychTriggered: relativeShift > 0.35 };
  });

  const sorted = [...layer3].filter(c => c.weightedScore > 0).sort((a, b) => b.weightedScore - a.weightedScore);
  if (sorted.length === 0) return { chosen: null, uiInspectTag: null, poolSize: 0 };

  const isBossOrShadow = roleTier === 'BOSS' || roleTier === 'DARK_SHADOW';
  const topK = isBossOrShadow ? 3 : 5;
  const minRatio = isBossOrShadow ? 0.85 : 0.7;
  const tau = isBossOrShadow ? 0.35 : 0.8;
  const s1 = sorted[0].weightedScore;
  const pool = sorted.slice(0, topK).filter(c => c.weightedScore >= s1 * minRatio);

  const maxScaled = pool[0].weightedScore / 25;
  const exps = pool.map(c => Math.exp((c.weightedScore / 25 - maxScaled) / tau));
  const sumExp = exps.reduce((a, b) => a + b, 0);
  let r = prng.nextFloat() * sumExp;
  let chosen = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i++) {
    r -= exps[i];
    if (r <= 0) {
      chosen = pool[i];
      break;
    }
  }

  const uiInspectTag =
    chosen.psychTriggered || chosen.id !== bestPure.id
      ? { tag: chosen.psychTag ?? '[PSYCH_SHIFT]', bark: chosen.bark ?? 'Target locked!' }
      : null;

  return { chosen, uiInspectTag, poolSize: pool.length };
}

// Verify 4-Layer Utility AI sampling, defection weight continuity, and [STORY_SPARE_FLOOR: 1 HP].
function checkUtilityAiAndSpareFloor(prng) {
  const hotPacked = packUnitHotState({
    currentHp: 1000,
    lockedGrayHp: 300,
    poise: 6,
    weaponSlot: 2,
    friction: 1,
    control: 0,
    rawAp: -50,
    currentSp: 30,
    retaliationTokens: 1,
    preCharge: false,
    bastion: false,
    gridX: 11,
    gridY: 7,
    statMods: 0,
    linksCooldowns: 0
  });
  const unpackedNeg = unpackUnitHotState(hotPacked.view);
  const negCounter = evaluateRetaliation(unpackedNeg, 10, false);
  const zeroApState = { ...unpackedNeg, rawAp: 0, biasedAp: 50 };
  const zeroApCounter = evaluateRetaliation(zeroApState, 10, false);

  const recruitTarget = { id: 'unit_ricardo', currentHp: 18, storySpareFloorOneHp: true };
  recruitTarget.currentHp = applyDamageWithSpareFloor(recruitTarget, 45, 'ALLY_AI', false);
  const hpAfterAllyAi = recruitTarget.currentHp;
  recruitTarget.currentHp = applyDamageWithSpareFloor(recruitTarget, 30, 'RETALIATION', false);
  const hpAfterRetaliation = recruitTarget.currentHp;
  recruitTarget.currentHp = applyDamageWithSpareFloor(recruitTarget, 25, 'FF_AOE', false);
  const hpAfterFfAoe = recruitTarget.currentHp;

  const bossVaelorBaseWeights = { DUEL_NEMESIS: 1.25, FLANK_WEAK: 1.0, SPARE_STRIKE: 1.0 };
  const defectedDarkShadowWeights = { ...bossVaelorBaseWeights };
  const weightsPreserved = JSON.stringify(bossVaelorBaseWeights) === JSON.stringify(defectedDarkShadowWeights);

  const aiRun = evaluateFourLayerUtilityAi({
    candidates: [
      { id: 'hit_spare_1hp', bucket: 'SPARE_STRIKE', rawScore: 95, moveTiles: 1, target: recruitTarget, targetId: 'unit_ricardo' },
      { id: 'focus_capped', bucket: 'FLANK_WEAK', rawScore: 92, moveTiles: 2, targetId: 'over_focused' },
      { id: 'aoe_blocked', bucket: 'FLANK_WEAK', rawScore: 90, moveTiles: 0, isBigAoe: true },
      { id: 'flank_grunt', bucket: 'FLANK_WEAK', rawScore: 80, moveTiles: 2, targetId: 'grunt_1' },
      { id: 'duel_nemesis', bucket: 'DUEL_NEMESIS', rawScore: 72, moveTiles: 2, targetId: 'boss_nemesis', psychTag: '[ARROGANT_CHALLENGE]', bark: 'Stand and face my blade!' }
    ],
    mandate: 'FREE_ENGAGE',
    focusCounts: { over_focused: 2 },
    maxFocusCap: 2,
    aoeTokensLeft: 0,
    baseWeights: defectedDarkShadowWeights,
    contextMods: { DUEL_NEMESIS: 1.6, FLANK_WEAK: 1.0 },
    roleTier: 'DARK_SHADOW',
    prng
  });

  const hpAfterConfirmedManual = applyDamageWithSpareFloor({ ...recruitTarget }, 20, 'PLAYER_MANUAL', true);

  const ok =
    hotPacked.buf.byteLength === 14 &&
    unpackedNeg.currentHp === 1000 &&
    unpackedNeg.biasedAp === 0 &&
    negCounter.canCounter === false &&
    zeroApCounter.canCounter === true &&
    zeroApCounter.counterMight === 8 &&
    zeroApCounter.friendlyFire === false &&
    hpAfterAllyAi === 1 &&
    hpAfterRetaliation === 1 &&
    hpAfterFfAoe === 1 &&
    hpAfterConfirmedManual === 0 &&
    weightsPreserved &&
    aiRun.chosen?.id === 'duel_nemesis' &&
    aiRun.poolSize === 1 &&
    aiRun.uiInspectTag?.tag === '[ARROGANT_CHALLENGE]';

  return {
    ok,
    hotStateBytes: hotPacked.buf.byteLength,
    abaddonPhase2CapHp: unpackedNeg.currentHp,
    negApCanCounter: negCounter.canCounter,
    zeroApCanCounter: zeroApCounter.canCounter,
    spareFloorClamps: { hpAfterAllyAi, hpAfterRetaliation, hpAfterFfAoe, hpAfterConfirmedManual },
    darkShadowWeightsPreserved: weightsPreserved,
    aiDecision: { chosenId: aiRun.chosen?.id, poolSize: aiRun.poolSize, uiInspectTag: aiRun.uiInspectTag }
  };
}

const { values } = parseArgs({
  options: {
    seed: { type: 'string', default: '10012026' },
    trials: { type: 'string', default: '50000' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false }
  },
  allowPositionals: true
});

if (values.help) {
  process.stdout.write('Usage: node scripts/sim-combat-check.mjs [--seed 10012026] [--trials 50000] [--json]\n');
  process.exit(0);
}

const seed = Number.parseInt(values.seed, 10) || 10012026;
const trials = Math.max(5000, Number.parseInt(values.trials, 10) || 50000);
const prng = createPrng(seed);

const rngReport = checkRngDistributions(prng, trials);
const effConReport = checkEffConTurnaround();
const counterCycleReport = checkCombatCounterCycle();
const aiAndSpareReport = checkUtilityAiAndSpareFloor(prng);
const allOk = rngReport.ok && effConReport.ok && counterCycleReport.ok && aiAndSpareReport.ok;

const summary = {
  tool: 'sim-combat-check',
  version: '0.1.0',
  seed,
  ok: allOk,
  checks: {
    rng_2rn_hit_1rn_crit: rngReport,
    effcon_ap_timeline: effConReport,
    dp100ap_counter_cycle: counterCycleReport,
    utility_ai_and_spare_floor: aiAndSpareReport
  }
};

if (values.json) {
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} else {
  process.stdout.write(`[sim-combat-check v0.1.0] seed=${seed} ok=${allOk}\n`);
  for (const [k, v] of Object.entries(summary.checks)) {
    process.stdout.write(`  - ${k}: ${v.ok ? 'PASS' : 'FAIL'}\n`);
  }
}

process.exit(allOk ? 0 : 1);

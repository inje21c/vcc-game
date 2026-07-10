#!/usr/bin/env node
// BFS solver for Tangerine Isle stages — 02-level-format.md §3 준수
// Usage: node tools/solver/solve.js <stageId>
//
// Stage 1: 0-1 BFS (switch=cost 0, move=cost 1) — HP 제외 상태 그래프
//   → MinSteps, 해 경로 확보
// Stage 2: 해 경로를 실제 HP로 시뮬레이션 → HP 수지 검증 + α 계산

const fs   = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT       = path.resolve(__dirname, '..', '..');
const STAGE_PATH = path.join(ROOT, 'src', 'data', 'stages.json');

// ─── 상태 직렬화 (HP 제외) ───────────────────────────────────────────────────
// _roomStates는 현재 룸 엔트리가 stale이므로 현재 룸은 flat 필드에서 읽는다.

function serializeRS(rs) {
  return [
    [...rs.tangerines].sort().join(','),
    [...rs.rocks].sort().join(','),
    [...rs.bombs].map(([k, v]) => `${k}:${v}`).sort().join(','),
    [...rs.removedTiles].sort().join(','),
    [...rs.filledPits].sort().join(','),
    [...rs.openDoors].sort().join(','),
    [...rs.tunnelHoles].sort().join(','),
  ].join('|');
}

function stateKey(state) {
  const crk = `${state.roomCoord[0]},${state.roomCoord[1]}`;

  // 현재 룸: flat 필드 사용 (archive는 stale)
  const currentRS = serializeRS({
    tangerines:   state.tangerines,
    rocks:        state.rocks,
    bombs:        state.bombs,
    removedTiles: state.removedTiles,
    filledPits:   state.filledPits,
    openDoors:    state.openDoors,
    tunnelHoles:  state.tunnelHoles,
  });

  // 나머지 룸: archive에서 읽기
  const otherRooms = [];
  for (const [rk, rs] of state._roomStates) {
    if (rk === crk) continue;
    otherRooms.push(`${rk}=${serializeRS(rs)}`);
  }
  otherRooms.sort();

  return [
    crk,
    state.pos.join(','),
    state.char,
    state.hasKey ? '1' : '0',
    state.chestOpen ? '1' : '0',
    currentRS,
    otherRooms.join(';'),
  ].join('§');
}

// ─── 0-1 BFS ─────────────────────────────────────────────────────────────────

const MOVES = [
  { type: 'move',   dir:  'up'     },
  { type: 'move',   dir:  'down'   },
  { type: 'move',   dir:  'left'   },
  { type: 'move',   dir:  'right'  },
];
const SWITCHES = [
  { type: 'switch', char: 'cat'    },
  { type: 'switch', char: 'rabbit' },
  { type: 'switch', char: 'turtle' },
];

function actionLabel(a) {
  return a.type === 'move' ? a.dir : `[${a.char}]`;
}

function solve(stage, data, buildState, nextState) {
  const init = buildState(stage, data);

  // 0-1 deque: [{ state, steps, path }]
  // switches → front (cost 0), moves → back (cost 1)
  const deque   = [{ state: init, steps: 0, path: [] }];
  const visited = new Map(); // key → minSteps
  visited.set(stateKey(init), 0);

  const MAX_ITER = 20_000_000;
  let iter = 0;

  while (deque.length > 0) {
    if (++iter > MAX_ITER) {
      return { solvable: false, reason: 'max_iterations' };
    }

    const { state, steps, path } = deque.shift();

    // ── 캐릭터 전환 (cost 0) ──
    for (const sw of SWITCHES) {
      if (sw.char === state.char) continue; // 같은 캐릭터 스킵
      const result = nextState(state, sw);
      if (!result) continue;

      const next = result.state;
      if (next.status === 'gameover') continue;

      const k = stateKey(next);
      if (visited.has(k) && visited.get(k) <= steps) continue;
      visited.set(k, steps);

      const newPath = [...path, actionLabel(sw)];
      if (next.status === 'clear') return { solvable: true, minSteps: steps, path: newPath };
      deque.unshift({ state: next, steps, path: newPath }); // front (cost 0)
    }

    // ── 이동 (cost 1) ──
    for (const mv of MOVES) {
      const result = nextState(state, mv);
      if (!result) continue;

      const next = result.state;
      if (next.status === 'gameover') continue;

      const k = stateKey(next);
      if (visited.has(k) && visited.get(k) <= steps + 1) continue;
      visited.set(k, steps + 1);

      const newPath = [...path, actionLabel(mv)];
      if (next.status === 'clear') return { solvable: true, minSteps: steps + 1, path: newPath };
      deque.push({ state: next, steps: steps + 1, path: newPath }); // back (cost 1)
    }
  }

  return { solvable: false, reason: 'exhausted' };
}

// ─── 2단계: HP 수지 검증 ──────────────────────────────────────────────────────
// 해 경로를 buildState에서 시작해 실제 HP로 재시뮬레이션.
// nextState는 HP 0 이하 → gameover를 반환하지만 여기서 HP 소진 여부만 추출한다.

function verifyHp(stage, data, buildState, nextState, path) {
  const G        = data.tuning?.G || 10;
  const ACTIONS  = [
    ...MOVES.map(m => ({ ...m, label: m.dir })),
    ...SWITCHES.map(s => ({ ...s, label: `[${s.char}]` })),
  ];
  const labelMap = Object.fromEntries(ACTIONS.map(a => [actionLabel(a), a]));

  let state = buildState(stage, data);

  for (let i = 0; i < path.length; i++) {
    const action = labelMap[path[i]];
    const result = nextState(state, action);
    if (!result) return { ok: false, failStep: i, reason: 'blocked' };

    state = result.state;
    if (state.status === 'gameover') return { ok: false, failStep: i, reason: 'hp_zero' };
    if (state.status === 'clear')    return { ok: true,  finalHp: state.hp };
  }

  return { ok: false, reason: 'no_clear' };
}

function expandSolutionPath(stage) {
  if (!Array.isArray(stage.solutionPath) || stage.solutionPath.length === 0) return null;

  const labels = [];
  for (const item of stage.solutionPath) {
    if (typeof item === 'string') {
      labels.push(item);
      continue;
    }

    if (item.move) {
      const count = item.count ?? 1;
      for (let i = 0; i < count; i++) labels.push(item.move);
      continue;
    }

    if (item.switch) {
      labels.push(`[${item.switch}]`);
      continue;
    }

    throw new Error(`Invalid solutionPath item: ${JSON.stringify(item)}`);
  }
  return labels;
}

// ─── 귤 총량 ──────────────────────────────────────────────────────────────────

function countTangerines(stage) {
  return stage.rooms.reduce((n, r) => n + r.objects.filter(o => o.type === 'tangerine').length, 0);
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const stageId = process.argv[2];
  if (!stageId) {
    console.error('Usage: node tools/solver/solve.js <stageId>');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const stage = data.stages.find(s => s.id === stageId);
  if (!stage) {
    console.error(`Stage "${stageId}" not found in stages.json`);
    process.exit(1);
  }

  const statePath = pathToFileURL(path.join(ROOT, 'src', 'core', 'state.js'));
  const rulesPath = pathToFileURL(path.join(ROOT, 'src', 'core', 'rules.js'));
  const { buildState } = await import(statePath);
  const { nextState  } = await import(rulesPath);

  const G          = data.tuning?.G || 10;
  const totalTang  = countTangerines(stage);
  const totalG     = totalTang * G;
  const maxHp      = stage.startHp + totalG;

  const directedPath = expandSolutionPath(stage);
  process.stdout.write(`${directedPath ? 'Checking solutionPath' : 'Solving'} ${stageId}... `);
  const t0 = Date.now();
  const result = directedPath
    ? { solvable: true, minSteps: directedPath.filter(label => !label.startsWith('[')).length, path: directedPath, directed: true }
    : solve(stage, data, buildState, nextState);
  const elapsed = Date.now() - t0;

  if (!result.solvable) {
    console.log('\n✘ UNSOLVABLE');
    if (result.reason === 'max_iterations') console.log('  (탐색 한계 도달 — 스테이지가 너무 복잡하거나 풀 수 없음)');
    process.exit(1);
  }

  const { minSteps, path: solPath } = result;
  const alpha = maxHp / minSteps;
  const targetAlpha = stage.targetAlpha ?? null;

  // HP 수지 검증
  const hpCheck = verifyHp(stage, data, buildState, nextState, solPath);

  console.log(`(${elapsed}ms)\n`);
  console.log(`✔ SOLVABLE   stageId=${stageId}${result.directed ? '   mode=directed' : ''}`);
  console.log(`  MinSteps : ${minSteps}`);
  console.log(`  startHp  : ${stage.startHp}  totalG : ${totalG} (귤 ${totalTang}개 × G${G})`);
  console.log(`  α        : ${alpha.toFixed(2)}${targetAlpha != null ? `   target: ${targetAlpha}   ${Math.abs(alpha - targetAlpha) <= 0.2 ? '✔' : '⚠ 목표와 차이 0.2 초과'}` : ''}`);

  if (hpCheck.ok) {
    console.log(`  HP check : ✔ 최단 경로에서 HP > 0 유지 (잔여 HP ${hpCheck.finalHp})`);
  } else {
    console.log(`  HP check : ⚠ 최단 경로 HP 부족 (step ${hpCheck.failStep}: ${hpCheck.reason})`);
    console.log(`           → 귤을 먼저 수집하는 우회 경로 필요. S₀ 증가 또는 귤 추가 권장`);
  }

  console.log(`  Solution : ${solPath.join(' ')}`);
}

main().catch(err => { console.error(err); process.exit(1); });

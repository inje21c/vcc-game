#!/usr/bin/env node
// 레이아웃 패스 자동화 — 10-stage-design.md 레이아웃 원칙 (2026-07-16)
// solutionPath가 지나는 타일·오브젝트·입구·연결성을 보존하면서
// 빈 영역에 각진 나무 클러스터(계단형/L자/쐐기)를 배치한다.
//
// Usage: node tools/design/retile.js <stageId|all> [--dry]

const fs   = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT       = path.resolve(__dirname, '..', '..');
const STAGE_PATH = path.join(ROOT, 'src', 'data', 'stages.json');
const GRID = 15;

// 1-1 첫 방은 튜토리얼 가독성 예외 (10 문서)
const EXEMPT = new Set(['1-1|0,0']);
// 신규 스테이지는 이미 각진 설계
const EXEMPT_STAGES = new Set(['3-5', '4-5']);

// 각진 패턴 — 계단형, L자, 쐐기, 대각 쌍
const PATTERNS = [
  [[0,0],[1,1],[2,2]],
  [[0,2],[1,1],[2,0]],
  [[0,0],[0,1],[1,1]],
  [[1,0],[1,1],[0,1]],
  [[0,0],[1,0],[1,1]],
  [[0,0],[1,1]],
  [[1,0],[0,1]],
];

function lcg(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function hashStr(str) {
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function expandSolutionPath(stage) {
  if (!Array.isArray(stage.solutionPath) || stage.solutionPath.length === 0) return null;
  const labels = [];
  for (const item of stage.solutionPath) {
    if (typeof item === 'string') { labels.push(item); continue; }
    if (item.move)   { for (let i = 0; i < (item.count ?? 1); i++) labels.push(item.move); continue; }
    if (item.switch) { labels.push(`[${item.switch}]`); continue; }
  }
  return labels;
}

function labelToAction(label) {
  if (label.startsWith('[')) return { type: 'switch', char: label.slice(1, -1) };
  return { type: 'move', dir: label };
}

async function collectProtected(stage, data, buildState, nextState) {
  // 룸키 → Set<"x,y"> : 플레이어 경유 + 돌 전 궤적
  const prot = new Map();
  const add = (rk, x, y) => {
    if (!prot.has(rk)) prot.set(rk, new Set());
    prot.get(rk).add(`${x},${y}`);
  };
  const snapshot = (s) => {
    const crk = `${s.roomCoord[0]},${s.roomCoord[1]}`;
    add(crk, s.pos[0], s.pos[1]);
    for (const r of s.rocks) { const [x, y] = r.split(',').map(Number); add(crk, x, y); }
    for (const [k2, rs] of s._roomStates) {
      if (k2 === crk) continue;
      for (const r of rs.rocks) { const [x, y] = r.split(',').map(Number); add(k2, x, y); }
    }
  };

  let state = buildState(stage, data);
  snapshot(state);
  const labels = expandSolutionPath(stage);
  if (!labels) throw new Error(`${stage.id}: solutionPath 없음`);
  for (const label of labels) {
    const result = nextState(state, labelToAction(label));
    if (!result) throw new Error(`${stage.id}: 경로 재생 실패 (${label})`);
    state = result.state;
    snapshot(state);
    if (state.status !== 'playing') break;
  }
  return prot;
}

function roomProtectedTiles(stage, room, prot) {
  const rk = `${room.coord[0]},${room.coord[1]}`;
  const set = new Set(prot.get(rk) || []);
  // 오브젝트 + 4방 이웃 (귤 접근성 보존)
  for (const obj of room.objects) {
    const [x, y] = obj.pos;
    set.add(`${x},${y}`);
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) set.add(`${x+dx},${y+dy}`);
  }
  return set;
}

function connectivityOk(terrain, prot, roomObjects) {
  // '.'/'~' 타일 전체가 하나의 연결 성분인지 (죽은 주머니 방지)
  const walkable = (x, y) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
    const t = terrain[y][x];
    return t === '.' || t === '~' || t === 'P' || t === 'd' || t === 'D';
  };
  let start = null;
  let total = 0;
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    if (walkable(x, y)) { total++; if (!start) start = [x, y]; }
  }
  if (!start) return true;
  const seen = new Set([start.join(',')]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x + dx, ny = y + dy;
      if (!walkable(nx, ny) || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  return seen.size === total;
}

function retileRoom(stage, room, prot, rand) {
  const terrain = room.terrain.map(r => r.split(''));
  const protSet = roomProtectedTiles(stage, room, prot);

  const free = (x, y) =>
    x >= 2 && y >= 2 && x <= GRID - 3 && y <= GRID - 3 &&
    terrain[y][x] === '.' && !protSet.has(`${x},${y}`);

  const placed = [];
  const farFromPlaced = (tiles) =>
    placed.every(p => tiles.every(([x, y]) =>
      Math.max(Math.abs(x - p[0]), Math.abs(y - p[1])) >= 2));

  // 후보 위치를 섞어 순회
  const coords = [];
  for (let y = 2; y < GRID - 2; y++) for (let x = 2; x < GRID - 2; x++) coords.push([x, y]);
  coords.sort(() => rand() - 0.5);

  let clusters = 0;
  const target = 3;
  for (const [cx, cy] of coords) {
    if (clusters >= target) break;
    const patterns = [...PATTERNS].sort(() => rand() - 0.5);
    for (const pattern of patterns) {
      const tiles = pattern.map(([dx, dy]) => [cx + dx, cy + dy]);
      if (!tiles.every(([x, y]) => free(x, y))) continue;
      if (!farFromPlaced(tiles)) continue;

      // 시험 배치 → 연결성 검사
      for (const [x, y] of tiles) terrain[y][x] = 'T';
      const rows = terrain.map(r => r.join(''));
      if (!connectivityOk(rows, protSet, room.objects)) {
        for (const [x, y] of tiles) terrain[y][x] = '.';
        continue;
      }
      for (const t of tiles) placed.push(t);
      clusters++;
      break;
    }
  }

  return { rows: terrain.map(r => r.join('')), clusters };
}

// ─── 텍스트 보존 파일 갱신 ────────────────────────────────────────────────────

function replaceTerrainInText(text, stageId, coord, newRows) {
  const stageAnchor = `"id": "${stageId}"`;
  const sIdx = text.indexOf(stageAnchor);
  if (sIdx < 0) throw new Error(`stage ${stageId} not found in text`);
  const nextStage = text.indexOf('"id": "', sIdx + stageAnchor.length);
  const sEnd = nextStage < 0 ? text.length : nextStage;

  const roomAnchor = `"coord": [${coord[0]}, ${coord[1]}]`;
  const rIdx = text.indexOf(roomAnchor, sIdx);
  if (rIdx < 0 || rIdx > sEnd) throw new Error(`${stageId} room ${coord} not found`);

  const tIdx = text.indexOf('"terrain": [', rIdx);
  const tEnd = text.indexOf(']', tIdx);
  if (tIdx < 0 || tIdx > sEnd) throw new Error(`${stageId} room ${coord} terrain not found`);

  const block = `"terrain": [\n${newRows.map(r => `            "${r}"`).join(',\n')}\n          ]`;
  return text.slice(0, tIdx) + block + text.slice(tEnd + 1);
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const target = args.find(a => !a.startsWith('--'));
  if (!target) { console.error('Usage: node tools/design/retile.js <stageId|all> [--dry]'); process.exit(1); }

  const data = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const { buildState } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'state.js')));
  const { nextState  } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'rules.js')));

  let text = fs.readFileSync(STAGE_PATH, 'utf8');
  const ids = target === 'all' ? data.stages.map(s => s.id) : [target];

  for (const id of ids) {
    if (EXEMPT_STAGES.has(id)) { console.log(`  [${id}] 예외 (신규 각진 설계)`); continue; }
    const stage = data.stages.find(s => s.id === id);
    if (!stage) { console.error(`stage ${id} not found`); process.exit(1); }

    const prot = await collectProtected(stage, data, buildState, nextState);
    for (const room of stage.rooms) {
      const roomKey = `${id}|${room.coord[0]},${room.coord[1]}`;
      if (EXEMPT.has(roomKey)) { console.log(`  [${id}] 룸 [${room.coord}] 예외 (튜토리얼 첫 방)`); continue; }
      const rand = lcg(hashStr(roomKey));
      const { rows, clusters } = retileRoom(stage, room, prot, rand);
      if (clusters === 0) { console.log(`  [${id}] 룸 [${room.coord}] 배치 불가 (여유 공간 없음)`); continue; }
      console.log(`  [${id}] 룸 [${room.coord}] 클러스터 ${clusters}개`);
      if (!dry) text = replaceTerrainInText(text, id, room.coord, rows);
    }
  }

  if (!dry) {
    JSON.parse(text); // 유효성
    fs.writeFileSync(STAGE_PATH, text);
    console.log('저장 완료 — JSON 유효');
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });

#!/usr/bin/env node
// 전 스테이지 정적 검증 — 02-level-format.md §3.4 V1~V10
// Usage: node tools/solver/validate-all.js

const fs   = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT       = path.resolve(__dirname, '..', '..');
const STAGE_PATH = path.join(ROOT, 'src', 'data', 'stages.json');

// ─── 정적 검증 (솔버 불필요) ──────────────────────────────────────────────────

const EDGE_COLS = new Set([0, 14]);
const EDGE_ROWS = new Set([0, 14]);

function edgesOf(room, roomGrid, coord) {
  // 이 룸의 어느 가장자리가 인접 룸과 연결될 수 있는지 반환
  const [rx, ry] = coord;
  const [gcols, grows] = roomGrid;
  return {
    left:   rx > 0,
    right:  rx < gcols - 1,
    up:     ry > 0,
    down:   ry < grows - 1,
  };
}

function validateStatic(stage) {
  const errors   = [];
  const warnings = [];
  const GRID     = 15;

  const rooms    = new Map(stage.rooms.map(r => [`${r.coord[0]},${r.coord[1]}`, r]));
  const roomGrid = stage.roomGrid || [1, 1];

  // V1: key=1, chest=1 per stage
  const allObjs = stage.rooms.flatMap(r => r.objects);
  const keyCount   = allObjs.filter(o => o.type === 'key').length;
  const chestCount = allObjs.filter(o => o.type === 'chest').length;
  if (keyCount !== 1)   errors.push(`V1: 열쇠가 ${keyCount}개 (1개 필요)`);
  if (chestCount !== 1) errors.push(`V1: 상자가 ${chestCount}개 (1개 필요)`);

  // V2: buttonGroups 무결성 — 버튼/문 룸+위치가 실제 존재해야 함
  const bg = stage.buttonGroups || {};
  for (const [gid, group] of Object.entries(bg)) {
    for (const btn of group.buttons || []) {
      const rk   = `${btn.room[0]},${btn.room[1]}`;
      const room  = rooms.get(rk);
      if (!room) { errors.push(`V2: buttonGroups "${gid}" 버튼 룸 ${btn.room} 없음`); continue; }
      const hasBtn = room.objects.some(o => o.type === 'button' && o.pos[0] === btn.pos[0] && o.pos[1] === btn.pos[1]);
      if (!hasBtn) errors.push(`V2: buttonGroups "${gid}" 버튼 (${btn.pos}) 룸 ${btn.room} 에 없음`);
    }
    for (const door of group.doors || []) {
      const rk   = `${door.room[0]},${door.room[1]}`;
      const room  = rooms.get(rk);
      if (!room) { errors.push(`V2: buttonGroups "${gid}" 문 룸 ${door.room} 없음`); continue; }
      const tile = room.terrain[door.pos[1]]?.[door.pos[0]];
      if (tile !== 'D' && tile !== 'd') errors.push(`V2: buttonGroups "${gid}" 문 (${door.pos}) 룸 ${door.room} 타일="${tile}" (D/d 아님)`);
    }
  }

  // V3/V4: 룸 가장자리 폐쇄성 + 연결부 양측 정합
  for (const room of stage.rooms) {
    const [rx, ry] = room.coord;
    const connected = edgesOf(room, roomGrid, room.coord);
    const terrain   = room.terrain;

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const onLeft   = x === 0;
        const onRight  = x === GRID - 1;
        const onTop    = y === 0;
        const onBottom = y === GRID - 1;
        const isEdge   = onLeft || onRight || onTop || onBottom;

        if (!isEdge) continue;

        const tile    = terrain[y][x];
        const walkable = tile === '.' || tile === '~';

        // V3: 연결 가능한 면의 열린 칸만 통로로 허용
        const facesAdjRoom =
          (onLeft   && connected.left)  ||
          (onRight  && connected.right) ||
          (onTop    && connected.up)    ||
          (onBottom && connected.down);

        if (walkable && !facesAdjRoom) {
          errors.push(`V3: 룸 ${room.coord} (${x},${y}) 가장자리 열린 칸인데 인접 룸 없음`);
        }

        // V4: 연결 양측 정합 — 열린 칸이면 상대 룸도 열려 있어야 함
        if (walkable && facesAdjRoom) {
          let adjCoord = null, adjX = x, adjY = y;
          if (onLeft  && connected.left)  { adjCoord = [rx - 1, ry]; adjX = GRID - 1; }
          if (onRight && connected.right) { adjCoord = [rx + 1, ry]; adjX = 0; }
          if (onTop   && connected.up)    { adjCoord = [rx, ry - 1]; adjY = GRID - 1; }
          if (onBottom && connected.down) { adjCoord = [rx, ry + 1]; adjY = 0; }

          if (adjCoord) {
            const adjRoom = rooms.get(`${adjCoord[0]},${adjCoord[1]}`);
            if (!adjRoom) {
              errors.push(`V4: 룸 ${room.coord} (${x},${y}) → 인접 룸 ${adjCoord} 없음`);
            } else {
              const adjTile = adjRoom.terrain[adjY][adjX];
              if (adjTile !== '.' && adjTile !== '~') {
                errors.push(`V4: 룸 ${room.coord} (${x},${y}) 열린 통로이지만 룸 ${adjCoord} (${adjX},${adjY})는 "${adjTile}" (막힘)`);
              }
            }
          }
        }

        // V8: 초기 입구에 돌 금지
        if (walkable && facesAdjRoom) {
          const rock = room.objects.find(o => o.type === 'rock' && o.pos[0] === x && o.pos[1] === y);
          if (rock) errors.push(`V8: 룸 ${room.coord} (${x},${y}) 입구에 돌 초기 배치 금지`);

          const bomb = room.objects.find(o => o.type === 'bomb' && o.pos[0] === x && o.pos[1] === y);
          if (bomb) warnings.push(`V8: 룸 ${room.coord} (${x},${y}) 입구에 폭탄 — 진입 즉시 기폭 (초반 금지 권장)`);
        }
      }
    }
  }

  return { errors, warnings };
}

// ─── 귤 총량 ──────────────────────────────────────────────────────────────────

function countTangerines(stage) {
  return stage.rooms.reduce((n, r) => n + r.objects.filter(o => o.type === 'tangerine').length, 0);
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function main() {
  const data   = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const stages = data.stages;
  const G      = data.tuning?.G || 10;

  const { execFileSync } = require('node:child_process');

  let passed = 0, failed = 0, warned = 0;

  for (const stage of stages) {
    const id     = stage.id;
    const totalG = countTangerines(stage) * G;
    process.stdout.write(`  [${id}] `);

    // 정적 검증
    const { errors, warnings } = validateStatic(stage);

    if (errors.length > 0) {
      console.log(`✘ STATIC FAIL`);
      errors.forEach(e => console.log(`    ✘ ${e}`));
      warnings.forEach(w => console.log(`    ⚠ ${w}`));
      failed++;
      continue;
    }

    // 솔버 실행 (child_process)
    try {
      const out = execFileSync(
        process.execPath,
        [path.join(__dirname, 'solve.js'), id],
        { encoding: 'utf8', timeout: 120_000 }
      );

      // α 파싱
      const alphaMatch = out.match(/α\s*:\s*([\d.]+)/);
      const hpOk       = out.includes('HP check : ✔');
      const alpha       = alphaMatch ? parseFloat(alphaMatch[1]) : null;
      const targetAlpha = stage.targetAlpha ?? null;
      const alphaDiff   = (alpha != null && targetAlpha != null) ? Math.abs(alpha - targetAlpha) : null;

      const statusParts = [];
      if (alpha != null) statusParts.push(`α=${alpha.toFixed(2)}`);
      if (!hpOk) statusParts.push('HP⚠');
      if (warnings.length > 0) statusParts.push(`${warnings.length}warn`);

      if (!hpOk || (alphaDiff != null && alphaDiff > 0.2)) {
        console.log(`⚠ ${statusParts.join('  ')}`);
        if (!hpOk) console.log(`    ⚠ 최단 경로 HP 부족`);
        if (alphaDiff != null && alphaDiff > 0.2) console.log(`    ⚠ α 목표 편차 ${alphaDiff.toFixed(2)} > 0.2`);
        warnings.forEach(w => console.log(`    ⚠ ${w}`));
        warned++;
      } else {
        console.log(`✔ ${statusParts.join('  ')}`);
        if (warnings.length > 0) warnings.forEach(w => console.log(`    ⚠ ${w}`));
        passed++;
      }
    } catch (err) {
      const out = err.stdout || '';
      console.log(`✘ UNSOLVABLE`);
      if (out) console.log(out.trim().split('\n').map(l => '    ' + l).join('\n'));
      failed++;
    }
  }

  console.log(`\n${stages.length}개 스테이지: ✔ ${passed}  ⚠ ${warned}  ✘ ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });

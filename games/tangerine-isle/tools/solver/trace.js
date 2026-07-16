#!/usr/bin/env node
// solutionPath 재생 진단기 — 실패 지점 상태 출력 + 경로 점유 타일 오버레이
// Usage:
//   node tools/solver/trace.js <stageId>          — 재생, 실패 시 해당 시점 룸 덤프
//   node tools/solver/trace.js <stageId> --tiles  — 전 룸 경로 점유 타일 오버레이 출력
//
// 오버레이 기호: @ 최종 위치, * 플레이어 경유, o 돌 경유, 소문자 = 원 지형

const fs   = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT       = path.resolve(__dirname, '..', '..');
const STAGE_PATH = path.join(ROOT, 'src', 'data', 'stages.json');
const GRID = 15;

function expandSolutionPath(stage) {
  if (!Array.isArray(stage.solutionPath) || stage.solutionPath.length === 0) return null;
  const labels = [];
  for (const item of stage.solutionPath) {
    if (typeof item === 'string') { labels.push(item); continue; }
    if (item.move)   { for (let i = 0; i < (item.count ?? 1); i++) labels.push(item.move); continue; }
    if (item.switch) { labels.push(`[${item.switch}]`); continue; }
    throw new Error(`Invalid solutionPath item: ${JSON.stringify(item)}`);
  }
  return labels;
}

function labelToAction(label) {
  if (label.startsWith('[')) return { type: 'switch', char: label.slice(1, -1) };
  return { type: 'move', dir: label };
}

function rk(coord) { return `${coord[0]},${coord[1]}`; }

function dumpRoom(stage, state, roomCoord, marks) {
  const room = stage.rooms.find(r => rk(r.coord) === rk(roomCoord));
  if (!room) return;
  const crk = rk(state.roomCoord);
  const isCurrent = crk === rk(roomCoord);
  const rs = isCurrent ? state : state._roomStates.get(rk(roomCoord));

  console.log(`  룸 [${roomCoord}]${isCurrent ? ' (현재)' : ''}:`);
  for (let y = 0; y < GRID; y++) {
    let line = '    ';
    for (let x = 0; x < GRID; x++) {
      const k = `${x},${y}`;
      let ch = room.terrain[y][x];
      if (rs.removedTiles.has(k)) ch = ',';
      if (rs.filledPits.has(k))   ch = '=';
      if (rs.openDoors.has(k))    ch = '/';
      if (marks) {
        const mk = `${rk(roomCoord)}|${k}`;
        if (marks.rocks.has(mk))  ch = 'o';
        if (marks.player.has(mk)) ch = '*';
      }
      if (rs.rocks.has(k)) ch = 'R';
      if (isCurrent && state.pos[0] === x && state.pos[1] === y) ch = '@';
      line += ch;
    }
    console.log(line);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const showTiles = args.includes('--tiles');
  const stageId = args.find(a => !a.startsWith('--'));
  if (!stageId) { console.error('Usage: node tools/solver/trace.js <stageId> [--tiles]'); process.exit(1); }

  const data  = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const stage = data.stages.find(s => s.id === stageId);
  if (!stage) { console.error(`Stage "${stageId}" not found`); process.exit(1); }

  const { buildState } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'state.js')));
  const { nextState  } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'rules.js')));

  const labels = expandSolutionPath(stage);
  if (!labels) { console.error('solutionPath 없음'); process.exit(1); }

  let state = buildState(stage, data);
  const marks = { player: new Set(), rocks: new Set() };
  const markPlayer = (s) => marks.player.add(`${rk(s.roomCoord)}|${s.pos[0]},${s.pos[1]}`);
  const markRocks  = (s) => {
    const crk = rk(s.roomCoord);
    for (const r of s.rocks) marks.rocks.add(`${crk}|${r}`);
    for (const [k2, rs] of s._roomStates) {
      if (k2 === crk) continue;
      for (const r of rs.rocks) marks.rocks.add(`${k2}|${r}`);
    }
  };
  markPlayer(state); markRocks(state);

  for (let i = 0; i < labels.length; i++) {
    const result = nextState(state, labelToAction(labels[i]));
    if (!result) {
      console.log(`✘ BLOCKED at step ${i} (${labels[i]})`);
      console.log(`  char=${state.char} room=[${state.roomCoord}] pos=(${state.pos}) hp=${state.hp} key=${state.hasKey}`);
      dumpRoom(stage, state, state.roomCoord, marks);
      process.exit(1);
    }
    for (const ev of result.events) {
      if (ev.type === 'pickup') console.log(`  step ${i}: pickup ${ev.item} room=[${state.roomCoord}] pos=(${ev.pos})`);
      if (ev.type === 'tangerine_burn') console.log(`  step ${i}: BURN tangerine room=[${state.roomCoord}] pos=(${ev.pos})`);
      if (ev.type === 'valve_close') console.log(`  step ${i}: valve_close group=${ev.group}`);
    }
    state = result.state;
    markPlayer(state); markRocks(state);
    if (state.status === 'gameover') {
      console.log(`✘ GAMEOVER at step ${i} (${labels[i]}) room=[${state.roomCoord}] pos=(${state.pos})`);
      process.exit(1);
    }
    if (state.status === 'clear') {
      console.log(`✔ CLEAR at step ${i + 1}/${labels.length}  잔여 HP ${state.hp}`);
      if (showTiles) for (const room of stage.rooms) dumpRoom(stage, state, room.coord, marks);
      process.exit(0);
    }
  }
  console.log(`✘ 경로 소진 — 클리어 못 함. 최종: room=[${state.roomCoord}] pos=(${state.pos}) hp=${state.hp}`);
  dumpRoom(stage, state, state.roomCoord, marks);
  process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });

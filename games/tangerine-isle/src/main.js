import { buildState } from './core/state.js';
import { nextState }  from './core/rules.js';
import { Renderer }   from './render/renderer.js';
import { InputHandler } from './input/input.js';

let stageData, stage, state, renderer, input;
let lastTime = 0;

async function loadStages() {
  const res = await fetch('./src/data/stages.json');
  return res.json();
}

function initStage(data, stageId) {
  stageData = data;
  stage = data.stages.find(s => s.id === stageId) || data.stages[0];
  state = buildState(stage, data);
}

function serializeState() {
  return {
    char: state.char,
    pos: [...state.pos],
    dir: state.dir,
    walkFrame: state.walkFrame,
    terrainLock: state.terrainLock || null,
    hp: state.hp,
    hasKey: state.hasKey,
    tangerines: [...state.tangerines],
    rocks: [...state.rocks],
    bombs: [...state.bombs],
    removedTiles: [...state.removedTiles],
    filledPits: [...state.filledPits],
    openDoors: [...state.openDoors],
    tunnelHoles: [...(state.tunnelHoles || [])],
    chestOpen: state.chestOpen,
    status: state.status,
  };
}

function installDebugHook() {
  window.__tangerineIsle = {
    getState: serializeState,
    dispatch,
  };
}

function currentSwitchLock() {
  if (state.terrainLock) return state.terrainLock;

  const [x, y] = state.pos;
  const k = `${x},${y}`;
  if (state.char === 'rabbit' && state.tunnelHoles?.has(k)) return 'rabbit';
  if (state._room.terrain[y]?.[x] === '~') return 'turtle';
  return null;
}

function dispatch(action) {
  if (action.type === 'restart') {
    state = buildState(stage, stageData);
    input.highlightChar(state.char);
    input.stopMovement();
    renderer.clearFX();
    return;
  }

  const result = nextState(state, action);
  if (!result) {
    if (action.type === 'switch') {
      const lockedChar = currentSwitchLock();
      if (lockedChar && action.char !== lockedChar) {
        input.showSwitchBlocked(action.char, lockedChar);
      }
    }
    return;
  }

  state = result.state;

  // Handle events
  for (const ev of result.events) {
    if (ev.type === 'explosion') {
      renderer.addExplosionFX(ev.blasted || []);
      if (ev.origin) renderer.addExplosionFX([ev.origin]);
    }
    if (ev.type === 'tunnel') {
      renderer.addActionFX('dig', [ev.from, ev.pos].filter(Boolean));
    }
    if (ev.type === 'swim') {
      renderer.addActionFX('splash', [ev.pos]);
    }
    if (ev.type === 'switch') {
      input.highlightChar(ev.char);
    }
    if (ev.type === 'clear' || ev.type === 'gameover') {
      input.stopMovement();
    }
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  renderer.tick(dt);
  renderer.render(state);

  requestAnimationFrame(loop);
}

async function main() {
  const data = await loadStages();

  const canvas = document.getElementById('game');
  renderer = new Renderer(canvas);

  const wrap = document.getElementById('wrap');
  const size = Math.min(window.innerWidth, window.innerHeight);

  initStage(data, '1-1');
  installDebugHook();
  renderer.resize();

  input = new InputHandler(dispatch);
  input.buildDpad(wrap, size);

  // Click/tap on overlay restart button
  canvas.addEventListener('click', e => {
    if (state.status === 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const btn = renderer.getRestartBtnRect();
    if (btn && cx >= btn.bx && cx <= btn.bx + btn.bw && cy >= btn.by && cy <= btn.by + btn.bh) {
      dispatch({ type: 'restart' });
    }
  });

  window.addEventListener('resize', () => {
    renderer.resize();
    const s2 = Math.min(window.innerWidth, window.innerHeight);
    wrap.style.width = s2 + 'px';
    wrap.style.height = s2 + 'px';
    input.resize(s2);
  });

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

main();

import { buildState } from './core/state.js';
import { nextState }  from './core/rules.js';
import { Renderer }   from './render/renderer.js';
import { InputHandler } from './input/input.js';
import { showIntro } from './ui/intro.js';

let stageData, stage, state, renderer, input;
let lastTime = 0;
let minimapEl;

let inputBlocked = false;
const visitedRooms = new Set();
let stageHints = [];

function portraitSrc(char) {
  return `./assets/ui/ui_portrait_${char}.png`;
}

async function loadStages() {
  const res = await fetch('./src/data/stages.json');
  return res.json();
}

function initStage(data, stageId) {
  stageData = data;
  stage = data.stages.find(s => s.id === stageId) || data.stages[0];
  state = buildState(stage, data);
  stageHints = stage.hints || [];
  visitedRooms.clear();
}

function serializeState() {
  return {
    char: state.char,
    roomCoord: [...state.roomCoord],
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

const _statusEls = {};
function _getStatusEls() {
  if (!_statusEls.ready) {
    _statusEls.hpVal      = document.getElementById('hp-value');
    _statusEls.keyRow     = document.getElementById('key-display');
    _statusEls.warn       = document.getElementById('hp-warning');
    _statusEls.stageId    = document.getElementById('stage-id');
    _statusEls.stageTitle = document.getElementById('stage-title');
    _statusEls.ready  = true;
  }
  return _statusEls;
}

function updateStatusPanel(s) {
  const { hpVal, keyRow, warn, stageId, stageTitle } = _getStatusEls();
  if (!hpVal) return;

  hpVal.textContent = s.hp;
  hpVal.className = s.hp < 30 ? 'warn' : s.hp < 60 ? 'caution' : '';

  keyRow.style.display  = s.hasKey ? 'flex' : 'none';
  warn.style.display    = s.hp < 40 ? 'block' : 'none';

  if (stageId) stageId.textContent = `STAGE ${stage.id}`;
  if (stageTitle) stageTitle.textContent = stage.title || '';
}

function _getHintForRoom(coord) {
  const k = `${coord[0]},${coord[1]}`;
  if (visitedRooms.has(k)) return null;
  visitedRooms.add(k);
  return stageHints.find(h => h.room[0] === coord[0] && h.room[1] === coord[1]) || null;
}

function showHint(hint) {
  inputBlocked = true;
  if (input) input.stopMovement();

  const overlay  = document.getElementById('hint-overlay');
  const portrait = document.getElementById('hint-portrait');
  const nameEl   = document.getElementById('hint-name');
  const textEl   = document.getElementById('hint-text');

  portrait.src       = portraitSrc(hint.char);
  nameEl.textContent = hint.name;
  textEl.textContent = hint.text;
  overlay.classList.remove('hidden');

  function dismiss(e) {
    e.preventDefault();
    overlay.removeEventListener('pointerdown', dismiss);
    overlay.classList.add('hidden');
    inputBlocked = false;
  }
  overlay.addEventListener('pointerdown', dismiss);
}

function loadNextStage() {
  const nextId = stage.next;
  if (!nextId) return;
  initStage(stageData, nextId);
  renderer.snapPos(state.pos);
  input.highlightChar(state.char);
  input.stopMovement();
  renderer.clearFX();
  updateStatusPanel(state);
  inputBlocked = false;
  const startHint = _getHintForRoom(stage.startRoom || [0, 0]);
  if (startHint) showHint(startHint);
}

function dispatch(action) {
  if (inputBlocked) return;

  if (action.type === 'restart') {
    state = buildState(stage, stageData);
    visitedRooms.clear();
    renderer.snapPos(state.pos);
    input.highlightChar(state.char);
    input.stopMovement();
    renderer.clearFX();
    updateStatusPanel(state);
    // Show starting room hint again after restart
    const startHint = _getHintForRoom(stage.startRoom || [0, 0]);
    if (startHint) showHint(startHint);
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

  const prevPos = state.pos;
  state = result.state;
  updateStatusPanel(state);

  let roomChanged = false;
  for (const ev of result.events) {
    if (ev.type === 'room_enter') roomChanged = true;
  }

  if (action.type === 'move') {
    if (roomChanged) {
      renderer.snapPos(state.pos);
      renderer.flashRoomTransition();
    } else if (state.pos[0] !== prevPos[0] || state.pos[1] !== prevPos[1]) {
      renderer.setTargetPos(state.pos);
    }
  }

  for (const ev of result.events) {
    if (ev.type === 'explosion') {
      renderer.addExplosionFX(ev.blasted || []);
      if (ev.origin) renderer.addExplosionFX([ev.origin]);
    }
    if (ev.type === 'rock_push' || ev.type === 'rock_fill') {
      renderer.showPush();
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
    if (ev.type === 'room_enter') {
      renderer.clearFX();
      const hint = _getHintForRoom(ev.roomCoord);
      if (hint) showHint(hint);
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
  renderer.renderMinimap(minimapEl, state);

  requestAnimationFrame(loop);
}

async function main() {
  const data = await loadStages();

  const canvas = document.getElementById('game');
  minimapEl = document.getElementById('minimap');
  renderer = new Renderer(canvas);

  initStage(data, '1-1');
  installDebugHook();
  renderer.resize();
  updateStatusPanel(state);

  input = new InputHandler(dispatch);
  input.buildDpad();

  minimapEl.addEventListener('click', () => {
    const active = renderer.toggleOverview();
    minimapEl.classList.toggle('overview-active', active);
  });

  canvas.addEventListener('click', e => {
    if (renderer.isOverview) {
      renderer.toggleOverview();
      minimapEl.classList.remove('overview-active');
      return;
    }
    if (state.status === 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const btn = renderer.getRestartBtnRect();
    if (btn && cx >= btn.bx && cx <= btn.bx + btn.bw && cy >= btn.by && cy <= btn.by + btn.bh) {
      if (state.status === 'clear' && stage.next) {
        loadNextStage();
      } else {
        dispatch({ type: 'restart' });
      }
    }
  });

  // Show intro story, then start game with first room hint
  inputBlocked = true;
  showIntro(() => {
    inputBlocked = false;
    const startHint = _getHintForRoom(stage.startRoom || [0, 0]);
    if (startHint) showHint(startHint);
  });

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

main();

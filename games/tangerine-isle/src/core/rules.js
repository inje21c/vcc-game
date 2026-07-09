// Pure rule engine — no DOM/window/Canvas references
// nextState(state, action) → { state, events } | null

const DIRS = {
  up:    [0, -1],
  down:  [0,  1],
  left:  [-1, 0],
  right: [1,  0],
};

function key(x, y) { return `${x},${y}`; }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < 15 && y < 15; }

function getTile(room, x, y) {
  if (!inBounds(x, y)) return '#';
  return room.terrain[y][x];
}

function setAdd(s, item) { const n = new Set(s); n.add(item); return n; }
function setDelete(s, item) { const n = new Set(s); n.delete(item); return n; }
function mapDelete(m, k) { const n = new Map(m); n.delete(k); return n; }

function cloneState(state) {
  return {
    char: state.char,
    pos: [...state.pos],
    dir: state.dir,
    walkFrame: state.walkFrame,
    terrainLock: state.terrainLock || null,
    hp: state.hp,
    hasKey: state.hasKey,
    tangerines: new Set(state.tangerines),
    rocks: new Set(state.rocks),
    bombs: new Map(state.bombs),
    removedTiles: new Set(state.removedTiles),
    filledPits: new Set(state.filledPits),
    openDoors: new Set(state.openDoors),
    tunnelHoles: new Set(state.tunnelHoles || []),
    chestOpen: state.chestOpen,
    status: state.status,
    _room: state._room,
    _doorGroups: state._doorGroups,
    _G: state._G,
  };
}

function currentTerrainLock(state) {
  if (state.terrainLock) return state.terrainLock;
  const [x, y] = state.pos;
  if (state.char === 'rabbit' && state.tunnelHoles?.has(key(x, y))) return 'rabbit';
  if (effectiveTile(state, x, y) === '~') return 'turtle';
  return null;
}

function applyTerrainLock(state, forcedLock = null) {
  if (forcedLock) {
    state.terrainLock = forcedLock;
    return;
  }

  const [x, y] = state.pos;
  if (state.char === 'rabbit' && state.tunnelHoles.has(key(x, y))) {
    state.terrainLock = 'rabbit';
  } else {
    state.terrainLock = effectiveTile(state, x, y) === '~' ? 'turtle' : null;
  }
}

function effectiveTile(state, x, y) {
  const k = key(x, y);
  if (state.removedTiles.has(k)) return '.';
  if (state.filledPits.has(k)) return '.';
  if (state.openDoors.has(k)) return '.';
  return getTile(state._room, x, y);
}

function reEvalButtons(state, events) {
  const room = state._room;
  const groups = {};

  for (const obj of room.objects) {
    if (obj.type !== 'button') continue;
    const gid = obj.group;
    if (!groups[gid]) groups[gid] = { needed: 0, pressed: 0 };
    groups[gid].needed++;
    if (state.rocks.has(key(...obj.pos))) groups[gid].pressed++;
  }

  for (const [gid, { needed, pressed }] of Object.entries(groups)) {
    if (needed === 0) continue;
    for (const [dkey, dgroup] of Object.entries(state._doorGroups)) {
      if (dgroup !== gid) continue;
      if (pressed >= needed && !state.openDoors.has(dkey)) {
        state.openDoors = setAdd(state.openDoors, dkey);
        events.push({ type: 'door_open', pos: dkey });
      }
    }
  }
}

function detonate(state, bx, by, events) {
  const range = state.bombs.get(key(bx, by));
  if (range == null) return state;

  state.bombs = mapDelete(state.bombs, key(bx, by));
  const blasted = [[bx, by]];

  const dirs4 = [[0,-1],[0,1],[-1,0],[1,0]];
  for (const [dx, dy] of dirs4) {
    for (let i = 1; i <= range; i++) {
      const tx = bx + dx * i;
      const ty = by + dy * i;
      if (!inBounds(tx, ty)) break;

      const raw = getTile(state._room, tx, ty);
      blasted.push([tx, ty]);

      if (raw === 'T' && !state.removedTiles.has(key(tx, ty))) {
        state.removedTiles = setAdd(state.removedTiles, key(tx, ty));
        events.push({ type: 'explosion_tile', pos: [tx, ty] });
      }

      if (raw === 'd' && !state.removedTiles.has(key(tx, ty)) && !state.openDoors.has(key(tx, ty))) {
        state.removedTiles = setAdd(state.removedTiles, key(tx, ty));
        events.push({ type: 'door_destroy', pos: [tx, ty] });
      }

      if (state.bombs.has(key(tx, ty))) {
        state = detonate(state, tx, ty, events);
      }
    }
  }

  events.push({ type: 'explosion', origin: [bx, by], range, blasted });
  return state;
}

function applyPickups(state, x, y, events) {
  const k = key(x, y);

  if (state.tangerines.has(k)) {
    state.tangerines = setDelete(state.tangerines, k);
    state.hp += state._G;
    events.push({ type: 'pickup', item: 'tangerine', pos: [x, y], hp: state.hp });
  }

  if (!state.hasKey) {
    const keyObj = state._room.objects.find(o => o.type === 'key' && o.pos[0] === x && o.pos[1] === y);
    if (keyObj) {
      state.hasKey = true;
      events.push({ type: 'pickup', item: 'key', pos: [x, y] });
    }
  }

  if (state.hasKey && !state.chestOpen) {
    const chestObj = state._room.objects.find(o => o.type === 'chest' && o.pos[0] === x && o.pos[1] === y);
    if (chestObj) {
      state.chestOpen = true;
      state.status = 'clear';
      events.push({ type: 'clear', pos: [x, y] });
    }
  }

  if (state.bombs.has(k)) {
    state = detonate(state, x, y, events);
  }

  return state;
}

export function nextState(state, action) {
  if (state.status !== 'playing') return null;

  const events = [];

  if (action.type === 'switch') {
    if (!['cat', 'rabbit', 'turtle'].includes(action.char)) return null;
    const lockedChar = currentTerrainLock(state);
    if (lockedChar && action.char !== lockedChar) return null;
    const s = cloneState(state);
    s.char = action.char;
    events.push({ type: 'switch', char: action.char });
    return { state: s, events };
  }

  if (action.type !== 'move') return null;

  const [dx, dy] = DIRS[action.dir];
  const [px, py] = state.pos;
  let tx = px + dx;
  let ty = py + dy;

  const char = state.char;
  let s = cloneState(state);
  let hpCost = 1;
  let forcedLock = null;

  s.dir = action.dir;
  s.walkFrame = state.walkFrame === 'a' ? 'b' : 'a';

  const targetTile = effectiveTile(s, tx, ty);
  const targetKey = key(tx, ty);

  if (s.rocks.has(targetKey)) {
    if (char !== 'cat') return null;
    const rx = tx + dx;
    const ry = ty + dy;
    const rTile = effectiveTile(s, rx, ry);
    const rockDest = key(rx, ry);

    if (s.rocks.has(rockDest)) return null;
    if (rTile === 'P') {
      s.rocks = setDelete(s.rocks, targetKey);
      s.filledPits = setAdd(s.filledPits, rockDest);
      events.push({ type: 'rock_fill', from: [tx, ty], to: [rx, ry] });
    } else if (rTile === '.') {
      s.rocks = setDelete(s.rocks, targetKey);
      s.rocks = setAdd(s.rocks, rockDest);
      events.push({ type: 'rock_push', from: [tx, ty], to: [rx, ry] });
    } else {
      return null;
    }
    reEvalButtons(s, events);
  } else {
    if (targetTile === 'T') {
      if (char === 'rabbit') {
        const nx = tx + dx;
        const ny = ty + dy;
        if (effectiveTile(s, nx, ny) === '.') {
          tx = nx;
          ty = ny;
          hpCost = 2;
          forcedLock = 'rabbit';
          s.tunnelHoles = setAdd(setAdd(s.tunnelHoles, key(px, py)), key(tx, ty));
          events.push({ type: 'tunnel', from: [px, py], pos: [tx, ty] });
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (targetTile === '~') {
      if (char !== 'turtle') return null;
      events.push({ type: 'swim', pos: [tx, ty] });
    } else if (targetTile === 'P') {
      return null;
    } else if (targetTile === 'd' || targetTile === 'D') {
      // effectiveTile returns '.' if door is open — if we're here, it's still closed
      return null;
    } else if (targetTile !== '.') {
      return null;
    }
  }

  s.hp -= hpCost;
  if (s.hp <= 0) {
    s.hp = 0;
    s.pos = [tx, ty];
    s.status = 'gameover';
    events.push({ type: 'gameover' });
    return { state: s, events };
  }

  s.pos = [tx, ty];
  applyTerrainLock(s, forcedLock);
  s = applyPickups(s, tx, ty, events);

  return { state: s, events };
}

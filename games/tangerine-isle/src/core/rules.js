// Pure rule engine — no DOM/window/Canvas references
// nextState(state, action) → { state, events } | null

const DIRS = {
  up:    [0, -1],
  down:  [0,  1],
  left:  [-1, 0],
  right: [1,  0],
};

const GRID = 15;

function key(x, y) { return `${x},${y}`; }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < GRID && y < GRID; }

function getTile(room, x, y) {
  if (!inBounds(x, y)) return '#';
  return room.terrain[y][x];
}

function setAdd(s, item)  { const n = new Set(s); n.add(item);    return n; }
function setDelete(s, item){ const n = new Set(s); n.delete(item); return n; }
function mapDelete(m, k)   { const n = new Map(m); n.delete(k);   return n; }

// Deep-clone the per-room mutable state archive.
function cloneRoomStates(map) {
  const out = new Map();
  for (const [rk, rs] of map) {
    out.set(rk, {
      tangerines:   new Set(rs.tangerines),
      rocks:        new Set(rs.rocks),
      bombs:        new Map(rs.bombs),
      removedTiles: new Set(rs.removedTiles),
      filledPits:   new Set(rs.filledPits),
      openDoors:    new Set(rs.openDoors),
      tunnelHoles:  new Set(rs.tunnelHoles),
      scorchedTiles: new Set(rs.scorchedTiles || []),
    });
  }
  return out;
}

function cloneState(state) {
  return {
    char: state.char,
    roomCoord: [...state.roomCoord],
    pos: [...state.pos],
    dir: state.dir,
    walkFrame: state.walkFrame,
    terrainLock: state.terrainLock || null,
    swimStreak: state.swimStreak || 0,
    hp: state.hp,
    hasKey: state.hasKey,
    drainedGroups: new Set(state.drainedGroups || []),
    tangerines:   new Set(state.tangerines),
    rocks:        new Set(state.rocks),
    bombs:        new Map(state.bombs),
    removedTiles: new Set(state.removedTiles),
    filledPits:   new Set(state.filledPits),
    openDoors:    new Set(state.openDoors),
    tunnelHoles:  new Set(state.tunnelHoles || []),
    scorchedTiles: new Set(state.scorchedTiles || []),
    chestOpen: state.chestOpen,
    status: state.status,
    _room:         state._room,          // immutable room data — safe to share
    _rooms:        state._rooms,         // immutable map — safe to share
    _roomStates:   cloneRoomStates(state._roomStates),
    _buttonGroups: state._buttonGroups,  // stage-level, immutable
    _drainedLookup: state._drainedLookup, // stage-level, immutable
    _G: state._G,
    _swimLimit: state._swimLimit,
    _explosionBurnsTangerines: state._explosionBurnsTangerines,
    _explosionScorches: state._explosionScorches,
  };
}

function nextSwimStreak(state, tile) {
  return tile === '~' ? (state.swimStreak || 0) + 1 : 0;
}

function canEnterWater(state, tile) {
  if (tile !== '~') return true;
  return !state._swimLimit || nextSwimStreak(state, tile) <= state._swimLimit;
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

// 잠긴 밸브가 말린 물 타일인가 — roomKey는 "rx,ry".
function isDrainedTile(state, roomKey, x, y) {
  const gid = state._drainedLookup?.get(roomKey)?.get(key(x, y));
  return gid != null && state.drainedGroups?.has(gid);
}

function effectiveTile(state, x, y) {
  const k = key(x, y);
  if (state.removedTiles.has(k)) return '.';
  if (state.filledPits.has(k))   return '.';
  if (state.openDoors.has(k))    return '.';
  const raw = getTile(state._room, x, y);
  if (raw === '~' && isDrainedTile(state, key(...state.roomCoord), x, y)) return '.';
  return raw;
}

// effectiveTile for a room that isn't currently active — reads from its archived state.
function effectiveTileInRoom(state, room, rs, x, y) {
  const k = key(x, y);
  if (rs.removedTiles.has(k)) return '.';
  if (rs.filledPits.has(k))   return '.';
  if (rs.openDoors.has(k))    return '.';
  const raw = getTile(room, x, y);
  if (raw === '~' && isDrainedTile(state, key(...room.coord), x, y)) return '.';
  return raw;
}

function reEvalButtons(state, events) {
  const crk = key(...state.roomCoord);

  for (const [gid, group] of Object.entries(state._buttonGroups)) {
    let allPressed = true;
    for (const btn of group.buttons) {
      const rk  = key(...btn.room);
      const bk  = key(...btn.pos);
      const rocks = rk === crk ? state.rocks : state._roomStates.get(rk)?.rocks;
      if (!rocks || !rocks.has(bk)) { allPressed = false; break; }
    }

    // Pressure-based: open doors when all buttons pressed, close when any released.
    for (const door of group.doors) {
      const rk = key(...door.room);
      const dk = key(...door.pos);
      if (rk === crk) {
        if (allPressed && !state.openDoors.has(dk)) {
          state.openDoors = setAdd(state.openDoors, dk);
          events.push({ type: 'door_open', pos: dk, room: door.room });
        } else if (!allPressed && state.openDoors.has(dk)) {
          state.openDoors = setDelete(state.openDoors, dk);
          events.push({ type: 'door_close', pos: dk, room: door.room });
        }
      } else {
        const rs = state._roomStates.get(rk);
        if (rs) {
          if (allPressed && !rs.openDoors.has(dk)) {
            rs.openDoors = setAdd(rs.openDoors, dk);
            events.push({ type: 'door_open', pos: dk, room: door.room });
          } else if (!allPressed && rs.openDoors.has(dk)) {
            rs.openDoors = setDelete(rs.openDoors, dk);
            events.push({ type: 'door_close', pos: dk, room: door.room });
          }
        }
      }
    }
  }
}

function detonate(state, bx, by, events) {
  const range = state.bombs.get(key(bx, by));
  if (range == null) return state;

  const originKey = key(bx, by);
  state.bombs = mapDelete(state.bombs, originKey);
  if (state._explosionScorches && getTile(state._room, bx, by) !== '#') {
    state.scorchedTiles = setAdd(state.scorchedTiles || new Set(), originKey);
  }
  const blasted = [[bx, by]];

  const dirs4 = [[0,-1],[0,1],[-1,0],[1,0]];
  for (const [dx, dy] of dirs4) {
    for (let i = 1; i <= range; i++) {
      const tx = bx + dx * i;
      const ty = by + dy * i;
      if (!inBounds(tx, ty)) break;

      const raw = getTile(state._room, tx, ty);
      const tk = key(tx, ty);
      blasted.push([tx, ty]);

      if (state._explosionScorches && raw !== '#') {
        state.scorchedTiles = setAdd(state.scorchedTiles || new Set(), tk);
      }

      if (state._explosionBurnsTangerines && state.tangerines.has(tk)) {
        state.tangerines = setDelete(state.tangerines, tk);
        events.push({ type: 'tangerine_burn', pos: [tx, ty] });
      }

      if (raw === 'T' && !state.removedTiles.has(tk)) {
        state.removedTiles = setAdd(state.removedTiles, tk);
        events.push({ type: 'explosion_tile', pos: [tx, ty] });
      }

      if (raw === 'd' && !state.removedTiles.has(tk) && !state.openDoors.has(tk)) {
        state.removedTiles = setAdd(state.removedTiles, tk);
        events.push({ type: 'door_destroy', pos: [tx, ty] });
      }

      if (state.bombs.has(tk)) {
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

  // 밸브: 밟으면 연결된 물 그룹이 영구히 마른다 (되돌릴 수 없음).
  const valveObj = state._room.objects.find(o => o.type === 'valve' && o.pos[0] === x && o.pos[1] === y);
  if (valveObj && valveObj.group && !state.drainedGroups.has(valveObj.group)) {
    state.drainedGroups = setAdd(state.drainedGroups, valveObj.group);
    events.push({ type: 'valve_close', group: valveObj.group, pos: [x, y] });
  }

  if (state.bombs.has(k)) {
    state = detonate(state, x, y, events);
  }

  return state;
}

// Swap flat mutable fields between rooms.
// Saves current flat state → _roomStates[old], loads _roomStates[new] → flat fields.
function doRoomTransition(s, newCoord, newPos, events) {
  const oldRk = key(...s.roomCoord);
  const newRk = key(...newCoord);

  // Archive current flat state for the room we're leaving.
  s._roomStates.set(oldRk, {
    tangerines:   s.tangerines,
    rocks:        s.rocks,
    bombs:        s.bombs,
    removedTiles: s.removedTiles,
    filledPits:   s.filledPits,
    openDoors:    s.openDoors,
    tunnelHoles:  s.tunnelHoles,
    scorchedTiles: s.scorchedTiles,
  });

  // Restore the room we're entering.
  const newRS = s._roomStates.get(newRk);
  s.tangerines   = newRS.tangerines;
  s.rocks        = newRS.rocks;
  s.bombs        = newRS.bombs;
  s.removedTiles = newRS.removedTiles;
  s.filledPits   = newRS.filledPits;
  s.openDoors    = newRS.openDoors;
  s.tunnelHoles  = newRS.tunnelHoles;
  s.scorchedTiles = newRS.scorchedTiles || new Set();

  const newRoom = s._rooms.get(newRk);
  s.roomCoord  = newCoord;
  s._room      = newRoom;
  s.pos        = newPos;
  // terrainLock is recalculated by the caller via applyTerrainLock.
  s.terrainLock = null;

  events.push({ type: 'room_enter', roomCoord: newCoord });
}

// Attempt to move the player off the current room's edge into an adjacent room.
function handleRoomTransition(s, tx, ty, events) {
  const [rx, ry] = s.roomCoord;
  let newRx = rx, newRy = ry;
  let newTx = tx, newTy = ty;

  if      (tx < 0)    { newRx = rx - 1; newTx = GRID - 1; }
  else if (tx >= GRID){ newRx = rx + 1; newTx = 0; }
  if      (ty < 0)    { newRy = ry - 1; newTy = GRID - 1; }
  else if (ty >= GRID){ newRy = ry + 1; newTy = 0; }

  const newRk = key(newRx, newRy);
  if (!s._rooms.has(newRk)) return null; // no adjacent room in this direction

  const newRoom = s._rooms.get(newRk);
  const newRS   = s._roomStates.get(newRk);
  const entry   = effectiveTileInRoom(s, newRoom, newRS, newTx, newTy);
  const entryKey = key(newTx, newTy);

  // Entry tile must be a valid room entrance. Objects on that tile can further
  // restrict entry, but cannot be pushed from across the room boundary.
  if (entry !== '.' && entry !== '~') return null;
  if (entry === '~' && (s.char !== 'turtle' || !canEnterWater(s, entry))) return null;
  if (newRS.rocks.has(entryKey)) return null;
  if (newRS.tunnelHoles.has(entryKey) && s.char !== 'rabbit') return null;

  s.hp -= 1;
  if (s.hp <= 0) {
    s.hp = 0;
    s.status = 'gameover';
    events.push({ type: 'gameover' });
    return { state: s, events };
  }

  doRoomTransition(s, [newRx, newRy], [newTx, newTy], events);
  reEvalButtons(s, events); // re-derive door states from current rock positions
  s.swimStreak = nextSwimStreak(s, entry);
  applyTerrainLock(s);
  s = applyPickups(s, newTx, newTy, events);

  return { state: s, events };
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

  // Off-edge: attempt room transition before any in-room tile logic.
  // Rocks and tunnels cannot cross room boundaries.
  if (!inBounds(tx, ty)) {
    return handleRoomTransition(s, tx, ty, events);
  }

  const targetTile = effectiveTile(s, tx, ty);
  const targetKey  = key(tx, ty);

  if (s.rocks.has(targetKey)) {
    if (char !== 'cat') return null;
    const rx = tx + dx;
    const ry = ty + dy;
    const rTile   = effectiveTile(s, rx, ry);
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
      if (char !== 'turtle' || !canEnterWater(s, targetTile)) return null;
      events.push({ type: 'swim', pos: [tx, ty], streak: nextSwimStreak(s, targetTile), limit: s._swimLimit });
    } else if (targetTile === 'P') {
      return null;
    } else if (targetTile === 'd' || targetTile === 'D') {
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
  s.swimStreak = nextSwimStreak(s, effectiveTile(s, tx, ty));
  applyTerrainLock(s, forcedLock);
  s = applyPickups(s, tx, ty, events);

  return { state: s, events };
}

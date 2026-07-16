// Builds initial State from a Stage + Stage Data JSON

function key(x, y) { return `${x},${y}`; }

function buildRoomMutable(room) {
  const tangerines = new Set();
  const rocks = new Set();
  const bombs = new Map();
  for (const obj of room.objects) {
    if (obj.type === 'tangerine') tangerines.add(key(...obj.pos));
    if (obj.type === 'rock')      rocks.add(key(...obj.pos));
    if (obj.type === 'bomb')      bombs.set(key(...obj.pos), obj.range);
  }
  return {
    tangerines,
    rocks,
    bombs,
    removedTiles: new Set(),
    filledPits:   new Set(),
    openDoors:    new Set(),
    tunnelHoles:  new Set(),
    scorchedTiles: new Set(),
  };
}

// waterGroups: { groupId: { rooms: [ { room: [rx,ry], tiles: [[x,y],...] } ] } }
// → Map<"rx,ry", Map<"x,y", groupId>> for O(1) drained-tile lookup.
function buildDrainedLookup(waterGroups) {
  const lookup = new Map();
  for (const [gid, group] of Object.entries(waterGroups || {})) {
    for (const entry of group.rooms || []) {
      const rk = key(...entry.room);
      if (!lookup.has(rk)) lookup.set(rk, new Map());
      const roomMap = lookup.get(rk);
      for (const pos of entry.tiles || []) {
        roomMap.set(key(...pos), gid);
      }
    }
  }
  return lookup;
}

export function buildState(stage, stageData) {
  const G = (stageData?.tuning?.G) || 10;
  const tuning = stageData?.tuning || {};
  const swimLimit = stage.swimLimit ?? tuning.swimLimit ?? 8;

  // Build immutable room lookup and per-room mutable archives
  const rooms = new Map();
  const roomStates = new Map();
  for (const room of stage.rooms) {
    const rk = key(...room.coord);
    rooms.set(rk, room);
    roomStates.set(rk, buildRoomMutable(room));
  }

  const startCoord = stage.startRoom || [0, 0];
  const startRk   = key(...startCoord);
  const startRoom  = rooms.get(startRk);
  const startRS    = roomStates.get(startRk);

  return {
    char: 'cat',
    roomCoord: [...startCoord],
    pos: [...stage.startPos],
    dir: 'down',
    walkFrame: 'a',
    terrainLock: null,
    swimStreak: 0,
    hp: stage.startHp,
    hasKey: false,
    drainedGroups: new Set(),   // 잠긴 밸브의 물 그룹 — 영구 상태 (스테이지 전역)

    // Flat mutable fields — always reflect the CURRENT room.
    // On room transition: saved into _roomStates[old], loaded from _roomStates[new].
    tangerines:   startRS.tangerines,
    rocks:        startRS.rocks,
    bombs:        startRS.bombs,
    removedTiles: startRS.removedTiles,
    filledPits:   startRS.filledPits,
    openDoors:    startRS.openDoors,
    tunnelHoles:  startRS.tunnelHoles,
    scorchedTiles: startRS.scorchedTiles,

    chestOpen: false,
    status: 'playing',

    // Stage-wide immutable references
    _room:         startRoom,
    _rooms:        rooms,         // Map<"rx,ry", Room>
    _roomStates:   roomStates,    // Map<"rx,ry", RoomMutable> — current room entry is stale during play
    _buttonGroups: stage.buttonGroups || {},  // stage-level cross-room button→door groups
    _drainedLookup: buildDrainedLookup(stage.waterGroups), // Map<roomKey, Map<tileKey, groupId>>
    _G: G,
    _swimLimit: swimLimit,
    _explosionBurnsTangerines: tuning.explosionBurnsTangerines ?? true,
    _explosionScorches: tuning.explosionScorches ?? true,
  };
}

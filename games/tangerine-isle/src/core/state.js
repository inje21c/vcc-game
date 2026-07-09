// Builds initial State from a Stage + Room JSON

function key(x, y) { return `${x},${y}`; }

export function buildState(stage, stageData) {
  const room = stage.rooms[0]; // Phase 1: single-room only
  const G = (stageData.tuning && stageData.tuning.G) || 10;

  const tangerines = new Set();
  const rocks = new Set();
  const bombs = new Map();

  for (const obj of room.objects) {
    if (obj.type === 'tangerine') tangerines.add(key(...obj.pos));
    if (obj.type === 'rock')      rocks.add(key(...obj.pos));
    if (obj.type === 'bomb')      bombs.set(key(...obj.pos), obj.range);
  }

  return {
    char: 'cat',
    pos: [...stage.startPos],
    dir: 'down',
    walkFrame: 'a',
    terrainLock: null,
    hp: stage.startHp,
    hasKey: false,
    tangerines,
    rocks,
    bombs,
    removedTiles: new Set(),
    filledPits: new Set(),
    openDoors: new Set(),
    tunnelHoles: new Set(),
    chestOpen: false,
    status: 'playing',
    _room: room,
    _doorGroups: room.doorGroups || {},
    _G: G,
  };
}

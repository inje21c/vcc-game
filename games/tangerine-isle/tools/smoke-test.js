const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ROOT, '..', '..');
const STAGE_PATH = path.join(ROOT, 'src', 'data', 'stages.json');
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.css': 'text/css',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expandSolutionPath(stage) {
  const actions = [];
  for (const item of stage.solutionPath || []) {
    if (item.move) {
      for (let i = 0; i < (item.count ?? 1); i++) {
        actions.push({ type: 'move', dir: item.move });
      }
    } else if (item.switch) {
      actions.push({ type: 'switch', char: item.switch });
    }
  }
  return actions;
}

async function runRuleSmoke() {
  const data = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const mapStage = data.stages[0];
  const { buildState } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'state.js')));
  const { nextState } = await import(pathToFileURL(path.join(ROOT, 'src', 'core', 'rules.js')));

  const act = (state, action) => {
    const result = nextState(state, action);
    assert(result, `blocked ${JSON.stringify(action)} at ${state.pos} as ${state.char}`);
    return result.state;
  };
  const blocked = (state, action, label) => {
    assert(nextState(state, action) === null, `expected blocked: ${label}`);
  };

  const stage = {
    id: 'mechanic-smoke',
    chapter: 0,
    startHp: 50,
    startRoom: [0, 0],
    startPos: [7, 13],
    buttonGroups: {
      g1: {
        buttons: [{ room: [0, 0], pos: [5, 8] }],
        doors:   [{ room: [0, 0], pos: [10, 10] }],
      },
    },
    rooms: [
      {
        coord: [0, 0],
        terrain: [
          'TTTTTTTTTTTTTTT',
          'T.....TTT.TTTTT',
          'T.....T.T.TTTTT',
          'T.....TTT.TTTTT',
          'T.........TTTTT',
          'T.....~~~.TTTTT',
          'T.....~~~.TTTTT',
          'T.........TTTTT',
          'T.........TTTTT',
          'T.........TTTTT',
          'T.........D..TT',
          'T.........TTTTT',
          'T.........TTTTT',
          'T.........TTTTT',
          'TTTTTTTTTTTTTTT',
        ],
        objects: [
          { type: 'tangerine', pos: [7, 2] },
          { type: 'tangerine', pos: [1, 4] },
          { type: 'tangerine', pos: [9, 4] },
          { type: 'tangerine', pos: [1, 12] },
          { type: 'tangerine', pos: [9, 12] },
          { type: 'rock',      pos: [5, 4] },
          { type: 'key',       pos: [7, 5] },
          { type: 'button',    pos: [5, 8] },
          { type: 'chest',     pos: [12, 10] },
        ],
      },
    ],
  };

  let state = buildState(stage, data);
  state = { ...state, char: 'turtle', pos: [5, 5] };
  state = act(state, { type: 'move', dir: 'right' });
  assert(state.terrainLock === 'turtle', 'water lock missing');
  blocked(state, { type: 'switch', char: 'cat' }, 'cat switch on water');
  state = act(state, { type: 'move', dir: 'left' });
  assert(state.terrainLock === null, 'water lock did not clear');

  state = { ...buildState(stage, data), char: 'rabbit', pos: [5, 2] };
  state = act(state, { type: 'move', dir: 'right' });
  assert(state.terrainLock === 'rabbit', 'rabbit tunnel lock missing');
  assert(state.tunnelHoles.has('5,2') && state.tunnelHoles.has('7,2'), 'tunnel holes missing');
  blocked(state, { type: 'switch', char: 'cat' }, 'cat switch on tunnel hole');
  state = act(state, { type: 'move', dir: 'left' });
  state = act(state, { type: 'move', dir: 'down' });
  assert(state.terrainLock === null, 'rabbit lock did not clear');

  state = buildState(stage, data);
  const buttonPath = [
    ...Array(5).fill('left'),
    ...Array(10).fill('up'),
    'right',
    ...Array(4).fill('down'),
    'left',
    ...Array(4).fill('up'),
    ...Array(3).fill('right'),
    ...Array(4).fill('down'),
  ];
  for (const dir of buttonPath) state = act(state, { type: 'move', dir });
  assert(state.openDoors.has('10,10'), 'button door did not open');

  state = act(state, { type: 'switch', char: 'turtle' });
  const clearPath = ['up', 'up', 'right', 'right', 'right', 'right', 'down', 'down', 'down', 'down', 'down', 'right', 'right', 'right'];
  for (const dir of clearPath) state = act(state, { type: 'move', dir });
  assert(state.status === 'clear', 'stage clear failed');

  console.log('rules smoke ok');

  // --- Stage 1 directed route smoke ---
  state = buildState(mapStage, data);
  for (const action of expandSolutionPath(mapStage)) state = act(state, action);
  assert(state.status === 'clear', 'stage 1 directed route did not clear');
  assert(state.hasKey && state.chestOpen, 'stage 1 key/chest state missing');
  console.log('stage 1 route smoke ok');

  // --- Room transition smoke ---
  // Minimal 2×1 stage: room [0,0] exits right at col 14 row 7 → room [1,0] entry at col 0 row 7.
  // Row 7 in room [0,0]: T + 14 open cells ('T..............').
  // Row 7 in room [1,0]: 7 open + T wall + 7 open ('.......T.......').
  const floorRow15 = (colWall) => {
    const row = Array(15).fill('.');
    if (colWall != null) row[colWall] = 'T';
    return row.join('');
  };
  const twoRoomStage = {
    id: 'rt-smoke',
    chapter: 0,
    startHp: 30,
    startRoom: [0, 0],
    startPos: [1, 7],  // Start at col 1 in room [0,0]; walk right to col 14 then transition
    rooms: [
      {
        coord: [0, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? 'T..............' : 'TTTTTTTTTTTTTTT'
        ),
        objects: [],
      },
      {
        coord: [1, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? floorRow15(7) : 'TTTTTTTTTTTTTTT'
        ),
        objects: [
          { type: 'tangerine', pos: [1, 7] },
          { type: 'key',       pos: [5, 7] },
        ],
      },
    ],
  };

  let rs = buildState(twoRoomStage, data);
  assert(rs.roomCoord[0] === 0 && rs.roomCoord[1] === 0, 'start room wrong');

  // Walk from col 1 to col 14, then one more step → room transition
  for (let i = 0; i < 13; i++) rs = act(rs, { type: 'move', dir: 'right' }); // 1→14
  rs = act(rs, { type: 'move', dir: 'right' }); // 14 → transition to [1,0]
  assert(rs.roomCoord[0] === 1 && rs.roomCoord[1] === 0, 'room transition did not happen');
  assert(rs.pos[0] === 0 && rs.pos[1] === 7, 'entry pos wrong after transition');

  // Move right inside room [1,0]
  rs = act(rs, { type: 'move', dir: 'right' }); // 0→1 (tangerine)
  assert(!rs.tangerines.has('1,7'), 'tangerine not consumed in new room');

  rs = act(rs, { type: 'move', dir: 'right' }); // 1→2
  rs = act(rs, { type: 'move', dir: 'right' }); // 2→3 (chest — no key yet)
  rs = act(rs, { type: 'move', dir: 'right' }); // 3→4
  rs = act(rs, { type: 'move', dir: 'right' }); // 4→5 (key)
  assert(rs.hasKey, 'key not picked up in room [1,0]');
  rs = act(rs, { type: 'move', dir: 'right' }); // 5→6 (floor)
  blocked(rs, { type: 'move', dir: 'right' }, 'wall at col 7 in room [1,0]');

  // Return to room [0,0] via left edge (player is at col 6 after wall-check step)
  rs = act(rs, { type: 'move', dir: 'left' }); // 6→5
  rs = act(rs, { type: 'move', dir: 'left' }); // 5→4
  rs = act(rs, { type: 'move', dir: 'left' }); // 4→3
  rs = act(rs, { type: 'move', dir: 'left' }); // 3→2
  rs = act(rs, { type: 'move', dir: 'left' }); // 2→1
  rs = act(rs, { type: 'move', dir: 'left' }); // 1→0
  rs = act(rs, { type: 'move', dir: 'left' }); // 0→transition back to [0,0]
  assert(rs.roomCoord[0] === 0 && rs.roomCoord[1] === 0, 'did not return to room [0,0]');
  assert(rs.pos[0] === 14 && rs.pos[1] === 7, 'return entry pos wrong');
  assert(rs.hasKey, 'key lost on room return');
  assert(!rs.tangerines.has('1,7'), 'room [0,0] has no tangerines — check wrong room bled in');

  // Re-enter room [1,0]: tangerine should still be gone, key still held
  rs = act(rs, { type: 'move', dir: 'right' }); // 14→transition
  assert(rs.roomCoord[0] === 1, 're-enter room [1,0] failed');
  assert(!rs.tangerines.has('1,7'), 'tangerine re-appeared after re-entering room');

  const entryStage = ({ entryTerrain = '.', objects = [] } = {}) => ({
    id: 'entry-smoke',
    chapter: 0,
    startHp: 10,
    startRoom: [0, 0],
    startPos: [14, 7],
    rooms: [
      {
        coord: [0, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? '...............' : 'TTTTTTTTTTTTTTT'
        ),
        objects: [],
      },
      {
        coord: [1, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? entryTerrain + '.'.repeat(14) : 'TTTTTTTTTTTTTTT'
        ),
        objects,
      },
    ],
  });

  let entry = buildState(entryStage({ objects: [{ type: 'rock', pos: [0, 7] }] }), data);
  blocked(entry, { type: 'move', dir: 'right' }, 'rock blocks room entry');

  entry = buildState(entryStage({ entryTerrain: '~' }), data);
  blocked(entry, { type: 'move', dir: 'right' }, 'cat cannot enter water room entry');
  entry = buildState(entryStage({ entryTerrain: '~' }), data);
  entry.char = 'turtle';
  entry = act(entry, { type: 'move', dir: 'right' });
  assert(entry.roomCoord[0] === 1 && entry.terrainLock === 'turtle', 'turtle water room entry failed');

  entry = buildState(entryStage(), data);
  entry._roomStates.get('1,0').tunnelHoles.add('0,7');
  blocked(entry, { type: 'move', dir: 'right' }, 'cat cannot enter rabbit tunnel entry');
  entry = buildState(entryStage(), data);
  entry.char = 'rabbit';
  entry._roomStates.get('1,0').tunnelHoles.add('0,7');
  entry = act(entry, { type: 'move', dir: 'right' });
  assert(entry.roomCoord[0] === 1 && entry.terrainLock === 'rabbit', 'rabbit tunnel room entry failed');

  entry = buildState(entryStage({ objects: [{ type: 'bomb', pos: [0, 7], range: 1 }] }), data);
  entry = act(entry, { type: 'move', dir: 'right' });
  assert(entry.roomCoord[0] === 1 && !entry.bombs.has('0,7'), 'bomb room entry did not detonate');

  console.log('room transition smoke ok');

  // --- Cross-room button → door smoke ---
  // Room [0,0]: rock at [6,7], button at [7,7].
  // Room [1,0]: stone door 'D' at entry col 0 row 7 — blocks entry until button pressed.
  // buttonGroups: pressing button in [0,0] opens door in [1,0].
  const crossRoomStage = {
    id: 'cross-smoke',
    chapter: 0,
    startHp: 20,
    startRoom: [0, 0],
    startPos: [5, 7],
    buttonGroups: {
      g1: {
        buttons: [{ room: [0, 0], pos: [7, 7] }],
        doors:   [{ room: [1, 0], pos: [0, 7] }],
      },
    },
    rooms: [
      {
        coord: [0, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? '...............' : 'TTTTTTTTTTTTTTT'
        ),
        objects: [
          { type: 'rock',   pos: [6, 7] },
          { type: 'button', pos: [7, 7] },
        ],
      },
      {
        coord: [1, 0],
        terrain: Array.from({ length: 15 }, (_, y) =>
          y === 7 ? 'D..............' : 'TTTTTTTTTTTTTTT'
        ),
        objects: [
          { type: 'key',   pos: [5, 7] },
          { type: 'chest', pos: [10, 7] },
        ],
      },
    ],
  };

  let cs = buildState(crossRoomStage, data);
  // Door in room [1,0] should be closed — transition from edge of [0,0] must fail.
  const edgeState = { ...cs, pos: [14, 7] };
  blocked(edgeState, { type: 'move', dir: 'right' }, 'cross-room door must block entry before button');

  // Push rock right: player [5,7] → [6,7], rock [6,7] → [7,7] (button).
  cs = act(cs, { type: 'move', dir: 'right' });
  assert(cs._roomStates.get('1,0').openDoors.has('0,7'), 'cross-room door did not open after button');

  // Now transition to room [1,0] via right edge.
  cs = { ...cs, pos: [14, 7] };
  cs = act(cs, { type: 'move', dir: 'right' });
  assert(cs.roomCoord[0] === 1 && cs.roomCoord[1] === 0, 'cross-room transition after door open failed');
  assert(cs.openDoors.has('0,7'), 'open door not visible in new room flat state');

  console.log('cross-room smoke ok');
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    const file = path.join(ROOT, decodeURIComponent(pathname));

    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function runBrowserSmoke() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.log('browser smoke skipped (playwright not installed)');
    return;
  }

  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true });
  const errors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 800 } });
    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) errors.push(`console ${msg.type()}: ${msg.text()}`);
    });
    page.on('response', response => {
      if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
    });

    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    assert(errors.length === 0, errors.join('\n'));

    for (let i = 0; i < 4; i++) {
      await page.click('#intro-overlay');
      await page.waitForTimeout(120);
    }

    await page.evaluate(async () => {
      const api = window.__tangerineIsle;
      const data = await fetch('./src/data/stages.json').then(res => res.json());
      const stage = data.stages[0];
      const actions = [];

      for (const item of stage.solutionPath || []) {
        if (item.move) {
          for (let i = 0; i < (item.count ?? 1); i++) actions.push({ type: 'move', dir: item.move });
        } else if (item.switch) {
          actions.push({ type: 'switch', char: item.switch });
        }
      }

      const dismissHint = () => {
        const hint = document.getElementById('hint-overlay');
        if (hint && !hint.classList.contains('hidden')) {
          hint.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        }
      };
      dismissHint();

      for (const action of actions) {
        api.dispatch(action);
        dismissHint();
      }
    });

    let state = await page.evaluate(() => window.__tangerineIsle.getState());
    assert(state.status === 'clear' && state.hasKey && state.chestOpen, 'browser stage 1 route did not clear');

    const canvasNotBlank = await page.evaluate(() => {
      const canvas = document.querySelector('#game');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBg = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (!(data[i] === 214 && data[i + 1] === 158 && data[i + 2] === 74)) nonBg++;
        if (nonBg > 1000) return true;
      }
      return false;
    });
    assert(canvasNotBlank, 'canvas appears blank');

    console.log('browser smoke ok');
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  await runRuleSmoke();
  await runBrowserSmoke();
  console.log(`smoke-test complete (${path.relative(REPO_ROOT, ROOT)})`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

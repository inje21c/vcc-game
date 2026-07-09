const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

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

async function runRuleSmoke() {
  const data = JSON.parse(fs.readFileSync(STAGE_PATH, 'utf8'));
  const stage = data.stages[0];
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

    await page.evaluate(() => {
      const api = window.__tangerineIsle;
      api.dispatch({ type: 'switch', char: 'rabbit' });
      for (const dir of [...Array(5).fill('left'), ...Array(11).fill('up'), ...Array(4).fill('right')]) {
        api.dispatch({ type: 'move', dir });
      }
    });

    let state = await page.evaluate(() => window.__tangerineIsle.getState());
    assert(state.char === 'rabbit' && state.terrainLock === 'rabbit', 'browser rabbit tunnel lock failed');
    assert(state.tunnelHoles.includes('5,2') && state.tunnelHoles.includes('7,2'), 'browser tunnel holes missing');

    await page.evaluate(() => window.__tangerineIsle.dispatch({ type: 'switch', char: 'cat' }));
    state = await page.evaluate(() => window.__tangerineIsle.getState());
    assert(state.char === 'rabbit', 'blocked switch changed character');

    const blockedMarkerVisible = await page.evaluate(() => {
      const catButton = document.querySelector('[data-char="cat"]');
      return Boolean(catButton?.querySelector('img[src*="ui_lock_forbidden"]'));
    });
    assert(blockedMarkerVisible, 'blocked switch marker did not appear');

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

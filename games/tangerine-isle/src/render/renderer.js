// Canvas 2D renderer — 15×15 tiles, 128px each

const T = 128; // tile size px
const COLS = 15;
const ROWS = 15;
const BG = '#D69E4A';

const ASSET_BASE = new URL('../../assets/', import.meta.url);

function assetUrl(folder, id) { return new URL(`${folder}/${id}.png`, ASSET_BASE).href; }
function tileImg(id)   { return assetUrl('tiles', id); }
function sprImg(id)    { return assetUrl('sprites', id); }
function objImg(id)    { return assetUrl('objects', id); }
function uiImg(id)     { return assetUrl('ui', id); }
function fxImg(id)     { return assetUrl('fx', id); }

const imageCache = {};
function loadImg(src) {
  if (imageCache[src]) return imageCache[src];
  const img = new Image();
  img.src = src;
  imageCache[src] = img;
  return img;
}

function drawImg(ctx, src, x, y, w = T, h = T) {
  const img = loadImg(src);
  if (!img.complete || img.naturalWidth === 0) return;
  ctx.drawImage(img, x, y, w, h);
}

function key(x, y) { return `${x},${y}`; }

function effectiveTile(room, state, x, y) {
  const k = key(x, y);
  if (state.removedTiles.has(k)) return '.';
  if (state.filledPits.has(k)) return '.';
  if (state.openDoors.has(k)) return '.';
  return room.terrain[y]?.[x] || '#';
}

function drawTunnelHole(ctx, x, y) {
  const px = x * T;
  const py = y * T;

  drawImg(ctx, objImg('obj_sign_rabbit_hole'), px, py, T, T);

  ctx.save();
  ctx.fillStyle = '#6D3D1F';
  ctx.font = `bold ${T * 0.12}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('금향', px + T * 0.36, py + T * 0.36);
  ctx.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._waterFrame = 0;
    this._waterTimer = 0;
    this._fx = []; // active flash effects [{x,y,alpha,until}]
    this._spriteFx = [];
  }

  resize() {
    const size = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.canvas.width = COLS * T;
    this.canvas.height = ROWS * T;
  }

  addExplosionFX(tiles) {
    const until = Date.now() + 200;
    for (const [x, y] of tiles) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      this._fx.push({ x, y, until });
    }
  }

  clearFX() {
    this._fx = [];
    this._spriteFx = [];
  }

  addActionFX(kind, tiles) {
    const until = Date.now() + 300;
    for (const [x, y] of tiles) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      this._spriteFx.push({ kind, x, y, until });
    }
  }

  tick(dt) {
    this._waterTimer += dt;
    if (this._waterTimer > 500) {
      this._waterFrame = 1 - this._waterFrame;
      this._waterTimer = 0;
    }
    this._fx = this._fx.filter(f => Date.now() < f.until);
    this._spriteFx = this._spriteFx.filter(f => Date.now() < f.until);
  }

  render(state) {
    const ctx = this.ctx;
    const room = state._room;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, COLS * T, ROWS * T);

    // --- Pass 1: Terrain ---
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = key(x, y);
        let tile = room.terrain[y][x];
        if (state.removedTiles.has(k)) tile = '.';
        if (state.filledPits.has(k)) tile = 'P_filled';
        if (state.openDoors.has(k)) tile = '.';

        const px = x * T, py = y * T;
        drawImg(ctx, tileImg('tile_ground_a'), px, py);

        if (tile === '~') {
          const wf = this._waterFrame === 0 ? 'tile_water_a' : 'tile_water_b';
          drawImg(ctx, tileImg(wf), px, py);
        } else if (tile === 'P') {
          drawImg(ctx, tileImg('tile_pit'), px, py);
        } else if (tile === 'P_filled') {
          drawImg(ctx, tileImg('tile_pit_filled'), px, py);
        } else if (tile === 'd') {
          drawImg(ctx, tileImg('tile_door_wood'), px, py);
        } else if (tile === 'D') {
          drawImg(ctx, tileImg('tile_door_stone'), px, py);
        }
      }
    }

    // --- Pass 2: Floor items (tangerines, keys, buttons) ---
    const S = T * 0.8;
    const off = (T - S) / 2;

    for (const hk of state.tunnelHoles || []) {
      const [hx, hy] = hk.split(',').map(Number);
      drawTunnelHole(ctx, hx, hy);
    }

    for (const obj of room.objects) {
      const [ox, oy] = obj.pos;
      const px = ox * T, py = oy * T;
      const ok = key(ox, oy);

      if (obj.type === 'tangerine' && state.tangerines.has(ok)) {
        drawImg(ctx, objImg('obj_tangerine'), px + off, py + off, S, S);
      }
      if (obj.type === 'key' && !state.hasKey) {
        drawImg(ctx, objImg('obj_key'), px + off, py + off, S, S);
      }
      if (obj.type === 'button') {
        const pressed = state.rocks.has(ok);
        const id = pressed ? 'obj_button_on' : 'obj_button_off';
        drawImg(ctx, objImg(id), px + off, py + off, S, S);
      }
    }

    // --- Pass 3: 입체 오브젝트 (y-sort) ---
    const entities = [];

    // Trees
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (room.terrain[y][x] === 'T' && !state.removedTiles.has(key(x, y))) {
          entities.push({ type: 'tree', x, y });
        }
      }
    }

    // Closed doors
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = key(x, y);
        const tile = room.terrain[y][x];
        if ((tile === 'd' || tile === 'D') && !state.removedTiles.has(k) && !state.openDoors.has(k)) {
          entities.push({ type: tile === 'd' ? 'door_wood' : 'door_stone', x, y });
        }
      }
    }

    // Rocks
    for (const rk of state.rocks) {
      const [rx, ry] = rk.split(',').map(Number);
      entities.push({ type: 'rock', x: rx, y: ry });
    }

    // Bombs
    for (const [bk, range] of state.bombs) {
      const [bx, by] = bk.split(',').map(Number);
      entities.push({ type: 'bomb', x: bx, y: by, range });
    }

    // Chest
    for (const obj of room.objects) {
      if (obj.type === 'chest') {
        entities.push({ type: 'chest', x: obj.pos[0], y: obj.pos[1], open: state.chestOpen });
      }
    }

    // Player character
    const playerTile = effectiveTile(room, state, state.pos[0], state.pos[1]);
    const playerKey = key(state.pos[0], state.pos[1]);
    const playerFrame =
      (state.char === 'turtle' && playerTile === '~') ||
      (state.char === 'rabbit' && state.tunnelHoles?.has(playerKey))
        ? 'act'
        : state.walkFrame || 'a';
    entities.push({ type: 'player', x: state.pos[0], y: state.pos[1], char: state.char, dir: state.dir || 'down', frame: playerFrame });

    entities.sort((a, b) => a.y - b.y);

    for (const e of entities) {
      const px = e.x * T, py = e.y * T;
      const scale = 1.2;
      const w = T * scale, h = T * scale;
      const ox = (T - w) / 2, oy = T - h;

      // Shadow ellipse
      ctx.save();
      ctx.globalAlpha = 0.31;
      ctx.fillStyle = 'rgba(40,25,10,1)';
      ctx.beginPath();
      ctx.ellipse(px + T/2, py + T * 0.85, T * 0.44, T * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (e.type === 'tree') {
        const treeScale = 1.18;
        const tw = T * treeScale;
        const th = T * treeScale;
        drawImg(ctx, tileImg('tile_tree'), px + (T - tw) / 2, py + T - th, tw, th);
      } else if (e.type === 'door_wood') {
        drawImg(ctx, tileImg('tile_door_wood'), px, py, T, T);
      } else if (e.type === 'door_stone') {
        drawImg(ctx, tileImg('tile_door_stone'), px, py, T, T);
      } else if (e.type === 'rock') {
        drawImg(ctx, objImg('obj_rock'), px + ox, py + oy, w, h);
      } else if (e.type === 'bomb') {
        drawImg(ctx, objImg('obj_bomb'), px + ox, py + oy, w, h);
        // Range label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${T * 0.25}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(e.range, px + T / 2, py + T * 0.35);
      } else if (e.type === 'chest') {
        const cid = e.open ? 'obj_chest_open' : 'obj_chest_closed';
        drawImg(ctx, objImg(cid), px + ox, py + oy, w, h);
      } else if (e.type === 'player') {
        const sprId = `spr_${e.char}_${e.dir}_${e.frame}`;
        drawImg(ctx, sprImg(sprId), px + ox, py + oy, w, h);
      }
    }

    // --- Explosion FX ---
    const now = Date.now();
    for (const f of this._fx) {
      if (now > f.until) continue;
      const alpha = (f.until - now) / 200;
      ctx.save();
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = '#FF8C00';
      ctx.fillRect(f.x * T, f.y * T, T, T);
      ctx.restore();
    }

    for (const f of this._spriteFx) {
      const age = 300 - (f.until - now);
      const frame = age < 150 ? 1 : 2;
      const alpha = Math.max(0, Math.min(1, (f.until - now) / 120));
      const src = f.kind === 'splash' ? fxImg(`fx_splash_${frame}`) : fxImg(`fx_dig_${frame}`);
      ctx.save();
      ctx.globalAlpha = Math.min(1, alpha + 0.2);
      drawImg(ctx, src, f.x * T, f.y * T, T, T);
      ctx.restore();
    }

    // --- HUD ---
    this._renderHUD(ctx, state);

    // --- Status overlays ---
    if (state.status === 'gameover') {
      this._renderOverlay(ctx, 'GAME OVER', '#8B0000', 'R 또는 버튼으로 재시작');
    } else if (state.status === 'clear') {
      this._renderOverlay(ctx, 'CLEAR!', '#2E7D32', '다음 스테이지로...');
    }
  }

  _renderHUD(ctx, state) {
    const padX = 24, padY = 24;
    ctx.save();

    // HP icon + number
    const icon = loadImg(uiImg('ui_icon_tangerine'));
    if (icon.complete && icon.naturalWidth > 0) {
      ctx.drawImage(icon, padX, padY, T * 0.5, T * 0.5);
    }
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${T * 0.38}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(state.hp, padX + T * 0.55, padY + T * 0.42);

    // Key icon
    if (state.hasKey) {
      const kicon = loadImg(uiImg('ui_icon_key'));
      if (kicon.complete && kicon.naturalWidth > 0) {
        ctx.drawImage(kicon, padX, padY + T * 0.55, T * 0.5, T * 0.5);
      }
    }

    ctx.restore();
  }

  _renderOverlay(ctx, title, color, sub) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, COLS * T, ROWS * T);

    ctx.fillStyle = color;
    ctx.font = `bold ${T * 1.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, (COLS * T) / 2, (ROWS * T) / 2 - T * 0.4);

    ctx.fillStyle = '#fff';
    ctx.font = `${T * 0.42}px sans-serif`;
    ctx.fillText(sub, (COLS * T) / 2, (ROWS * T) / 2 + T * 0.6);

    // Restart button rect (store coords for hit-test in main.js)
    const bw = T * 4, bh = T * 0.9;
    const bx = (COLS * T) / 2 - bw / 2;
    const by = (ROWS * T) / 2 + T * 1.6;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${T * 0.45}px sans-serif`;
    ctx.fillText('다시 시작', (COLS * T) / 2, by + bh / 2);
    this._restartBtnRect = { bx, by, bw, bh };

    ctx.restore();
  }

  getRestartBtnRect() { return this._restartBtnRect || null; }
}

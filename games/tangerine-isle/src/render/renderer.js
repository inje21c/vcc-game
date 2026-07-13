// Canvas 2D renderer — 15×15 room tiles, 11×11 viewport with camera

const T = 128; // tile size px
const COLS = 15;
const ROWS = 15;
const VIEWPORT_W = 11;
const VIEWPORT_H = 11;
const BG = '#D69E4A';

const ASSET_BASE = new URL('../../assets/', import.meta.url);

function assetUrl(folder, id) { return new URL(`${folder}/${id}.png`, ASSET_BASE).href; }
function tileImg(id)   { return assetUrl('tiles', id); }
function sprImg(id)    { return assetUrl('sprites', id); }
function objImg(id)    { return assetUrl('objects', id); }
function uiImg(id)     { return assetUrl('ui', id); }
function fxImg(id)     { return assetUrl('fx', id); }

const imageCache = {};
const imageBoundsCache = {};
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

function alphaBounds(src, img) {
  if (imageBoundsCache[src]) return imageBoundsCache[src];
  if (!img.complete || img.naturalWidth === 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  let minX = img.naturalWidth;
  let minY = img.naturalHeight;
  let maxX = -1;
  let maxY = -1;

  try {
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha <= 8) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  } catch {
    imageBoundsCache[src] = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    return imageBoundsCache[src];
  }

  imageBoundsCache[src] = maxX < 0
    ? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }
    : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  return imageBoundsCache[src];
}

const SPRITE_PROFILES = {
  cat:    { height: 1.20, foot: 1.00 },
  rabbit: { height: 1.20, foot: 1.00 },
  turtle: { height: 1.16, foot: 1.00 },
};

const SPRITE_FRAME_PROFILES = {
  'turtle§down§act':  { height: 1.08, foot: 0.98 },
  'turtle§left§act':  { height: 1.08, foot: 0.98 },
  'turtle§right§act': { height: 1.08, foot: 0.98 },
  'turtle§up§act':    { height: 1.08, foot: 0.98 },
};

function spriteProfile(char, dir, frame) {
  return {
    ...(SPRITE_PROFILES[char] || SPRITE_PROFILES.cat),
    ...(SPRITE_FRAME_PROFILES[`${char}§${dir}§${frame}`] || {}),
  };
}

function drawAnchoredSprite(ctx, src, tileX, tileY, char, dir, frame) {
  const img = loadImg(src);
  if (!img.complete || img.naturalWidth === 0) return;

  const bounds = alphaBounds(src, img);
  if (!bounds) return;

  const profile = spriteProfile(char, dir, frame);
  const targetH = T * profile.height;
  const scale = targetH / bounds.h;
  const targetW = bounds.w * scale;
  const anchorX = tileX * T + T / 2;
  const footY = tileY * T + T * profile.foot;

  ctx.drawImage(
    img,
    bounds.x, bounds.y, bounds.w, bounds.h,
    anchorX - targetW / 2, footY - targetH, targetW, targetH
  );
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
    this._fx = [];
    this._spriteFx = [];
    this._pushUntil = 0;
    this._cam = { x: 0, y: 0 };
    this._overviewMode = false;
    // Smooth movement
    this._visualPos = null;   // {x, y} — interpolated render position
    this._logicalPos = null;  // {x, y} — current logical tile (integer)
    this._moveSpeed = 12;     // tiles / second  →  1 tile ≈ 83ms
    // Room-transition flash
    this._flashAlpha = 0;
    this._flashFading = false;
  }

  // Called when player moves within a room
  setTargetPos(pos) {
    if (!this._visualPos) this.snapPos(pos);
    this._logicalPos = { x: pos[0], y: pos[1] };
  }

  // Instantly snap visual position (restart / room entry)
  snapPos(pos) {
    this._visualPos  = { x: pos[0], y: pos[1] };
    this._logicalPos = { x: pos[0], y: pos[1] };
  }

  // Black-flash fade-in for room transitions
  flashRoomTransition() {
    this._flashAlpha  = 1;
    this._flashFading = true;
  }

  resize() {
    this.canvas.width = VIEWPORT_W * T;
    this.canvas.height = VIEWPORT_H * T;
  }

  _updateCamera(px, py) {
    const cx = Math.max(0, Math.min(px - Math.floor(VIEWPORT_W / 2), COLS - VIEWPORT_W));
    const cy = Math.max(0, Math.min(py - Math.floor(VIEWPORT_H / 2), ROWS - VIEWPORT_H));
    this._cam = { x: cx, y: cy };
  }

  toggleOverview() {
    this._overviewMode = !this._overviewMode;
    return this._overviewMode;
  }

  get isOverview() { return this._overviewMode; }

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

  showPush(durationMs = 220) {
    this._pushUntil = Date.now() + durationMs;
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

    // Lerp visual position toward logical position
    if (this._visualPos && this._logicalPos) {
      const dx = this._logicalPos.x - this._visualPos.x;
      const dy = this._logicalPos.y - this._visualPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.004) {
        const step = this._moveSpeed * dt / 1000;
        if (step >= dist) {
          this._visualPos.x = this._logicalPos.x;
          this._visualPos.y = this._logicalPos.y;
        } else {
          this._visualPos.x += (dx / dist) * step;
          this._visualPos.y += (dy / dist) * step;
        }
      }
    }

    // Room-transition flash fade-out
    if (this._flashFading) {
      this._flashAlpha -= dt / 180;
      if (this._flashAlpha <= 0) {
        this._flashAlpha  = 0;
        this._flashFading = false;
      }
    }
  }

  render(state) {
    const ctx = this.ctx;
    const room = state._room;

    const [lx, ly] = state.pos; // logical (integer) position

    // Bootstrap visual pos on first render or after snap
    if (!this._visualPos) this.snapPos(state.pos);

    const vpx = this._visualPos.x;
    const vpy = this._visualPos.y;

    this._updateCamera(vpx, vpy); // camera follows visual pos

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, VIEWPORT_W * T, VIEWPORT_H * T);

    ctx.save();
    if (this._overviewMode) {
      ctx.scale(VIEWPORT_W / COLS, VIEWPORT_H / ROWS);
    } else {
      ctx.translate(-this._cam.x * T, -this._cam.y * T);
    }

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

    // Player character — logical pos for game-state queries, visual pos for rendering
    const playerTile = effectiveTile(room, state, lx, ly);
    const playerKey  = key(lx, ly);
    const isPushing  = state.char === 'cat' && Date.now() < this._pushUntil;
    const playerFrame =
      isPushing ||
      (state.char === 'turtle' && playerTile === '~') ||
      (state.char === 'rabbit' && state.tunnelHoles?.has(playerKey))
        ? 'act'
        : state.walkFrame || 'a';
    entities.push({ type: 'player', x: vpx, y: vpy, char: state.char, dir: state.dir || 'down', frame: playerFrame });

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
        drawAnchoredSprite(ctx, sprImg(sprId), e.x, e.y, e.char, e.dir, e.frame);
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

    ctx.restore(); // end world-space translate / overview scale

    // --- Room-transition flash ---
    if (this._flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = this._flashAlpha;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, VIEWPORT_W * T, VIEWPORT_H * T);
      ctx.restore();
    }

    // --- Overview hint bar ---
    if (this._overviewMode) {
      this._renderOverviewHint(ctx);
    }

    // --- HUD ---
    this._renderHUD(ctx, state);

    // --- Status overlays ---
    if (state.status === 'gameover') {
      this._renderOverlay(ctx, 'GAME OVER', '#8B0000', 'R 또는 버튼으로 재시작');
    } else if (state.status === 'clear') {
      this._renderOverlay(ctx, 'CLEAR!', '#2E7D32', '다음 스테이지로...', '다음 스테이지');
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

  _renderOverlay(ctx, title, color, sub, btnText = '다시 시작') {
    const VW = VIEWPORT_W * T;
    const VH = VIEWPORT_H * T;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, VW, VH);

    ctx.fillStyle = color;
    ctx.font = `bold ${T * 1.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, VW / 2, VH / 2 - T * 0.4);

    ctx.fillStyle = '#fff';
    ctx.font = `${T * 0.42}px sans-serif`;
    ctx.fillText(sub, VW / 2, VH / 2 + T * 0.6);

    const bw = T * 4, bh = T * 0.9;
    const bx = VW / 2 - bw / 2;
    const by = VH / 2 + T * 1.6;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${T * 0.45}px sans-serif`;
    ctx.fillText(btnText, VW / 2, by + bh / 2);
    this._restartBtnRect = { bx, by, bw, bh };

    ctx.restore();
  }

  _renderOverviewHint(ctx) {
    const VW = VIEWPORT_W * T;
    const VH = VIEWPORT_H * T;
    const h = T * 0.28;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, VH - h, VW, h);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `bold ${Math.round(T * 0.17)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('전체 보기  ·  탭하면 돌아가기', VW / 2, VH - h / 2);
    ctx.restore();
  }

  renderMinimap(mmCanvas, state) {
    const room = state._room;
    if (!room) return;

    const ctx = mmCanvas.getContext('2d');
    const W = mmCanvas.width;
    const H = mmCanvas.height;
    const sw = W / COLS;
    const sh = H / ROWS;

    ctx.clearRect(0, 0, W, H);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = effectiveTile(room, state, x, y);
        let color;
        switch (tile) {
          case '#':        color = '#0E0600'; break;
          case 'T':        color = '#183018'; break;
          case '~':        color = '#1A4870'; break;
          case 'P':        color = '#2E1200'; break;
          case 'P_filled': color = '#A06830'; break;
          case 'd': case 'D': color = '#4A2E14'; break;
          default:         color = '#A87030';
        }
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x * sw), Math.floor(y * sh),
          Math.ceil(sw) + 1, Math.ceil(sh) + 1
        );
      }
    }

    // Rocks
    ctx.fillStyle = '#6A6A6A';
    for (const rk of state.rocks) {
      const [rx, ry] = rk.split(',').map(Number);
      ctx.fillRect(Math.floor(rx * sw), Math.floor(ry * sh), Math.ceil(sw), Math.ceil(sh));
    }

    // Player dot
    const [px, py] = state.pos;
    const ps = Math.max(2, Math.round(sw * 0.75));
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
      Math.floor(px * sw + sw / 2 - ps / 2),
      Math.floor(py * sh + sh / 2 - ps / 2),
      ps, ps
    );

    // Viewport rectangle
    if (!this._overviewMode) {
      ctx.strokeStyle = 'rgba(255, 210, 60, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(this._cam.x * sw) + 0.5,
        Math.round(this._cam.y * sh) + 0.5,
        Math.round(VIEWPORT_W * sw),
        Math.round(VIEWPORT_H * sh)
      );
    }
  }

  getRestartBtnRect() { return this._restartBtnRect || null; }
}

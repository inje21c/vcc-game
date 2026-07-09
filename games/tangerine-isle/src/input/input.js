// Keyboard + touch D-pad input
// dispatch(action) is called on each valid input

const REPEAT_DELAY = 180; // ms between held key repeats
const DPAD_IDLE_OPACITY = '0.55';
const DPAD_ACTIVE_OPACITY = '0.8';
const UI_BASE = new URL('../../assets/ui/', import.meta.url);

function uiUrl(id) {
  return new URL(`${id}.png`, UI_BASE).href;
}

export class InputHandler {
  constructor(dispatch) {
    this._dispatch = dispatch;
    this._held = null;
    this._repeatTimer = null;
    this._dpadRight = this._loadDockSide();
    this._activeChar = 'cat';

    this._setupKeyboard();
    this._dpad = null; // set by buildDpad()
  }

  _loadDockSide() {
    try {
      return localStorage.getItem('tangerine-isle:dpad-side') !== 'left';
    } catch {
      return true;
    }
  }

  _saveDockSide() {
    try {
      localStorage.setItem('tangerine-isle:dpad-side', this._dpadRight ? 'right' : 'left');
    } catch {
      // Storage is optional; the controls still work without persistence.
    }
  }

  _fire(action) {
    this._dispatch(action);
  }

  _startRepeat(action) {
    this._stopRepeat();
    this._held = action;
    this._fire(action);
    this._repeatTimer = setInterval(() => this._fire(this._held), REPEAT_DELAY);
  }

  _stopRepeat() {
    if (this._repeatTimer) {
      clearInterval(this._repeatTimer);
      this._repeatTimer = null;
    }
    this._held = null;
  }

  stopMovement() {
    this._stopRepeat();
  }

  _setupKeyboard() {
    const keyMap = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
      W: 'up', S: 'down', A: 'left', D: 'right',
    };
    const switchMap = { '1': 'cat', '2': 'rabbit', '3': 'turtle' };

    document.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (keyMap[e.key]) {
        this._startRepeat({ type: 'move', dir: keyMap[e.key] });
      } else if (switchMap[e.key]) {
        this._fire({ type: 'switch', char: switchMap[e.key] });
      } else if (e.key === 'r' || e.key === 'R') {
        this._fire({ type: 'restart' });
      }
    });

    document.addEventListener('keyup', e => {
      const keyMap2 = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
        W: 'up', S: 'down', A: 'left', D: 'right',
      };
      if (keyMap2[e.key] && this._held?.dir === keyMap2[e.key]) {
        this._stopRepeat();
      }
    });
  }

  buildDpad(container, canvasSize) {
    this._container = container;
    this._canvasSize = canvasSize;

    this._dpad?.remove();
    this._charWrap?.remove();
    this._dockToggle?.remove();

    const dpadSize = canvasSize * 0.30;
    const btnSize = dpadSize / 3;
    const margin = canvasSize * 0.02;

    const dpad = document.createElement('div');
    dpad.id = 'dpad';
    dpad.style.cssText = `
      position: absolute;
      width: ${dpadSize}px;
      height: ${dpadSize}px;
      bottom: ${margin}px;
      display: grid;
      grid-template-columns: repeat(3, ${btnSize}px);
      grid-template-rows: repeat(3, ${btnSize}px);
      opacity: ${DPAD_IDLE_OPACITY};
      touch-action: none;
      user-select: none;
    `;

    const dirs = [
      null, 'up', null,
      'left', null, 'right',
      null, 'down', null,
    ];
    const labels = { up: '▲', down: '▼', left: '◀', right: '▶' };

    const buttons = {};
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      const dir = dirs[i];
      if (dir) {
        cell.style.cssText = `
          background: rgba(255,255,255,0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${btnSize * 0.45}px;
          color: #fff;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        `;
        cell.textContent = labels[dir];
        cell.dataset.dir = dir;

        cell.addEventListener('pointerdown', e => {
          e.preventDefault();
          cell.style.opacity = '1';
          dpad.style.opacity = DPAD_ACTIVE_OPACITY;
          this._startRepeat({ type: 'move', dir });
        });

        cell.addEventListener('pointerup', () => {
          cell.style.opacity = '';
          dpad.style.opacity = DPAD_IDLE_OPACITY;
          this._stopRepeat();
        });

        cell.addEventListener('pointerleave', () => {
          cell.style.opacity = '';
          dpad.style.opacity = DPAD_IDLE_OPACITY;
          this._stopRepeat();
        });

        buttons[dir] = cell;
      }
      dpad.appendChild(cell);
    }

    this._dpad = dpad;
    this._dpadButtons = buttons;
    container.appendChild(dpad);

    // Build character switch buttons
    this._buildSwitchButtons(container, canvasSize, margin);

    // Dock toggle
    this._buildDockToggle(container, dpadSize, margin);
    this._applyDockLayout(margin, dpadSize);
  }

  resize(canvasSize) {
    if (!this._container) return;
    this.buildDpad(this._container, canvasSize);
  }

  _buildSwitchButtons(container, canvasSize, margin) {
    const chars = ['cat', 'rabbit', 'turtle'];
    const colors = { cat: '#E8A030', rabbit: '#A0785A', turtle: '#4A8A5A' };
    const labels = { cat: '라봉이', rabbit: '금향이', turtle: '청귤이' };
    const btnSize = canvasSize * 0.09;
    const gap = canvasSize * 0.01;

    const wrap = document.createElement('div');
    wrap.id = 'char-buttons';
    wrap.style.cssText = `
      position: absolute;
      bottom: ${margin}px;
      display: flex;
      flex-direction: column;
      gap: ${gap}px;
    `;

    this._switchBtns = {};
    for (const ch of chars) {
      const btn = document.createElement('div');
      btn.style.cssText = `
        width: ${btnSize}px;
        height: ${btnSize}px;
        border-radius: 50%;
        position: relative;
        background: ${colors[ch]};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-weight: bold;
        font-size: ${btnSize * 0.4}px;
        border: 3px solid transparent;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        touch-action: none;
        overflow: visible;
      `;
      btn.title = labels[ch];
      btn.setAttribute('aria-label', labels[ch]);
      btn.dataset.char = ch;

      const portrait = document.createElement('img');
      portrait.src = uiUrl(`ui_portrait_${ch}`);
      portrait.alt = '';
      portrait.style.cssText = `
        width: 112%;
        height: 112%;
        object-fit: contain;
        pointer-events: none;
        transform: translateY(4%);
      `;
      btn.appendChild(portrait);

      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        this._fire({ type: 'switch', char: ch });
      });
      this._switchBtns[ch] = btn;
      wrap.appendChild(btn);
    }

    container.appendChild(wrap);
    this._charWrap = wrap;
    this.highlightChar(this._activeChar);
  }

  _buildDockToggle(container, dpadSize, margin) {
    const btn = document.createElement('button');
    btn.textContent = '⇄';
    btn.style.cssText = `
      position: absolute;
      bottom: ${margin + dpadSize}px;
      background: rgba(255,255,255,0.3);
      border: none;
      color: #fff;
      font-size: 20px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
    `;
    btn.addEventListener('click', () => {
      this._dpadRight = !this._dpadRight;
      this._saveDockSide();
      this._applyDockLayout(margin, dpadSize);
    });
    container.appendChild(btn);
    this._dockToggle = btn;
  }

  _applyDockLayout(margin, dpadSize) {
    if (!this._dpad || !this._charWrap || !this._dockToggle) return;

    this._dpad.style.right = this._dpadRight ? `${margin}px` : 'auto';
    this._dpad.style.left = this._dpadRight ? 'auto' : `${margin}px`;

    this._dockToggle.style.right = this._dpadRight ? `${margin}px` : 'auto';
    this._dockToggle.style.left = this._dpadRight ? 'auto' : `${margin}px`;
    this._dockToggle.style.bottom = `${margin + dpadSize}px`;

    this._charWrap.style.left = this._dpadRight ? `${margin}px` : 'auto';
    this._charWrap.style.right = this._dpadRight ? 'auto' : `${margin}px`;
  }

  highlightChar(char) {
    this._activeChar = char;
    if (!this._switchBtns) return;
    for (const [ch, btn] of Object.entries(this._switchBtns)) {
      btn.style.border = ch === char ? '3px solid #fff' : '3px solid transparent';
    }
  }

  showSwitchBlocked(char, lockedChar) {
    const btn = this._switchBtns?.[char];
    const lockedBtn = this._switchBtns?.[lockedChar];
    if (!btn) return;

    btn.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' },
    ], { duration: 240, easing: 'ease-out' });

    if (lockedBtn) {
      lockedBtn.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.12)' },
        { transform: 'scale(1)' },
      ], { duration: 260, easing: 'ease-out' });
    }

    const marker = document.createElement('img');
    marker.src = uiUrl('ui_lock_forbidden');
    marker.alt = '';
    marker.style.cssText = `
      position: absolute;
      top: -16%;
      right: -16%;
      width: 46%;
      height: 46%;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2;
    `;
    btn.appendChild(marker);
    marker.animate([
      { opacity: 0, transform: 'scale(0.7)' },
      { opacity: 1, transform: 'scale(1.1)' },
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.9)' },
    ], { duration: 520, easing: 'ease-out' }).addEventListener('finish', () => marker.remove());
  }
}

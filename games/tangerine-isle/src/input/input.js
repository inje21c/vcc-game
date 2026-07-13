// Keyboard + static HTML D-pad/char-button input

const REPEAT_DELAY = 180;
const UI_BASE = new URL('../../assets/ui/', import.meta.url);

function uiUrl(id) {
  return new URL(`${id}.png`, UI_BASE).href;
}

export class InputHandler {
  constructor(dispatch) {
    this._dispatch = dispatch;
    this._held = null;
    this._repeatTimer = null;
    this._activeChar = 'cat';
    this._switchBtns = {};

    this._setupKeyboard();
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

  // Wire up the static D-pad buttons in index.html
  buildDpad() {
    // D-pad direction buttons
    document.querySelectorAll('[data-dir]').forEach(btn => {
      const dir = btn.dataset.dir;

      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        btn.classList.add('pressed');
        this._startRepeat({ type: 'move', dir });
      });

      const release = () => {
        btn.classList.remove('pressed');
        this._stopRepeat();
      };

      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
    });

    // Character switch buttons
    document.querySelectorAll('[data-char]').forEach(btn => {
      const char = btn.dataset.char;
      this._switchBtns[char] = btn;

      // Load portrait image
      const img = document.createElement('img');
      img.src = uiUrl(`ui_portrait_${char}`);
      img.alt = '';
      btn.appendChild(img);

      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        this._fire({ type: 'switch', char });
      });
    });

    this.highlightChar(this._activeChar);

    // Restart button
    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('pointerdown', e => {
        e.preventDefault();
        this._fire({ type: 'restart' });
      });
    }
  }

  highlightChar(char) {
    this._activeChar = char;
    for (const [ch, btn] of Object.entries(this._switchBtns)) {
      btn.classList.toggle('active', ch === char);
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
      top: -16%; right: -16%;
      width: 46%; height: 46%;
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

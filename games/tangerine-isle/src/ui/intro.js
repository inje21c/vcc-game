const DEFAULT_SCRIPT = [
  { char: 'cat',    name: '라봉이', text: '야, 여기 봐! 귤들이 온 섬에 흩어져 있어!' },
  { char: 'turtle', name: '청귤이', text: '이런... 혼자서는 다 모을 수 없을 것 같아.' },
  { char: 'rabbit', name: '금향이', text: '우리 셋이 힘을 합치면 못할 게 없잖아!' },
  { char: 'cat',    name: '라봉이', text: '각자의 특기로 헤쳐나가 보자!' },
];

function portraitSrc(char) {
  return `./assets/ui/ui_portrait_${char}.png`;
}

export function showIntro(onComplete, edition = {}) {
  const script = edition.introScript || DEFAULT_SCRIPT;
  const overlay    = document.getElementById('intro-overlay');
  const portraitEl = document.getElementById('intro-portrait');
  const nameEl     = document.getElementById('intro-name');
  const textEl     = document.getElementById('intro-text');

  let idx = 0;

  function show(i) {
    const line = script[i];
    portraitEl.src   = portraitSrc(line.char);
    nameEl.textContent = line.name;
    textEl.textContent = line.text;
  }

  function advance(e) {
    e.preventDefault();
    idx++;
    if (idx >= script.length) {
      overlay.removeEventListener('pointerdown', advance);
      overlay.addEventListener('transitionend', () => {
        overlay.style.display = 'none';
        onComplete();
      }, { once: true });
      overlay.classList.add('intro-fade-out');
    } else {
      show(idx);
    }
  }

  overlay.addEventListener('pointerdown', advance);
  show(0);
}

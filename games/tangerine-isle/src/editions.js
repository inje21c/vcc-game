const DEFAULT_INTRO = [
  { char: 'cat', name: '라봉이', text: '야, 여기 봐! 귤들이 온 섬에 흩어져 있어!' },
  { char: 'turtle', name: '청귤이', text: '이런... 혼자서는 다 모을 수 없을 것 같아.' },
  { char: 'rabbit', name: '금향이', text: '우리 셋이 힘을 합치면 못할 게 없잖아!' },
  { char: 'cat', name: '라봉이', text: '각자의 특기로 헤쳐나가 보자!' },
];

const SAMDASOO_INTRO = [
  { char: 'turtle', name: '물길 안내', text: '한라산 고지에 내린 빗방울 하나가 긴 여행을 시작합니다.' },
  { char: 'rabbit', name: '틈의 탐사자', text: '보이지 않는 지층의 틈을 찾아, 물길이 스며드는 길을 열어 주세요.' },
  { char: 'cat', name: '지층 조율자', text: '화산석과 관측 노드를 맞추면, 한 방울의 시간이 다음 층으로 이어집니다.' },
];

export const EDITIONS = {
  tangerine: {
    id: 'tangerine',
    title: '감귤섬 삼총사',
    titleParts: ['TANGERINE', ' ISLE'],
    documentTitle: '감귤섬 삼총사',
    stagePath: './src/data/stages.json',
    initialStageId: '1-1',
    introScript: DEFAULT_INTRO,
    labels: {
      key: 'KEY',
      lowHp: '귤 부족!',
      overview: '전체 보기  ·  탭하면 돌아가기',
      clearTitle: 'CLEAR!',
      clearNext: '다음 스테이지로...',
      clearButton: '다음 스테이지',
      retryButton: '다시 시작',
      gameover: 'GAME OVER',
    },
    colors: {
      bodyFrom: '#141A14',
      bodyTo: '#080C08',
    },
  },
  samdasoo: {
    id: 'samdasoo',
    title: '제주삼다수: 한 방울의 시간',
    titleParts: ['SAMDASOO', ' DROP'],
    documentTitle: '제주삼다수: 한 방울의 시간',
    stagePath: './src/data/samdasoo-stages.json',
    initialStageId: 'samdasoo-1',
    introScript: SAMDASOO_INTRO,
    labels: {
      key: '물길',
      lowHp: '탐사력 낮음',
      overview: '단면 보기  ·  탭하면 돌아가기',
      clearTitle: '물길 기록',
      clearNext: '기록 카드를 확인하고 다음 층으로',
      clearButton: '다음 물길',
      retryButton: '다시 탐사',
      gameover: '탐사 종료',
    },
    colors: {
      bodyFrom: '#0A3343',
      bodyTo: '#071015',
    },
  },
};

export function getEditionFromUrl(url = window.location.href) {
  const params = new URL(url).searchParams;
  return EDITIONS[params.get('edition')] || EDITIONS.tangerine;
}

export function applyEditionChrome(edition) {
  document.title = edition.documentTitle;

  const introTitle = document.querySelector('.intro-title');
  if (introTitle) introTitle.textContent = edition.title;

  const titleEl = document.getElementById('device-title');
  if (titleEl) {
    titleEl.innerHTML = `<span class="t1">${edition.titleParts[0]}</span><span class="t2">${edition.titleParts[1]}</span>`;
  }

  const keyLabel = document.querySelector('#key-display span');
  if (keyLabel) keyLabel.textContent = edition.labels.key;

  const warning = document.getElementById('hp-warning');
  if (warning) warning.textContent = edition.labels.lowHp;

  document.body.dataset.edition = edition.id;
  document.body.style.background = `radial-gradient(ellipse at center, ${edition.colors.bodyFrom} 0%, ${edition.colors.bodyTo} 100%)`;
}

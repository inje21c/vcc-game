const DPR = Math.min(window.devicePixelRatio || 1, 2);
const ROWS = 13;
const COLS = 8;
const ACTOR_MIN = -1;
const ACTOR_MAX = 10;
const SAVE_KEY = "help-me-heyda-2026-story-progress";
const POWER_SAVE_KEY = "help-me-heyda-2026-powers";
const HIGH_SCORE_KEY = "help-me-heyda-2026-high-scores";
const HIGH_SCORE_LIMIT = 10;
const INITIAL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const OBSTACLE_DEVELOPMENT = 99;
const CHAPTER1_BOSS = {
  stage: 6,
  name: "붉은 깃발의 감독관",
  hp: 3,
  firstDelay: 5000,
  interval: 20000,
  warningDuration: 5000,
  penaltyTime: 50,
  responseScore: 80,
  defeatBonusTime: 80
};

const storyChapters = [
  {
    label: "Chapter 1",
    title: "토템을 깨우는 길",
    stages: [1, 6],
    bossStage: null,
    boss: null,
    image: "assets/story1.png",
    text: "새벽 안개 속에서 오래된 토템들이 하나씩 깨어난다. 헤이다는 같은 문양 셋을 모으며 길의 리듬을 익히고, 숲의 첫 숨을 되찾기 시작한다."
  },
  {
    label: "Chapter 2",
    title: "이어지는 문양",
    stages: [7, 12],
    bossStage: null,
    boss: null,
    image: "assets/story2.png",
    text: "문양은 더 길게 이어지고, 아래 줄은 더 쉽게 흔들린다. 헤이다는 네 개와 다섯 개의 토템을 정확히 모으며 다음 수를 읽는 법을 배운다."
  },
  {
    label: "Chapter 3",
    title: "여섯 문양의 길",
    stages: [13, 18],
    bossStage: null,
    boss: null,
    image: "assets/story4.png",
    text: "이제 숲은 느린 손을 기다려주지 않는다. 헤이다는 여섯 개의 문양을 완성하며 실수를 줄이고, 콤보로 시간을 되찾아야 한다."
  },
  {
    label: "Chapter 4",
    title: "심화의 숲",
    stages: [19, 27],
    bossStage: null,
    boss: null,
    image: "assets/background-forest-2026.png",
    text: "깊은 숲에서는 여섯 문양의 규칙이 계속된다. 처음에는 차분히 새 배치를 읽고, 곧 불어오는 숲의 바람에 맞춰 계획을 고쳐야 한다."
  },
  {
    label: "Chapter 5",
    title: "흔들리는 길",
    stages: [28, 36],
    bossStage: null,
    boss: null,
    image: "assets/background-forest-2026.png",
    text: "마지막 길에서는 토템도, 시간도, 판단도 빠르게 움직인다. 경고를 읽고 흔들린 배치를 다시 세우는 사람만 숲의 끝에 닿을 수 있다."
  }
];

class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.next = 0;
    this.music = null;
    this.media = this.createMedia();
  }

  createMedia() {
    if (typeof Audio === "undefined") return {};
    const files = {
      titleBgm: ["assets/title_bgm.mp3", 0.36, true],
      menuBgm: ["assets/main_menu_bgm.mp3", 0.34, true],
      normalGameBgm: ["assets/nomal_game_bgm.mp3", 0.32, true],
      bossBgm: ["assets/bgm-chapter1-boss.mp3", 0.34, true],
      buttonClick: ["assets/button_click.mp3", 0.32, false],
      menuSelect: ["assets/menu_select.mp3", 0.34, false],
      push: ["assets/block_sliding.mp3", 0.36, false],
      clear: ["assets/block_matching.mp3", 0.36, false],
      stageClear: ["assets/nomal_stage_clear.mp3", 0.42, false],
      gameover: ["assets/game_over.mp3", 0.42, false],
      bossWarning: ["assets/sfx-boss-warning.mp3", 0.38, false],
      bossDefeat: ["assets/sfx-boss-defeat.mp3", 0.42, false]
    };
    return Object.fromEntries(Object.entries(files).map(([name, [src, volume, loop]]) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = volume;
      audio.loop = loop;
      return [name, audio];
    }));
  }

  unlock() {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
      this.next = this.ctx.currentTime;
      this.loop();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  loop() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    while (this.next < now + 0.6) {
      const step = Math.round(this.next * 2) % 8;
      this.tone(step % 4 ? 146.83 : 110, this.next, 0.4, "sine", 0.03);
      if (step === 7) this.tone(293.66, this.next + 0.1, 0.16, "triangle", 0.028);
      this.next += 0.5;
    }
    setTimeout(() => this.loop(), 180);
  }

  cue(name) {
    this.unlock();
    const mediaCue = {
      button: "buttonClick",
      menu: "menuSelect",
      push: "push",
      clear: "clear",
      stageClear: "stageClear",
      gameover: "gameover",
      bossWarning: "bossWarning",
      bossDefeat: "bossDefeat"
    }[name];
    if (mediaCue && this.playMedia(mediaCue)) return;
    if (!this.ctx) return;
    const cues = {
      start: [[392, 0, 0.1], [523, 0.08, 0.14], [784, 0.22, 0.18]],
      push: [[82, 0, 0.07], [165, 0.05, 0.08]],
      clear: [[523, 0, 0.08], [659, 0.08, 0.08], [880, 0.16, 0.16]],
      fail: [[139, 0, 0.16], [92, 0.13, 0.2]],
      menu: [[196, 0, 0.1], [294, 0.08, 0.12]],
      villain: [[73, 0, 0.12], [55, 0.1, 0.16]],
      bossWarning: [[220, 0, 0.05], [330, 0.06, 0.08], [110, 0.15, 0.11]],
      bossDefeat: [[392, 0, 0.07], [523, 0.08, 0.08], [659, 0.16, 0.1], [880, 0.26, 0.14]]
    };
    for (const [freq, delay, length] of cues[name] || cues.menu) {
      this.tone(freq, this.ctx.currentTime + delay, length, name === "push" ? "sawtooth" : "triangle", 0.055);
    }
  }

  playMedia(name) {
    const audio = this.media[name];
    if (!audio) return false;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  startMusic(name) {
    const audio = this.media[name];
    if (!audio || this.music === audio) return;
    this.stopMusic();
    this.music = audio;
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {
      this.music = null;
    }
  }

  stopMusic() {
    if (!this.music) return;
    this.music.pause();
    this.music.currentTime = 0;
    this.music = null;
  }

  stopEffects() {
    for (const audio of Object.values(this.media)) {
      if (audio.loop || audio === this.music) continue;
      audio.pause();
      audio.currentTime = 0;
    }
  }

  tone(freq, start, length, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + length + 0.03);
  }
}

class Game2026 {
  constructor() {
    this.app = document.querySelector(".app");
    this.canvas = document.querySelector("#scene");
    this.ctx = this.canvas.getContext("2d");
    this.sound = new Sound();
    this.screen = "intro";
    this.mode = "story";
    this.chapter = 0;
    this.chapterTargetStage = 1;
    this.stageFiles = [];
    this.stageCache = new Map();
    this.stage = 1;
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.stageResult = null;
    this.clearAdvanceAt = 0;
    this.hasActiveRun = false;
    this.resumeCountdownUntil = 0;
    this.board = this.emptyBoard();
    this.actorY = 10;
    this.pendingPush = null;
    this.actorPushUntil = 0;
    this.stoneFlag = 4;
    this.score = 0;
    this.combo = 0;
    this.stageStartScore = 0;
    this.stageBestCombo = 0;
    this.stageResult = null;
    this.rewardUnlocked = null;
    this.secretStageSequence = "";
    this.secretStageTapCount = 0;
    this.secretStageTapAt = 0;
    this.highScores = this.loadHighScores();
    this.nameEntry = null;
    this.nameEntryTouchAreas = [];
    this.mistakes = 0;
    this.storyLastChanceUsed = false;
    this.message = "Ready";
    this.storyTime = 900;
    this.storyTimeMax = 900;
    this.clearBlastUntil = 0;
    this.bossState = null;
    this.bossIntroUntil = 0;
    this.leafCleanseSelecting = false;
    this.leafCleanseUses = 0;
    this.debug = false;
    this.pointer = null;
    this.camera = { zoom: 1, target: 1, shake: 0 };
    this.particles = [];
    this.time = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 7200;
    this.survivalLevel = 1;
    this.lastRightAt = 0;
    this.nextShuffleAt = 0;
    this.shuffleConfig = null;
    this.shuffleWarningShown = false;
    this.sprites = {};
    this.cropCache = new Map();
    this.bind();
    this.resize();
    this.boot();
    this.show("intro");
    this.sound.startMusic("titleBgm");
    requestAnimationFrame((time) => this.tick(time));
  }

  async boot() {
    await Promise.all([this.loadSprites(), this.loadStages()]);
    this.handleDevShortcut();
  }

  async loadSprites() {
    const files = {
      hero: "assets/heyda-character-sheet-source.png",
      heroIdle: "assets/heyda-idle.png",
      heroPush: "assets/heyda-push.png",
      heroAction: "assets/heyda-action.png",
      guardian: "assets/totem-guardian.png",
      blockLeaf: "assets/block-leaf.png",
      blockSun: "assets/block-sun.png",
      blockWave: "assets/block-wave.png",
      blockMountain: "assets/block-mountain.png",
      blockFire: "assets/block-fire.png",
      blockCloud: "assets/block-cloud.png",
      blockMoon: "assets/block-moon.png",
      blockRain: "assets/block-rain.png",
      blockSnow: "assets/block-snow.png",
      blockWind: "assets/block-wind.png",
      background: "assets/background-forest-2026.png",
      clearScreen: "assets/clear-screen.png",
      gameOverScreen: "assets/gameover-screen.png",
      totems: "assets/totem-block-sheet-source.png",
      villain: "assets/asu.png",
      bulldozer: "assets/buldoder.png",
      tent: "assets/tent.png",
      bossFlagSupervisor: "assets/boss-flag-supervisor.png",
      bossRedFlag: "assets/boss-red-flag-marker.png",
      chapter1BossIntro: "assets/chapter1-boss-intro.png"
    };
    for (const [key, src] of Object.entries(files)) {
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const keepFullImage = key === "background" || key === "clearScreen" || key === "gameOverScreen" || key === "chapter1BossIntro";
      this.sprites[key] = keepFullImage ? img : this.stripBackground(img);
    }
  }

  stripBackground(img) {
    if (!img.complete || !img.naturalWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const r = pixels.data[i];
      const g = pixels.data[i + 1];
      const b = pixels.data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const isGreenKey = g > 150 && r < 105 && b < 135;
      const isCheckerKey = max > 218 && max - min < 18;
      if (isGreenKey || isCheckerKey) pixels.data[i + 3] = 0;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  async loadStages() {
    try {
      const res = await fetch("../../help-me-heyda/public/legacy/stages.json");
      const manifest = await res.json();
      this.stageFiles = manifest.files || [];
    } catch {
      this.stageFiles = [];
    }
  }

  async loadStage(number) {
    if (this.stageCache.has(number)) return this.cloneBoard(this.stageCache.get(number));
    if (this.stageFiles.length && number <= this.stageFiles.length) {
      const file = this.stageFiles[number - 1];
      try {
        const res = await fetch(`../../help-me-heyda/public/legacy/data/${file}`);
        if (!res.ok) throw new Error(`Stage ${number} load failed`);
        const text = await res.text();
        const board = text.trim().split(/\n/).map((line) => {
          const row = line.split(",").map((value) => this.normalizeBlock(Number.parseInt(value, 10) || 0, number));
          while (row.length < COLS) row.push(0);
          return row.slice(0, COLS);
        });
        while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
        const normalized = this.rebalanceLegacyStage(board.slice(0, ROWS), number);
        this.stageCache.set(number, this.cloneBoard(normalized));
        return this.cloneBoard(normalized);
      } catch {
        return this.fallbackStage();
      }
    }
    const board = this.generateStage(number);
    this.stageCache.set(number, this.cloneBoard(board));
    return this.cloneBoard(board);
  }

  bind() {
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("click", async (event) => {
      if (event.target.closest("[data-secret-stage-trigger]")) {
        await this.handleSecretStageTap();
      }
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      this.sound.unlock();
      this.sound.cue("button");
      await this.handle(action);
    });
    this.canvas.addEventListener("pointerdown", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer = this.screenToBoard(event.clientX - rect.left, event.clientY - rect.top);
      if (this.handleNameEntryTap(event.clientX - rect.left, event.clientY - rect.top)) return;
      if (this.handleResultTap(event.clientX - rect.left, event.clientY - rect.top)) return;
      if (this.gameOver) {
        this.openMenu();
        return;
      }
      if (this.leafCleanseSelecting) {
        if (this.pointer.row >= 0 && this.pointer.row <= 11) this.useLeafCleanse(this.pointer.row);
        return;
      }
      if (this.pointer.row >= 0 && this.pointer.row <= 11) this.tapRow(this.pointer.row - 1);
    });
    window.addEventListener("keydown", async (event) => {
      if (this.handleNameEntryKey(event)) return;
      if (await this.handleSecretStageKeys(event)) return;
      if (this.screen === "menu") {
        const menuMap = { ArrowUp: "story", ArrowRight: "survival", ArrowDown: "help", ArrowLeft: "option" };
        if (menuMap[event.code]) {
          event.preventDefault();
          return this.handle(menuMap[event.code]);
        }
      }
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "push", ArrowRight: "survival-rush-key", Space: "push", Enter: "push", KeyD: "debug", Escape: "pause-play" };
      if (!map[event.code]) return;
      event.preventDefault();
      await this.handle(map[event.code]);
    });
  }

  resize() {
    const rect = this.app.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);
    this.canvas.width = Math.floor(this.width * DPR);
    this.canvas.height = Math.floor(this.height * DPR);
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    this.metrics();
  }

  async handle(action) {
    if (action === "open-menu" || action === "menu") return this.openMenu();
    if (action === "pause-play") return this.openPause();
    if (action === "resume-play") return this.resumePlay();
    if (action === "story") return this.openStory();
    if (action === "continue-story") return this.startStory(this.getSavedStage());
    if (action === "restart-story") return this.restartStory();
    if (action === "survival") return this.openSurvivalIntro();
    if (action === "start-survival") return this.startSurvival();
    if (action === "help") return this.show("help");
    if (action === "option") return this.openSettings();
    if (action === "leaf-cleanse") return this.toggleLeafCleanse();
    if (action === "survival-rush") return this.survivalRush();
    if (action === "survival-rush-key") return this.handleSurvivalRushKey();
    if (action === "debug") return this.toggleDebug();
    if (action.startsWith("dev-stage-")) return this.startStory(Number.parseInt(action.replace("dev-stage-", ""), 10) || 1);
    if (action === "dev-clear") return this.showResultShortcut("clear");
    if (action === "dev-gameover") return this.showResultShortcut("gameover");
    if (action === "prev-chapter") return this.setChapter(Math.max(0, this.chapter - 1));
    if (action === "skip-story") return this.startStory(this.chapterTargetStage || this.getSavedStage());
    if (action === "start-chapter") return this.startStory(this.chapterTargetStage || this.getSavedStage());
    if (action === "next-chapter") {
      return this.setChapter(Math.min(this.maxUnlockedChapterIndex(), this.chapter + 1));
    }
    if (action === "move-up" || action === "up") return this.move(-1);
    if (action === "move-down" || action === "down") return this.move(1);
    if (action === "push") return this.push();
  }

  openMenu() {
    this.resumeCountdownUntil = 0;
    this.nameEntry = null;
    this.sound.stopEffects();
    this.sound.startMusic("menuBgm");
    this.sound.cue("menu");
    this.show("menu");
  }

  openStory() {
    if (this.canResumeStory()) {
      this.openPause("Story paused");
      return;
    }
    if (this.getSavedStage() > 1) {
      this.show("story-choice");
      return;
    }
    this.openChapterIntro(1);
  }

  restartStory() {
    this.resetProgress();
    this.score = 0;
    this.openChapterIntro(1);
  }

  openSurvivalIntro() {
    this.sound.cue("menu");
    this.show("survival-intro");
  }

  openPause(message = "Paused") {
    if (!this.hasActiveRun || this.gameOver || this.stageClear) return;
    this.resumeCountdownUntil = 0;
    this.message = message;
    this.sound.cue("menu");
    this.updateHud();
    this.show("pause");
  }

  resumePlay() {
    if (!this.hasActiveRun || this.gameOver || this.stageClear) return;
    this.resumeCountdownUntil = performance.now() + 3000;
    this.message = "Ready";
    this.sound.cue("start");
    this.show("play");
  }

  canResumeStory() {
    return this.hasActiveRun && this.mode === "story" && !this.stageClear && !this.gameOver;
  }

  openSettings() {
    this.sound.cue("menu");
    this.secretStageSequence = "";
    this.secretStageTapCount = 0;
    this.secretStageTapAt = 0;
    this.show("settings");
  }

  async handleSecretStageTap() {
    if (this.screen !== "settings") return;
    const now = performance.now();
    this.secretStageTapCount = now - this.secretStageTapAt > 1200 ? 1 : this.secretStageTapCount + 1;
    this.secretStageTapAt = now;
    if (this.secretStageTapCount >= 7) {
      this.secretStageTapCount = 0;
      await this.openSecretStagePrompt();
    }
  }

  async handleSecretStageKeys(event) {
    if (this.screen !== "settings" || event.ctrlKey || event.metaKey || event.altKey) return false;
    if (!event.key || event.key.length !== 1) return false;
    this.secretStageSequence = `${this.secretStageSequence}${event.key.toLowerCase()}`.slice(-5);
    if (this.secretStageSequence !== "heyda") return false;
    event.preventDefault();
    this.secretStageSequence = "";
    await this.openSecretStagePrompt();
    return true;
  }

  async openSecretStagePrompt() {
    this.sound.unlock();
    this.sound.cue("menu");
    const rawStage = window.prompt(`스테이지 번호를 입력하세요. 1-${this.getTotalStages()}`);
    if (rawStage === null) return;
    const stage = Number.parseInt(rawStage, 10);
    if (!Number.isFinite(stage)) return;
    await this.startStory(Math.max(1, Math.min(this.getTotalStages(), stage)));
  }

  async handleDevShortcut() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("dev")) return;
    const stage = Number.parseInt(params.get("stage"), 10);
    const result = params.get("result");
    if (Number.isFinite(stage)) {
      await this.startStory(stage);
      return;
    }
    if (result === "clear" || result === "gameover" || result === "ending") {
      await this.showResultShortcut(result);
      return;
    }
    this.openSettings();
  }

  async showResultShortcut(type) {
    await this.startStory(this.getSavedStage());
    if (type === "gameover") {
      this.endGame("Game Over: 테스트 화면");
      return;
    }
    this.stageClear = true;
    this.hasActiveRun = false;
    this.resumeCountdownUntil = 0;
    this.resultState = type === "ending" ? "ending" : "clear";
    this.stageBestCombo = Math.max(this.stageBestCombo, 2);
    this.stageResult = {
      stage: this.stage,
      boardScore: 1200,
      clearBonus: 800,
      timeLeft: this.storySecondsLeft(),
      timeBonus: this.storySecondsLeft() * 50,
      bestCombo: this.stageBestCombo,
      comboBonus: this.stageBestCombo * 100,
      stageScore: 2000 + this.storySecondsLeft() * 50 + this.stageBestCombo * 100,
      totalScore: this.score + 2000 + this.storySecondsLeft() * 50 + this.stageBestCombo * 100
    };
    this.message = type === "ending" ? "Ending Test" : "Clear Test";
    this.sound.cue("stageClear");
  }

  setChapter(index) {
    this.chapter = Math.max(0, Math.min(this.maxUnlockedChapterIndex(), index));
    const chapter = storyChapters[this.chapter];
    this.chapterTargetStage = chapter.stages[0];
    this.renderChapter(chapter);
    this.sound.cue("menu");
  }

  openChapterIntro(stage) {
    this.hasActiveRun = false;
    this.resumeCountdownUntil = 0;
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.clearBlastUntil = 0;
    this.bossState = null;
    this.bossIntroUntil = 0;
    this.leafCleanseSelecting = false;
    this.leafCleanseUses = 0;
    this.sound.stopEffects();
    this.sound.stopMusic();
    const index = this.chapterIndexForStage(stage);
    this.chapter = index;
    this.chapterTargetStage = Math.max(1, Math.min(this.getTotalStages(), stage));
    this.renderChapter(storyChapters[index]);
    this.sound.cue("menu");
    this.show("story");
  }

  renderChapter(chapter) {
    const [start, end] = chapter.stages;
    const targetStage = this.chapterTargetStage || start;
    const bossText = chapter.bossStage ? ` / Boss ${chapter.bossStage}: ${chapter.boss}` : "";
    const kicker = `${chapter.label} / Stage ${start}-${end}${bossText}`;
    document.querySelector("#chapterKicker").textContent = kicker;
    document.querySelector("#chapterTitle").textContent = chapter.title;
    document.querySelector("#chapterText").textContent = `${chapter.text}\nStage ${targetStage}부터 시작합니다.`;
    const chapterImage = document.querySelector("#chapterImage");
    if (chapterImage) chapterImage.src = chapter.image;
    const prevButton = document.querySelector('[data-action="prev-chapter"]');
    const nextButton = document.querySelector('[data-action="next-chapter"]');
    if (prevButton) prevButton.disabled = this.chapter <= 0;
    if (nextButton) nextButton.disabled = this.chapter >= this.maxUnlockedChapterIndex();
  }

  chapterIndexForStage(stage) {
    const index = storyChapters.findIndex((chapter) => stage >= chapter.stages[0] && stage <= chapter.stages[1]);
    return index >= 0 ? index : storyChapters.length - 1;
  }

  chapterForStage(stage) {
    return storyChapters[this.chapterIndexForStage(stage)];
  }

  maxUnlockedChapterIndex() {
    return this.chapterIndexForStage(this.getSavedStage());
  }

  createBossState() {
    return null; // 보스전 v2.0 이월
  }

  show(name) {
    this.screen = name;
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
    this.app.classList.toggle("is-playing", name === "play");
    this.app.classList.toggle("is-survival", name === "play" && this.mode === "survival");
    this.app.classList.toggle("has-result", Boolean(this.resultState));
    this.updatePowerControls();
  }

  async startStory(stage) {
    this.hasActiveRun = true;
    this.resumeCountdownUntil = 0;
    this.mode = "story";
    this.stage = stage;
    this.chapter = this.chapterIndexForStage(stage);
    this.chapterTargetStage = stage;
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.nameEntry = null;
    this.rewardUnlocked = null;
    this.clearAdvanceAt = 0;
    this.board = await this.loadStage(stage);
    this.applyStageObstacles(stage);
    this.actorY = 10;
    this.pendingPush = null;
    this.stoneFlag = this.storyStoneFlag(stage);
    this.sound.stopEffects();
    this.bossState = this.createBossState(stage);
    this.bossIntroUntil = this.bossState ? performance.now() + 2400 : 0;
    this.leafCleanseSelecting = false;
    this.leafCleanseUses = this.leafCleanseUnlocked() && stage >= 7 ? 1 : 0;
    this.storyTimeMax = this.stageTime(stage);
    this.storyTime = this.storyTimeMax;
    this.clearBlastUntil = 0;
    if (stage === 1) this.score = 0;
    this.stageStartScore = this.score;
    this.stageBestCombo = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.storyLastChanceUsed = false;
    this.initShuffle(stage);
    this.message = this.startMessageForStage(stage);
    this.pulse(1.08, 0);
    this.sound.cue("start");
    this.sound.startMusic("normalGameBgm");
    this.updateHud();
    this.show("play");
  }

  async startSurvival() {
    this.hasActiveRun = true;
    this.resumeCountdownUntil = 0;
    this.mode = "survival";
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.nameEntry = null;
    this.rewardUnlocked = null;
    this.clearAdvanceAt = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 7600;
    this.survivalLevel = 1;
    this.lastRightAt = 0;
    this.board = this.emptyBoard();
    for (let row = 9; row <= 11; row += 1) {
      for (let col = 0; col < 5; col += 1) this.board[row][col] = this.randomSurvivalBlock();
    }
    this.actorY = 10;
    this.pendingPush = null;
    this.bossState = null;
    this.bossIntroUntil = 0;
    this.leafCleanseSelecting = false;
    this.leafCleanseUses = 0;
    this.sound.stopEffects();
    this.stoneFlag = 0;
    this.storyTime = 0;
    this.clearBlastUntil = 0;
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.message = "같은 토템 4개 이상을 모으세요";
    this.pulse(1.08, 0);
    this.sound.cue("start");
    this.sound.stopMusic();
    this.updateHud();
    this.show("play");
  }

  toggleDebug() {
    this.debug = !this.debug;
    this.message = this.debug ? "좌표 표시 ON" : "좌표 표시 OFF";
  }

  emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  fallbackStage() {
    const board = this.emptyBoard();
    for (let row = 1; row < 10; row += 1) {
      for (let col = 0; col < 5; col += 1) if ((row + col) % 3) board[row][col] = ((row + col) % 5) + 1;
    }
    return board;
  }

  rebalanceLegacyStage(board, stage) {
    if (stage !== 18) return board;
    void board;
    return this.stage18MasteryBoard();
  }

  stage18MasteryBoard() {
    const board = this.emptyBoard();
    const rowCounts = [4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6];
    const pool = [];
    for (let type = 1; type <= 5; type += 1) {
      for (let i = 0; i < 12; i += 1) pool.push(type);
    }
    this.seededShuffle(pool, 1801);

    let index = 0;
    for (let i = 0; i < rowCounts.length; i += 1) {
      const row = i + 1;
      for (let col = 0; col < rowCounts[i]; col += 1) {
        board[row][col] = pool[index];
        index += 1;
      }
    }
    return board;
  }

  seededShuffle(values, seed) {
    let state = seed >>> 0;
    const next = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
    for (let i = values.length - 1; i > 0; i -= 1) {
      const j = Math.floor(next() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  generateStage(number) {
    const board = this.emptyBoard();
    const blockTypes = this.availableBlockCount(number);
    const profile = this.stageDifficultyProfile(number);
    const filledRows = profile.filledRows;
    const numTypes = Math.min(blockTypes, profile.types);
    const totalClears = Math.max(numTypes, profile.clears);
    const totalBlocks = totalClears * 6; // 반드시 6의 배수 → 잔여 블록 0 보장

    // ── 랜덤 타입 선택 ───────────────────────────────
    const available = Array.from({ length: blockTypes }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, numTypes);

    // ── 타입별 클리어 배분 (라운드로빈 → 각 타입 6의 배수) ──
    const clearsPerType = Array(numTypes).fill(0);
    for (let i = 0; i < totalClears; i += 1) clearsPerType[i % numTypes] += 1;

    // ── 블록 풀 생성 및 셔플 ─────────────────────────
    const pool = [];
    for (let i = 0; i < numTypes; i += 1) {
      for (let c = 0; c < clearsPerType[i] * 6; c += 1) pool.push(available[i]);
    }
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // ── 행별 블록 수 계산 (합 = totalBlocks, 중력 원칙) ──
    const startRow = ROWS - 1 - filledRows;
    const counts = this.distributeStageBlocks(totalBlocks, filledRows);

    // ── 보드에 배치 ──────────────────────────────────
    let poolIdx = 0;
    for (let i = 0; i < filledRows; i += 1) {
      const row = startRow + i;
      for (let col = 0; col < counts[i]; col += 1) {
        board[row][col] = pool[poolIdx];
        poolIdx += 1;
      }
    }
    return board;
  }

  stageDifficultyProfile(stage) {
    if (stage <= 24) {
      const t = (stage - 19) / 5;
      return {
        filledRows: Math.round(7 + t),
        types: Math.round(4 + t),
        clears: Math.round(8 + t)
      };
    }
    if (stage <= 30) {
      const t = (stage - 25) / 5;
      return {
        filledRows: Math.round(8 + t * 2),
        types: Math.round(5 + t),
        clears: Math.round(9 + t * 2)
      };
    }
    const t = Math.min(1, (stage - 31) / 5);
    return {
      filledRows: Math.round(10 + t),
      types: Math.round(6 + t),
      clears: Math.round(11 + t)
    };
  }

  distributeStageBlocks(totalBlocks, filledRows) {
    const maxPerRow = COLS - 1;
    const counts = Array(filledRows).fill(Math.floor(totalBlocks / filledRows));
    let remaining = totalBlocks - counts.reduce((sum, value) => sum + value, 0);
    for (let i = counts.length - 1; remaining > 0 && i >= 0; i -= 1) {
      const room = maxPerRow - counts[i];
      if (room <= 0) continue;
      const add = Math.min(room, remaining);
      counts[i] += add;
      remaining -= add;
    }
    counts.sort((a, b) => a - b);
    return counts;
  }

  randomBlock(limit = this.availableBlockCount(this.stage)) {
    return Math.floor(Math.random() * limit) + 1;
  }

  normalizeBlock(value, stage = this.stage) {
    if (!value) return 0;
    return ((value - 1) % this.availableBlockCount(stage)) + 1;
  }

  availableBlockCount(stage) {
    // 1-18: 레거시 데이터 원본값 유지
    if (stage <= 4) return 3;
    if (stage <= 7) return 4;
    if (stage <= 10) return 5;
    if (stage <= 13) return 6;
    if (stage <= 15) return 7;
    if (stage <= 17) return 8;
    if (stage <= 18) return 9;
    // 19-36: Chapter 4-5, 팔레트가 6종→9종으로 다시 확장
    if (stage <= 24) return 6;
    if (stage <= 30) return 7;
    if (stage <= 35) return 8;
    return 9;
  }

  storyStoneFlag(stage) {
    if (stage <= 6) return 4;
    if (stage <= 9) return 3;
    if (stage <= 13) return 2;
    return 1;
  }

  stageTime(stage) {
    const times = [1000, 990, 980, 960, 940, 920, 900, 880, 860, 850, 830, 810, 790, 770, 750, 730, 710, 700];
    if (stage <= times.length) return times[stage - 1];
    if (stage <= 24) return 760 - (stage - 19) * 8;   // 76s → 72s
    if (stage <= 30) return 700 - (stage - 25) * 8;   // 70s → 66s
    return Math.max(560, 640 - (stage - 31) * 16);    // 64s → 56s
  }

  // ── 블록 셔플 메커니즘 ─────────────────────────────────────────
  // stage 19+: 주기적으로 보드 내 블록 위치를 랜덤으로 교환
  // 높은 스테이지일수록 교환 빈도↑, 교환 개수↑, 시간↓

  getShuffleConfig(stage) {
    if (stage < 25) return null;
    if (stage <= 30) {
      const t = (stage - 25) / 5;
      return {
        interval: Math.round((25 - t * 5) * 1000),
        count: 1 + Math.round(t),
        warningMs: 3000
      };
    }
    const t = Math.min(1, (stage - 31) / 5);
    return {
      interval: Math.round((18 - t * 6) * 1000),
      count: stage >= 36 ? 5 : 2 + Math.round(t * 2),
      warningMs: 3000
    };
  }

  initShuffle(stage) {
    this.shuffleConfig = this.getShuffleConfig(stage);
    this.nextShuffleAt = this.shuffleConfig ? performance.now() + this.shuffleConfig.interval : 0;
    this.shuffleWarningShown = false;
  }

  updateShuffle(now) {
    if (!this.shuffleConfig || !this.nextShuffleAt) return;
    if (!this.shuffleWarningShown && this.nextShuffleAt - now <= this.shuffleConfig.warningMs) {
      this.shuffleWarningShown = true;
      this.message = "숲의 바람이 토템을 흔듭니다";
      this.pulse(1.04, 1.5);
      this.camera.shake = 2;
      return;
    }
    if (now < this.nextShuffleAt) return;
    // 보드(row 0-11)에서 비어있지 않은 블록 위치 수집
    const positions = [];
    for (let row = 0; row <= 11; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col] && this.board[row][col] !== OBSTACLE_DEVELOPMENT) {
          positions.push([row, col]);
        }
      }
    }
    // N쌍 랜덤 교환
    const swapCount = Math.min(this.shuffleConfig.count, Math.floor(positions.length / 2));
    for (let i = 0; i < swapCount; i += 1) {
      if (positions.length < 2) break;
      const ai = Math.floor(Math.random() * positions.length);
      const [ar, ac] = positions.splice(ai, 1)[0];
      const bi = Math.floor(Math.random() * positions.length);
      const [br, bc] = positions.splice(bi, 1)[0];
      [this.board[ar][ac], this.board[br][bc]] = [this.board[br][bc], this.board[ar][ac]];
    }
    this.nextShuffleAt = performance.now() + this.shuffleConfig.interval;
    this.shuffleWarningShown = false;
    this.message = swapCount > 1 ? `토템이 뒤섞였다 (${swapCount}곳)` : "토템이 뒤섞였다";
    this.pulse(1.08, 3);
    this.camera.shake = 5;
  }
  // ──────────────────────────────────────────────────────────────

  getTotalStages() {
    return 36;
  }

  getSavedStage() {
    try {
      const saved = Number.parseInt(localStorage.getItem(SAVE_KEY), 10);
      if (Number.isFinite(saved)) return Math.max(1, Math.min(this.getTotalStages(), saved));
    } catch {
      return 1;
    }
    return 1;
  }

  saveProgress(stage) {
    try {
      const current = this.getSavedStage();
      localStorage.setItem(SAVE_KEY, String(Math.max(current, Math.min(this.getTotalStages(), stage))));
    } catch {
      // Storage may be unavailable in private browsing or locked-down webviews.
    }
  }

  resetProgress() {
    try {
      localStorage.setItem(SAVE_KEY, "1");
      localStorage.removeItem(POWER_SAVE_KEY);
    } catch {
      // Storage may be unavailable in private browsing or locked-down webviews.
    }
  }

  loadHighScores() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => ({
          initials: String(entry.initials || "AAA").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "A"),
          score: Number.parseInt(entry.score, 10) || 0,
          stage: Number.parseInt(entry.stage, 10) || 1,
          mode: entry.mode === "survival" ? "survival" : "story",
          date: String(entry.date || "")
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, HIGH_SCORE_LIMIT * 2);
    } catch {
      return [];
    }
  }

  saveHighScores() {
    try {
      localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(this.highScores));
    } catch {
      // Local storage can be unavailable in private browsing.
    }
  }

  highScoresForMode(mode = this.mode) {
    return this.highScores
      .filter((entry) => entry.mode === mode)
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGH_SCORE_LIMIT);
  }

  qualifiesForHighScore(score, mode = this.mode) {
    if (score <= 0) return false;
    const scores = this.highScoresForMode(mode);
    return scores.length < HIGH_SCORE_LIMIT || score > scores[scores.length - 1].score;
  }

  prepareNameEntry() {
    if (!this.qualifiesForHighScore(this.score, this.mode)) {
      this.nameEntry = null;
      return;
    }
    this.nameEntry = {
      initials: ["A", "A", "A"],
      selected: 0,
      mode: this.mode,
      score: this.score,
      stage: this.stage
    };
  }

  handleNameEntryKey(event) {
    if (!this.nameEntry) return false;
    const { code, key } = event;
    event.preventDefault();
    if (code === "ArrowLeft") {
      this.nameEntry.selected = Math.max(0, this.nameEntry.selected - 1);
      this.sound.cue("menu");
      return true;
    }
    if (code === "ArrowRight" || code === "Space") {
      this.nameEntry.selected = Math.min(2, this.nameEntry.selected + 1);
      this.sound.cue("menu");
      return true;
    }
    if (code === "ArrowUp" || code === "ArrowDown") {
      const delta = code === "ArrowUp" ? 1 : -1;
      this.changeNameEntryLetter(delta);
      return true;
    }
    if (code === "Enter") {
      this.commitNameEntry();
      return true;
    }
    if (/^[a-z]$/i.test(key)) {
      this.nameEntry.initials[this.nameEntry.selected] = key.toUpperCase();
      this.nameEntry.selected = Math.min(2, this.nameEntry.selected + 1);
      this.sound.cue("menu");
      return true;
    }
    return true;
  }

  changeNameEntryLetter(delta) {
    if (!this.nameEntry) return;
    const current = INITIAL_LETTERS.indexOf(this.nameEntry.initials[this.nameEntry.selected]);
    const next = (current + delta + INITIAL_LETTERS.length) % INITIAL_LETTERS.length;
    this.nameEntry.initials[this.nameEntry.selected] = INITIAL_LETTERS[next];
    this.sound.cue("menu");
  }

  commitNameEntry() {
    if (!this.nameEntry) return;
    const entry = {
      initials: this.nameEntry.initials.join(""),
      score: this.nameEntry.score,
      stage: this.nameEntry.stage,
      mode: this.nameEntry.mode,
      date: new Date().toISOString()
    };
    const others = this.highScores.filter((score) => score.mode !== entry.mode);
    const modeScores = [...this.highScoresForMode(entry.mode), entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGH_SCORE_LIMIT);
    this.highScores = [...others, ...modeScores];
    this.saveHighScores();
    this.nameEntry = null;
    this.nameEntryTouchAreas = [];
    this.sound.cue("stageClear");
  }

  handleNameEntryTap(x, y) {
    if (!this.nameEntry) return false;
    const hit = this.nameEntryTouchAreas.find((area) => x >= area.x && x <= area.x + area.w && y >= area.y && y <= area.y + area.h);
    if (!hit) return true;
    if (hit.type === "letter") {
      this.nameEntry.selected = hit.index;
      this.changeNameEntryLetter(1);
      return true;
    }
    if (hit.type === "save") {
      this.commitNameEntry();
      return true;
    }
    return true;
  }

  leafCleanseUnlocked() {
    return false; // 정화 스킬 v2.0 이월
  }

  unlockLeafCleanse() {
    try {
      localStorage.setItem(POWER_SAVE_KEY, "leafCleanse");
    } catch {
      // Storage may be unavailable in private browsing or locked-down webviews.
    }
  }

  startMessageForStage(stage) {
    return this.bossState ? `Boss Stage ${stage}: ${this.bossState.name}` : `${this.chapterForStage(stage).label} / Stage ${stage}: 줄 터치 이동, 같은 줄 다시 터치 Push`;
  }

  applyStageObstacles(stage) {
    // Keep Chapter 2 playable while the obstacle rules are redesigned.
    // Development-mark blocks need a fuller stage/balance pass before they can
    // safely affect clear conditions.
    void stage;
  }

  toggleLeafCleanse() {
    if (!this.canUseLeafCleanse()) {
      this.leafCleanseSelecting = false;
      this.message = this.leafCleanseUnlocked() ? "잎의 정화를 사용할 수 없습니다" : "잎 토템은 아직 잠들어 있습니다";
      this.sound.cue("fail");
      this.updatePowerControls();
      return;
    }
    this.leafCleanseSelecting = !this.leafCleanseSelecting;
    this.message = this.leafCleanseSelecting ? "정화할 줄을 선택하세요" : "잎의 정화 취소";
    this.sound.cue("menu");
    this.updatePowerControls();
  }

  canUseLeafCleanse() {
    return this.screen === "play"
      && this.mode === "story"
      && this.stage >= 7
      && this.leafCleanseUnlocked()
      && this.leafCleanseUses > 0
      && !this.stageClear
      && !this.gameOver
      && !this.pendingPush
      && !this.isCountingDown();
  }

  useLeafCleanse(row) {
    if (!this.canUseLeafCleanse()) {
      this.leafCleanseSelecting = false;
      this.updatePowerControls();
      return;
    }
    const col = this.firstCleanseTarget(row);
    if (col < 0) {
      this.message = "정화할 대상이 없습니다";
      this.sound.cue("fail");
      this.updatePowerControls();
      return;
    }
    const value = this.board[row][col];
    this.board[row][col] = 0;
    this.leafCleanseUses -= 1;
    this.leafCleanseSelecting = false;
    this.score += value === OBSTACLE_DEVELOPMENT ? 120 : 40;
    const point = this.boardToScreen(row, col);
    this.burst(point.x, point.y, "#79ddbf", value === OBSTACLE_DEVELOPMENT ? 28 : 16);
    this.message = value === OBSTACLE_DEVELOPMENT ? "개발의 흔적 정화 +120" : "앞 토템 정화 +40";
    this.sound.cue("clear");
    this.settleOneStep();
    this.checkStageClear();
    this.updateHud();
    this.updatePowerControls();
  }

  firstCleanseTarget(row) {
    if (!this.board[row]) return -1;
    return this.board[row].findIndex(Boolean);
  }

  updatePowerControls() {
    const available = this.screen === "play" && this.mode === "story" && this.stage >= 7 && this.leafCleanseUnlocked();
    this.app.classList.toggle("has-leaf-power", available);
    this.app.classList.toggle("is-cleansing", this.leafCleanseSelecting);
    const button = document.querySelector('[data-action="leaf-cleanse"]');
    const count = document.querySelector("#leafPowerCount");
    if (button) button.disabled = !this.canUseLeafCleanse();
    if (count) count.textContent = String(Math.max(0, this.leafCleanseUses));
  }

  tapRow(row) {
    if (this.screen !== "play" || this.isCountingDown() || this.pendingPush || this.stageClear || this.gameOver) return;
    const nextY = Math.max(ACTOR_MIN, Math.min(ACTOR_MAX, row));
    if (nextY === this.actorY) {
      this.push();
      return;
    }
    this.actorY = nextY;
    this.message = `${this.rowLabel(this.actorY + 1)}: 한 번 더 터치하면 Push`;
    this.pulse(1.02, 0);
  }

  selectRow(row) {
    if (this.screen !== "play" || this.isCountingDown() || this.pendingPush || this.stageClear || this.gameOver) return;
    this.actorY = Math.max(ACTOR_MIN, Math.min(ACTOR_MAX, row));
    this.pulse(1.02, 0);
  }

  move(delta) {
    this.selectRow(this.actorY + delta);
  }

  handleSurvivalRushKey() {
    if (this.screen !== "play" || this.mode !== "survival" || this.gameOver || this.pendingPush || this.isCountingDown()) return false;
    const now = performance.now();
    if (now - this.lastRightAt <= 320) {
      this.lastRightAt = 0;
      this.survivalRush();
      return true;
    }
    this.lastRightAt = now;
    this.message = "→ 한 번 더 누르면 Rush";
    return false;
  }

  push() {
    if (this.stageClear || this.gameOver) {
      return;
    }
    if (this.screen !== "play" || this.isCountingDown() || this.pendingPush) return;
    const row = this.actorY + 1;
    const block = this.board[row][0];
    if (!block) {
      this.message = "이 줄에는 밀 블록이 없습니다";
      this.sound.cue("fail");
      return;
    }
    if (block === OBSTACLE_DEVELOPMENT) {
      this.message = "개발의 흔적이 길을 막고 있습니다";
      this.sound.cue("fail");
      this.pulse(1.04, 2);
      return;
    }
    for (let col = 0; col < COLS - 1; col += 1) this.board[row][col] = this.board[row][col + 1];
    this.board[row][COLS - 1] = 0;
    this.pendingPush = { block, row, start: performance.now(), duration: 280 };
    this.actorPushUntil = performance.now() + 190;
    this.message = `${this.rowLabel(row)} 토템 밀기`;
    this.resolveBossWarning(row);
    const point = this.boardToScreen(row, 0);
    this.burst(point.x, point.y, this.color(block), 12);
    this.pulse(1.1, 2.5);
    this.sound.cue("push");
  }

  finishPush(now) {
    if (!this.pendingPush || now - this.pendingPush.start < this.pendingPush.duration) return;
    const { block } = this.pendingPush;
    this.pendingPush = null;
    this.addBottomBlock(block);
    const bottomHandledRise = this.checkBottom();
    if (this.mode === "story") this.settleOneStep();
    else if (!bottomHandledRise) this.settlePlayfield();
    this.updateHud();
  }

  addBottomBlock(block) {
    const lastCol = this.mode === "story" ? 6 - this.stoneFlag : 6;
    for (let col = lastCol; col >= 0; col -= 1) {
      if (!this.board[12][col]) {
        this.board[12][col] = block;
        const p = this.boardToScreen(12, col);
        this.burst(p.x, p.y, this.color(block), 16);
        return;
      }
    }
    if (this.mode === "survival") {
      this.handleSurvivalOverflow(block);
      return;
    }
    if (!this.shiftUp()) return;
    this.board[12][lastCol] = block;
  }

  checkBottom() {
    if (this.mode === "story") return this.checkStoryBottom();
    return this.checkSurvivalBottom();
  }

  checkStoryBottom() {
    const lastCol = 6 - this.stoneFlag;
    const values = this.board[12].slice(0, lastCol + 1).filter(Boolean);
    if (values.length <= lastCol) return;
    if (values.every((v) => v === values[0])) {
      for (let col = 0; col <= lastCol; col += 1) this.board[12][col] = 0;
      this.combo += 1;
      this.stageBestCombo = Math.max(this.stageBestCombo, this.combo);
      this.score += 120 * this.combo;
      const bonus = this.pushBackBulldozer();
      this.message = this.combo > 1 ? `콤보 ${this.combo} +${bonus}s` : `바닥 클리어 +${bonus}s`;
      this.hitBoss();
      this.pulse(1.18, 1);
      this.sound.cue("clear");
      this.checkStageClear();
    } else {
      this.handleStoryMismatch();
    }
  }

  handleStoryMismatch() {
    this.combo = 0;
    this.mistakes += 1;
    if (this.canUseStoryLastChance()) {
      this.storyLastChanceUsed = true;
      const lastCol = 6 - this.stoneFlag;
      for (let col = 0; col <= lastCol; col += 1) this.board[12][col] = 0;
      this.storyTime = Math.max(0, this.storyTime - 60);
      this.message = "위기 회피: 바닥을 비우고 -6s";
      this.pulse(1.08, 4);
      this.camera.shake = 6;
      this.sound.cue("fail");
      this.updateHud();
      return;
    }
    this.message = "문양 불일치";
    this.shiftUp();
    this.sound.cue("fail");
  }

  canUseStoryLastChance() {
    return this.mode === "story"
      && this.stage >= 13
      && !this.storyLastChanceUsed
      && this.board[0].some(Boolean);
  }

  checkStageClear() {
    if (this.mode !== "story") return;
    for (let row = 0; row <= 11; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col]) return;
      }
    }
    if (this.board[12].some(Boolean)) return;
    this.stageClear = true;
    this.hasActiveRun = false;
    this.resumeCountdownUntil = 0;
    this.sound.stopMusic();
    this.resultState = this.isFinalStage() ? "ending" : "clear";
    this.clearAdvanceAt = 0;
    const boardScore = this.score - this.stageStartScore;
    const clearBonus = Math.max(300, 1000 - this.mistakes * 80);
    const timeLeft = this.storySecondsLeft();
    const timeBonus = timeLeft * 50;
    const comboBonus = this.stageBestCombo * 100;
    const stageScore = boardScore + clearBonus + timeBonus + comboBonus;
    this.score += clearBonus + timeBonus + comboBonus;
    this.stageResult = {
      stage: this.stage,
      boardScore,
      clearBonus,
      timeLeft,
      timeBonus,
      bestCombo: this.stageBestCombo,
      comboBonus,
      stageScore,
      totalScore: this.score
    };
    this.saveProgress(this.isFinalStage() ? this.stage : this.stage + 1);
    this.message = this.resultState === "ending" ? "Ending: 마을의 길이 지켜졌습니다" : `Stage ${this.stage} Clear!`;
    this.clearBlastUntil = performance.now() + 1600;
    this.burst(this.width * 0.76, 128, "#f7c15f", 42);
    this.pulse(1.2, 1);
    this.sound.cue("stageClear");
  }

  updateBoss(now) {
    const boss = this.bossState;
    if (!boss?.active || boss.defeated || this.mode !== "story") return;
    if (boss.warningRow !== null) {
      if (now < boss.warningUntil) return;
      this.storyTime = Math.max(0, this.storyTime - CHAPTER1_BOSS.penaltyTime);
      const row = boss.warningRow;
      boss.warningRow = null;
      boss.warningStartedAt = 0;
      boss.warningUntil = 0;
      boss.nextAttackAt = now + CHAPTER1_BOSS.interval;
      this.message = `${this.rowLabel(row)} 개발 구역 확정 -5s`;
      this.pulse(1.08, 4);
      this.sound.cue("fail");
      this.updateHud();
      return;
    }
    if (now < boss.nextAttackAt) return;
    const row = this.pickBossWarningRow();
    if (row === null) {
      boss.nextAttackAt = now + 3000;
      return;
    }
    boss.warningRow = row;
    boss.warningStartedAt = now;
    boss.warningUntil = now + CHAPTER1_BOSS.warningDuration;
    this.message = `${this.rowLabel(row)} 붉은 깃발 경고`;
    this.pulse(1.04, 1.8);
    this.sound.cue("bossWarning");
  }

  pickBossWarningRow() {
    const rows = [];
    for (let row = 0; row <= 11; row += 1) {
      if (this.board[row].some(Boolean)) rows.push(row);
    }
    if (!rows.length) return null;
    const current = this.actorY + 1;
    const currentIndex = rows.indexOf(current);
    if (currentIndex >= 0 && rows.length > 1) rows.splice(currentIndex, 1);
    return rows[Math.floor(Math.random() * rows.length)];
  }

  resolveBossWarning(row) {
    const boss = this.bossState;
    if (!boss?.active || boss.defeated || boss.warningRow !== row) return;
    boss.warningRow = null;
    boss.warningStartedAt = 0;
    boss.warningUntil = 0;
    boss.nextAttackAt = performance.now() + CHAPTER1_BOSS.interval;
    this.score += CHAPTER1_BOSS.responseScore;
    this.message = `붉은 깃발 제거 +${CHAPTER1_BOSS.responseScore}`;
    const point = this.boardToScreen(row, 0);
    this.burst(point.x, point.y, "#e85c5c", 18);
    this.sound.cue("clear");
  }

  hitBoss() {
    const boss = this.bossState;
    if (!boss?.active || boss.defeated || boss.hp <= 0) return;
    boss.hp = Math.max(0, boss.hp - 1);
    if (boss.hp > 0) {
      this.message = `${boss.name} HP ${boss.hp}/${boss.hpMax}`;
      return;
    }
    boss.defeated = true;
    boss.active = false;
    boss.warningRow = null;
    boss.warningUntil = 0;
    this.sound.stopMusic();
    this.storyTime = Math.min(this.storyTimeMax, this.storyTime + CHAPTER1_BOSS.defeatBonusTime);
    this.message = "붉은 깃발이 걷혔습니다 +8s";
    this.burst(this.width * 0.5, Math.max(120, this.height * 0.18), "#f7c15f", 36);
    this.pulse(1.18, 1.2);
    this.sound.cue("bossDefeat");
    this.updateHud();
  }

  async nextStage() {
    const next = this.stage + 1;
    if (this.isFinalStage()) {
      this.resultState = "ending";
      this.message = "Ending: 마을의 길이 지켜졌습니다";
      return;
    }
    if (this.chapterIndexForStage(next) !== this.chapterIndexForStage(this.stage)) {
      this.openChapterIntro(next);
      return;
    }
    await this.startStory(next);
  }

  isFinalStage() {
    return this.stage >= 36;
  }

  checkSurvivalBottom() {
    let match = this.findSurvivalCollectorRun();
    while (match) {
      const removed = match.end - match.start + 1;
      for (let col = match.start; col <= match.end; col += 1) this.board[12][col] = 0;
      this.compactCollector();
      this.combo += 1;
      this.score += removed * 80 * this.combo;
      const bonus = this.pushBackBulldozer();
      this.message = `서바이벌 콤보 ${this.combo} (${removed}) +${bonus}s`;
      this.pulse(1.18, 1);
      this.sound.cue("clear");
      match = this.findSurvivalCollectorRun();
    }
    if (!this.isCollectorFull()) return false;
    if (!this.findSurvivalCollectorRun()) {
      this.handleSurvivalOverflow();
      return true;
    }
    return false;
  }

  isCollectorFull() {
    return this.board[12].slice(0, 7).every(Boolean);
  }

  findSurvivalCollectorRun() {
    let best = null;
    let start = 0;
    for (let col = 1; col <= 7; col += 1) {
      const changed = col === 7 || this.board[12][col] !== this.board[12][start];
      if (!changed) continue;
      const length = col - start;
      if (this.board[12][start] && length >= 4 && (!best || length > best.end - best.start + 1)) {
        best = { start, end: col - 1 };
      }
      start = col;
    }
    return best;
  }

  compactCollector() {
    const values = this.board[12].slice(0, 7).filter(Boolean);
    for (let col = 0; col <= 6; col += 1) this.board[12][col] = 0;
    let target = 6;
    for (let i = values.length - 1; i >= 0; i -= 1) {
      this.board[12][target] = values[i];
      target -= 1;
    }
  }

  handleSurvivalOverflow(nextBlock = 0) {
    this.combo = 0;
    this.mistakes += 1;
    if (this.shiftUp()) {
      if (nextBlock) {
        this.board[12][6] = nextBlock;
        const p = this.boardToScreen(12, 6);
        this.burst(p.x, p.y, this.color(nextBlock), 16);
      }
      this.message = nextBlock ? "수집줄 상승: 새 토템 대기" : "수집줄 실패: 라인 상승";
      this.sound.cue("fail");
      this.updateHud();
    }
  }

  settleOneStep() {
    let moved = true;
    while (moved) {
      moved = false;
      for (let row = ROWS - 3; row >= 0; row -= 1) {
        for (let col = 0; col < COLS; col += 1) {
          if (this.board[row][col] && this.board[row][col] !== OBSTACLE_DEVELOPMENT && !this.board[row + 1][col]) {
            this.board[row + 1][col] = this.board[row][col];
            this.board[row][col] = 0;
            moved = true;
          }
        }
      }
    }
  }

  shiftUp() {
    if (this.board[0].some(Boolean)) {
      this.endGame("토템이 마을 끝까지 밀렸습니다");
      return false;
    }
    for (let row = 0; row < ROWS - 1; row += 1) this.board[row] = [...this.board[row + 1]];
    this.board[12] = Array(COLS).fill(0);
    this.pulse(1.1, 3);
    return true;
  }

  survivalRise() {
    if (this.pendingPush) return false;
    if (!this.risePlayfield()) return false;
    const fillCount = Math.min(7, 4 + Math.floor(this.survivalLevel / 3));
    for (let col = 0; col < fillCount; col += 1) this.board[11][col] = this.randomSurvivalBlock();
    this.settlePlayfield();
    this.survivalLevel += 1;
    this.survivalDelay = Math.max(4800, this.survivalDelay - 120);
    this.message = `불도저 압박 Lv.${this.survivalLevel}`;
    this.sound.cue("villain");
    this.updateHud();
    return true;
  }

  survivalRush() {
    if (this.screen !== "play" || this.mode !== "survival" || this.gameOver || this.pendingPush || this.isCountingDown()) return;
    const previousLevel = this.survivalLevel;
    if (!this.survivalRise()) return;
    const reward = 120 + previousLevel * 20;
    this.score += reward;
    this.survivalTimer = 0;
    this.message = `Rush 보너스 +${reward}`;
    this.updateHud();
  }

  risePlayfield() {
    if (this.board[0].some(Boolean)) {
      this.endGame("토템이 마을 끝까지 밀렸습니다");
      return false;
    }
    for (let row = 0; row < ROWS - 2; row += 1) this.board[row] = [...this.board[row + 1]];
    this.board[11] = Array(COLS).fill(0);
    this.pulse(1.1, 3);
    return true;
  }

  randomSurvivalBlock() {
    const limit = Math.min(7, 4 + Math.floor(this.survivalLevel / 5));
    return this.randomBlock(limit);
  }

  settlePlayfield() {
    const rows = [];
    for (let row = 0; row <= 11; row += 1) {
      if (this.board[row].some(Boolean)) rows.push([...this.board[row]]);
      this.board[row] = Array(COLS).fill(0);
    }
    const start = 12 - rows.length;
    rows.forEach((source, index) => {
      this.board[start + index] = source;
    });
  }

  updateHud() {
    document.querySelector("#timeLabel").textContent = this.mode === "story" ? String(this.storySecondsLeft()) : String(this.survivalSecondsLeft());
    document.querySelector("#scoreLabel").textContent = String(this.score);
    document.querySelector("#comboLabel").textContent = String(this.combo);
    this.updatePowerControls();
  }

  storySecondsLeft() {
    return Math.max(0, Math.ceil(this.storyTime / 10));
  }

  survivalSecondsLeft() {
    return Math.max(0, Math.ceil((this.survivalDelay - this.survivalTimer) / 1000));
  }

  pushBackBulldozer() {
    const bonus = this.mode === "story" ? Math.min(8, 4 + this.combo) : Math.min(5, 2 + Math.floor(this.combo / 2));
    if (this.mode === "story") {
      this.storyTime = Math.min(this.storyTimeMax, this.storyTime + bonus * 10);
    } else {
      this.survivalTimer = Math.max(0, this.survivalTimer - bonus * 1000);
    }
    this.updateHud();
    return bonus;
  }

  rowLabel(row) {
    return row === 0 ? "TOP" : `R${row}`;
  }

  endGame(reason) {
    if (this.gameOver || this.stageClear) return;
    this.hasActiveRun = false;
    this.resumeCountdownUntil = 0;
    this.gameOver = true;
    this.resultState = "gameover";
    this.rewardUnlocked = null;
    this.pendingPush = null;
    this.bossIntroUntil = 0;
    this.leafCleanseSelecting = false;
    this.sound.stopMusic();
    this.message = reason;
    this.clearBlastUntil = 0;
    this.prepareNameEntry();
    this.pulse(1.06, 4);
    this.sound.cue("gameover");
    this.updateHud();
  }

  tick(now) {
    const delta = Math.min(48, now - (this.last || now));
    this.last = now;
    this.time += delta;
    this.finishPush(now);
    if (this.stageClear && this.clearAdvanceAt && now >= this.clearAdvanceAt) {
      this.clearAdvanceAt = 0;
      this.nextStage();
    }
    const countdown = this.isCountingDown(now);
    if (this.screen === "play" && this.mode === "story" && !countdown && !this.stageClear && !this.gameOver) {
      this.storyTime = Math.max(0, this.storyTime - delta / 100);
      if (Math.floor(this.time / 120) !== Math.floor((this.time - delta) / 120)) this.updateHud();
      this.updateBoss(now);
      this.updateShuffle(now);
      if (this.storyTime <= 0) {
        this.endGame("Game Over: 불도저가 마을에 도달했습니다");
      }
    }
    if (this.screen === "play" && this.mode === "survival" && !countdown && !this.gameOver) {
      this.survivalTimer += delta;
      if (Math.floor(this.time / 120) !== Math.floor((this.time - delta) / 120)) this.updateHud();
      if (this.survivalTimer > this.survivalDelay) {
        if (this.survivalRise()) this.survivalTimer = 0;
      }
    }
    this.camera.zoom += (this.camera.target - this.camera.zoom) * 0.08;
    this.camera.target += (1 - this.camera.target) * 0.04;
    this.camera.shake *= 0.84;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * delta / 16;
      p.y += p.vy * delta / 16;
      p.vy += 0.03 * delta / 16;
      p.life -= delta;
      return p.life > 0;
    });
    this.draw();
    requestAnimationFrame((time) => this.tick(time));
  }

  draw() {
    const ctx = this.ctx;
    this.app.classList.toggle("has-result", Boolean(this.resultState));
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawWorld(ctx);
    if (this.screen === "play") this.drawGame(ctx);
    this.drawParticles(ctx);
    if (this.screen === "play") this.drawResultOverlay(ctx);
    if (this.screen === "play") this.drawCountdown(ctx);
    if (this.screen === "play") this.drawDebug(ctx);
  }

  isCountingDown(now = performance.now()) {
    return this.resumeCountdownUntil && now < this.resumeCountdownUntil;
  }

  drawWorld(ctx) {
    const bg = this.sprites.background;
    if (bg?.complete && bg.naturalWidth) {
      const driftX = Math.sin(this.time * 0.00018) * 10;
      const driftY = Math.cos(this.time * 0.00014) * 14;
      this.drawCoverImage(ctx, bg, this.width / 2 + driftX, this.height / 2 + driftY, this.width + 28, this.height + 36);

      ctx.fillStyle = "rgba(5, 8, 7, 0.22)";
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.save();
      ctx.globalAlpha = 0.34;
      ctx.fillStyle = "#08251f";
      for (let i = 0; i < 12; i += 1) {
        const x = (i * 71 - this.time * 0.006) % (this.width + 90) - 45;
        const h = 100 + Math.sin(i * 1.9) * 28;
        ctx.beginPath();
        ctx.moveTo(x, this.height);
        ctx.lineTo(x + 16, this.height - h);
        ctx.lineTo(x + 32, this.height);
        ctx.fill();
      }
      ctx.restore();

      return;
    }

    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#122d2d");
    sky.addColorStop(0.5, "#773b41");
    sky.addColorStop(0.8, "#d58a52");
    sky.addColorStop(1, "#08100d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = "rgba(247, 193, 95, 0.62)";
    ctx.beginPath();
    ctx.arc(this.width * 0.72, this.height * 0.22, 54, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 53 + this.time * 0.009) % (this.width + 90) - 45;
      const h = 116 + Math.sin(i * 1.7) * 34;
      ctx.fillStyle = i % 2 ? "rgba(8, 36, 31, 0.86)" : "rgba(28, 45, 35, 0.82)";
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.lineTo(x + 18, this.height - h);
      ctx.lineTo(x + 36, this.height);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(121, 221, 191, 0.1)";
    ctx.beginPath();
    ctx.moveTo(0, this.height * 0.72);
    ctx.bezierCurveTo(this.width * 0.25, this.height * 0.67, this.width * 0.42, this.height * 0.78, this.width, this.height * 0.7);
    ctx.lineTo(this.width, this.height);
    ctx.lineTo(0, this.height);
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 193, 95, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.width * 0.12, this.height);
    ctx.bezierCurveTo(this.width * 0.4, this.height * 0.78, this.width * 0.56, this.height * 0.94, this.width * 0.88, this.height * 0.75);
    ctx.stroke();
  }

  drawCoverImage(ctx, image, cx, cy, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawW = image.naturalWidth * scale;
    const drawH = image.naturalHeight * scale;
    ctx.drawImage(image, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  }

  handleResultTap(x, y) {
    if (!this.resultState) return false;
    const nx = x / this.width;
    const ny = y / this.height;
    if (this.resultState === "gameover") {
      if (nx >= 0.1 && nx <= 0.9 && ny >= 0.76 && ny <= 0.87) {
        this.startStory(this.stage);
        return true;
      }
      if (nx >= 0.14 && nx <= 0.86 && ny >= 0.89 && ny <= 0.98) {
        this.openMenu();
        return true;
      }
      return true;
    }
    if (this.resultState === "clear") {
      if (nx >= 0.05 && nx <= 0.62 && ny >= 0.84 && ny <= 0.98) {
        this.nextStage();
        return true;
      }
      if (nx >= 0.62 && nx <= 0.97 && ny >= 0.84 && ny <= 0.98) {
        this.openMenu();
        return true;
      }
      return true;
    }
    if (this.resultState === "ending") {
      if (ny >= 0.856) {
        if (nx >= 0.06 && nx <= 0.64) {
          this.openSurvivalIntro();
        } else {
          this.openMenu();
        }
      }
      return true;
    }
    return false;
  }

  drawResultOverlay(ctx) {
    if (!this.resultState) return;
    const image = this.resultState === "gameover" ? this.sprites.gameOverScreen : this.sprites.clearScreen;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, this.width, this.height);
    if (image?.complete && image.naturalWidth) {
      this.drawCoverImage(ctx, image, this.width / 2, this.height / 2, this.width, this.height);
    }
    if (this.resultState === "clear" || this.resultState === "ending") {
      const result = this.stageResult || {
        stage: this.stage,
        boardScore: this.score,
        clearBonus: 0,
        timeLeft: Math.ceil(this.storyTime),
        timeBonus: 0,
        bestCombo: this.stageBestCombo,
        comboBonus: 0,
        stageScore: this.score,
        totalScore: this.score
      };
      const panelX = this.width * 0.16;
      const panelY = this.height * 0.555;
      const panelW = this.width * 0.68;
      const panelH = Math.min(this.height * 0.205, 170);
      const lineH = panelH / 6.15;
      ctx.fillStyle = "rgba(5, 8, 7, 0.74)";
      this.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(247, 193, 95, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#fff7d8";
      ctx.textAlign = "center";
      ctx.font = "900 17px Arial";
      ctx.fillText(this.resultState === "ending" ? "모든 스테이지 클리어" : `Stage ${result.stage} Clear`, this.width / 2, panelY + lineH * 0.9);

      const rows = [
        ["Stage", result.stageScore],
        ["Time", `${result.timeLeft}s / +${result.timeBonus.toLocaleString()}`],
        ["Combo", `${result.bestCombo} / +${result.comboBonus.toLocaleString()}`],
        ["Clear", `+${result.clearBonus.toLocaleString()}`]
      ];
      ctx.font = "800 12px Arial";
      for (let i = 0; i < rows.length; i += 1) {
        const y = panelY + lineH * (1.75 + i);
        ctx.fillStyle = i % 2 ? "rgba(255, 255, 255, 0.04)" : "rgba(247, 193, 95, 0.06)";
        this.roundRect(ctx, panelX + 12, y - lineH * 0.58, panelW - 24, lineH * 0.82, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(247, 241, 223, 0.78)";
        ctx.textAlign = "left";
        ctx.fillText(rows[i][0], panelX + 26, y);
        ctx.fillStyle = "#fff7d8";
        ctx.textAlign = "right";
        const value = typeof rows[i][1] === "number" ? rows[i][1].toLocaleString() : rows[i][1];
        ctx.fillText(value, panelX + panelW - 26, y);
      }

      ctx.fillStyle = "#f7c15f";
      ctx.textAlign = "center";
      ctx.font = "900 16px Arial";
      ctx.fillText(`Total ${result.totalScore.toLocaleString()}`, this.width / 2, panelY + panelH - lineH * 0.38);

    }
    if (this.resultState === "gameover") {
      if (this.nameEntry) {
        this.drawNameEntryOverlay(ctx);
      } else {
        this.drawGameOverScoreboard(ctx);
      }
    }
    if (this.resultState === "ending") {
      const msgY = this.height * 0.775;
      ctx.fillStyle = "rgba(5, 8, 7, 0.72)";
      this.roundRect(ctx, this.width * 0.1, msgY, this.width * 0.8, 54, 8);
      ctx.fill();
      ctx.fillStyle = "#f7c15f";
      ctx.textAlign = "center";
      ctx.font = "900 17px Arial";
      ctx.fillText("모든 스테이지 완주!", this.width / 2, msgY + 22);
      ctx.fillStyle = "#fff7d8";
      ctx.font = "800 13px Arial";
      ctx.fillText("마을은 다시 숲의 노래를 되찾았습니다", this.width / 2, msgY + 44);

      const btnY = this.height * 0.856;
      const btnH = Math.min(44, this.height * 0.058);
      const gap = this.width * 0.03;
      const survivalW = this.width * 0.58;
      const menuW = this.width * 0.32;
      const survivalX = this.width * 0.06;
      const menuX = survivalX + survivalW + gap;

      ctx.fillStyle = "rgba(121, 221, 191, 0.22)";
      this.roundRect(ctx, survivalX, btnY, survivalW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(121, 221, 191, 0.72)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#79ddbf";
      ctx.textAlign = "center";
      ctx.font = "800 14px Arial";
      ctx.fillText("서바이벌 도전", survivalX + survivalW / 2, btnY + btnH * 0.62);

      ctx.fillStyle = "rgba(5, 8, 7, 0.54)";
      this.roundRect(ctx, menuX, btnY, menuW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(247, 193, 95, 0.38)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#f7f1df";
      ctx.textAlign = "center";
      ctx.font = "800 13px Arial";
      ctx.fillText("메뉴", menuX + menuW / 2, btnY + btnH * 0.62);
    }
    ctx.restore();
  }

  drawNameEntryOverlay(ctx) {
    const panelW = Math.min(this.width * 0.76, 330);
    const panelH = Math.min(this.height * 0.23, 178);
    const panelX = this.width / 2 - panelW / 2;
    const panelY = Math.max(22, this.height * 0.135);
    const boxSize = Math.min(50, panelW * 0.18);
    const gap = Math.min(16, this.width * 0.04);
    const startX = this.width / 2 - boxSize * 1.5 - gap;
    const boxY = panelY + panelH * 0.39;
    const saveW = Math.min(156, panelW * 0.54);
    const saveH = 34;
    const saveX = this.width / 2 - saveW / 2;
    const saveY = panelY + panelH - saveH - 14;

    this.nameEntryTouchAreas = [];
    ctx.save();
    ctx.fillStyle = "rgba(5, 8, 7, 0.88)";
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 193, 95, 0.72)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#f7c15f";
    ctx.font = "900 18px Arial";
    ctx.fillText("NEW HIGH SCORE", this.width / 2, panelY + 30);
    ctx.fillStyle = "rgba(247, 241, 223, 0.72)";
    ctx.font = "800 11px Arial";
    ctx.fillText("ENTER 3 LETTERS", this.width / 2, panelY + 50);

    for (let i = 0; i < 3; i += 1) {
      const x = startX + i * (boxSize + gap);
      const selected = i === this.nameEntry.selected;
      ctx.fillStyle = selected ? "rgba(247, 193, 95, 0.26)" : "rgba(255, 255, 255, 0.08)";
      this.roundRect(ctx, x, boxY, boxSize, boxSize, 8);
      ctx.fill();
      ctx.strokeStyle = selected ? "#f7c15f" : "rgba(247, 241, 223, 0.22)";
      ctx.lineWidth = selected ? 2 : 1.2;
      ctx.stroke();
      ctx.fillStyle = "#fff7d8";
      ctx.font = "900 34px Arial";
      ctx.fillText(this.nameEntry.initials[i], x + boxSize / 2, boxY + boxSize * 0.7);
      this.nameEntryTouchAreas.push({ type: "letter", index: i, x, y: boxY, w: boxSize, h: boxSize });
    }

    ctx.fillStyle = "rgba(121, 221, 191, 0.22)";
    this.roundRect(ctx, saveX, saveY, saveW, saveH, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(121, 221, 191, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#79ddbf";
    ctx.font = "900 14px Arial";
    ctx.fillText("SAVE", this.width / 2, saveY + 25);
    this.nameEntryTouchAreas.push({ type: "save", x: saveX, y: saveY, w: saveW, h: saveH });

    ctx.fillStyle = "rgba(247, 241, 223, 0.58)";
    ctx.font = "800 10px Arial";
    ctx.fillText("ARROWS CHANGE  ENTER SAVE", this.width / 2, panelY + panelH - 4);
    ctx.restore();
  }

  drawGameOverScoreboard(ctx) {
    const scores = this.highScoresForMode(this.mode).slice(0, 5);
    const panelW = Math.min(this.width * 0.66, 292);
    const rowH = 15;
    const panelH = scores.length ? 53 + rowH * scores.length : 56;
    const panelX = this.width / 2 - panelW / 2;
    const panelY = Math.max(18, this.height * 0.115);
    ctx.save();
    ctx.fillStyle = "rgba(5, 8, 7, 0.58)";
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 193, 95, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = "#fff7d8";
    ctx.textAlign = "center";
    ctx.font = "900 15px Arial";
    ctx.fillText(`Stage ${this.stage}  Score ${this.score.toLocaleString()}`, this.width / 2, panelY + 22);

    if (!scores.length) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#f7c15f";
    ctx.textAlign = "center";
    ctx.font = "900 11px Arial";
    ctx.fillText(`${this.mode.toUpperCase()} LOCAL RANK`, this.width / 2, panelY + 40);
    ctx.font = "800 11px Arial";
    for (let i = 0; i < scores.length; i += 1) {
      const entry = scores[i];
      const y = panelY + 57 + i * rowH;
      ctx.fillStyle = i === 0 ? "#fff7d8" : "rgba(247, 241, 223, 0.76)";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${entry.initials}`, panelX + 18, y);
      ctx.textAlign = "right";
      ctx.fillText(entry.score.toLocaleString(), panelX + panelW - 18, y);
    }
    ctx.restore();
  }

  drawCountdown(ctx) {
    if (!this.isCountingDown()) return;
    const remaining = Math.max(1, Math.ceil((this.resumeCountdownUntil - performance.now()) / 1000));
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.56)";
    ctx.fillRect(0, 0, this.width, this.height);
    const size = Math.min(148, this.width * 0.34);
    const x = this.width / 2;
    const y = this.height / 2;
    ctx.fillStyle = "rgba(5, 8, 7, 0.76)";
    this.roundRect(ctx, x - size / 2, y - size / 2, size, size, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 193, 95, 0.54)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f7c15f";
    ctx.textAlign = "center";
    ctx.font = "900 58px Arial";
    ctx.fillText(String(remaining), x, y + 16);
    ctx.fillStyle = "#fff7d8";
    ctx.font = "900 15px Arial";
    ctx.fillText("READY", x, y + size * 0.34);
    ctx.restore();
  }

  drawGame(ctx) {
    const center = this.center();
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    this.drawVillain(ctx);
    ctx.save();
    ctx.translate(center.x + shakeX, center.y + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-center.x, -center.y);
    this.drawBoardPanel(ctx);
    this.drawBoard(ctx);
    this.drawPushBlock(ctx);
    this.drawActor(ctx);
    ctx.restore();
    this.drawBossHud(ctx);
    this.drawBossIntro(ctx);
    const messageY = this.height - Math.max(54, Math.round(this.height * 0.058));
    ctx.fillStyle = "rgba(5, 8, 7, 0.64)";
    this.roundRect(ctx, 14, messageY, this.width - 28, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#f7f1df";
    ctx.font = "700 13px Arial";
    ctx.fillText(this.message, 28, messageY + 24);
  }

  drawVillain(ctx) {
    const villain = this.sprites.villain;
    const bulldozer = this.sprites.bulldozer;
    const clearPhase = this.clearBlastUntil ? Math.max(0, (this.clearBlastUntil - performance.now()) / 1600) : 0;
    const storyLimit = this.storyTimeMax || 900;
    const timeProgress = this.mode === "story" ? 1 - Math.max(0, this.storyTime) / storyLimit : Math.min(1, this.survivalTimer / this.survivalDelay);
    const progress = this.stageClear ? 0.72 : Math.min(1, timeProgress + this.mistakes * 0.04);
    const blastPush = clearPhase > 0 ? (1 - clearPhase) * 260 : 0;
    const yBase = Math.max(122, Math.min(146, this.height * 0.148));
    const tentX = 42;
    const startX = this.width - 48;
    const hitX = tentX + 52;
    const x = startX + (hitX - startX) * progress + blastPush + Math.sin(this.time * 0.004) * 3;
    const y = yBase - (clearPhase > 0 ? Math.sin((1 - clearPhase) * Math.PI) * 38 : 0);
    this.drawVillageTent(ctx, tentX, yBase + 4);
    this.drawTimeRoad(ctx, progress);
    if (clearPhase > 0) this.drawClearBeam(ctx, x, y, clearPhase);
    if (bulldozer) {
      this.drawSpriteContain(ctx, bulldozer, 0, 0, bulldozer.width, bulldozer.height, x, y, 96, 64);
    } else {
      ctx.fillStyle = "#d9a323";
      this.roundRect(ctx, x - 48, y - 20, 92, 38, 8);
      ctx.fill();
      ctx.fillStyle = "#3b3326";
      ctx.fillRect(x - 34, y + 12, 70, 12);
    }
    if (villain) this.drawSpriteContain(ctx, villain, 0, 0, villain.width, villain.height, 38, yBase + 18, 44, 58);
  }

  drawBossIntro(ctx) {
    if (!this.bossIntroUntil || performance.now() >= this.bossIntroUntil) return;
    const image = this.sprites.chapter1BossIntro;
    const phase = Math.max(0, Math.min(1, (this.bossIntroUntil - performance.now()) / 2400));
    const alpha = Math.min(1, phase * 3, (1 - phase) * 3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = "rgba(5, 8, 7, 0.7)";
    ctx.fillRect(0, 0, this.width, this.height);
    if (image?.complete && image.naturalWidth) {
      this.drawCoverImage(ctx, image, this.width / 2, this.height / 2, this.width, this.height);
      ctx.fillStyle = "rgba(5, 8, 7, 0.38)";
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.fillStyle = "rgba(5, 8, 7, 0.76)";
    this.roundRect(ctx, 22, this.height * 0.68, this.width - 44, 84, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(232, 92, 92, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#e85c5c";
    ctx.textAlign = "center";
    ctx.font = "900 15px Arial";
    ctx.fillText("BOSS STAGE", this.width / 2, this.height * 0.68 + 28);
    ctx.fillStyle = "#fff7d8";
    ctx.font = "900 23px Arial";
    ctx.fillText(CHAPTER1_BOSS.name, this.width / 2, this.height * 0.68 + 58);
    ctx.restore();
  }

  drawVillageTent(ctx, x, y) {
    const tent = this.sprites.tent;
    if (tent) {
      this.drawSpriteContain(ctx, tent, 0, 0, tent.width, tent.height, x, y, 66, 64);
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(x, y + 24, 46, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    const cloth = ctx.createLinearGradient(x, y - 38, x, y + 26);
    cloth.addColorStop(0, "#f4d18a");
    cloth.addColorStop(1, "#a95b3a");
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.moveTo(x - 42, y + 24);
    ctx.lineTo(x, y - 44);
    ctx.lineTo(x + 42, y + 24);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#2d1714";
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 24);
    ctx.lineTo(x, y - 4);
    ctx.lineTo(x + 12, y + 24);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 241, 223, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - 44);
    ctx.lineTo(x, y + 24);
    ctx.moveTo(x - 22, y + 8);
    ctx.lineTo(x + 22, y + 8);
    ctx.stroke();

    ctx.fillStyle = "#79ddbf";
    ctx.beginPath();
    ctx.arc(x - 28, y + 18, 4, 0, Math.PI * 2);
    ctx.arc(x + 28, y + 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTimeRoad(ctx, progress) {
    const x0 = 78;
    const x1 = this.width - 42;
    const y = Math.max(142, Math.min(164, this.height * 0.168));
    ctx.save();
    ctx.strokeStyle = "rgba(247, 241, 223, 0.22)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(232, 92, 92, 0.78)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + (x1 - x0) * progress, y);
    ctx.stroke();
    ctx.restore();
  }

  drawClearBeam(ctx, bulldozerX, bulldozerY, phase) {
    const start = this.boardToScreen(12, Math.max(0, 6 - this.stoneFlag));
    ctx.save();
    ctx.globalAlpha = Math.min(1, phase + 0.15);
    ctx.strokeStyle = "#f7c15f";
    ctx.lineWidth = 5 + Math.sin(this.time * 0.04) * 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(this.width * 0.55, Math.max(180, this.height * 0.2), bulldozerX, bulldozerY);
    ctx.stroke();
    ctx.strokeStyle = "#79ddbf";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawBoardPanel(ctx) {
    const { originX, originY, tile } = this.boardMetrics;
    const x = originX - tile * 0.35;
    const y = originY - tile * 0.35;
    const w = tile * COLS + tile * 0.7;
    const h = tile * ROWS + tile * 0.7;
    const frame = ctx.createLinearGradient(x, y, x + w, y + h);
    frame.addColorStop(0, "rgba(247, 193, 95, 0.34)");
    frame.addColorStop(0.45, "rgba(18, 54, 47, 0.72)");
    frame.addColorStop(1, "rgba(126, 58, 48, 0.56)");
    ctx.fillStyle = frame;
    this.roundRect(ctx, x, y, w, h, 18);
    ctx.fill();

    ctx.fillStyle = "rgba(5, 8, 7, 0.7)";
    this.roundRect(ctx, originX - tile * 0.14, originY - tile * 0.14, tile * COLS + tile * 0.28, tile * ROWS + tile * 0.28, 12);
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 241, 223, 0.22)";
    ctx.lineWidth = 2;
    this.roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 15);
    ctx.stroke();

    ctx.fillStyle = "rgba(121, 221, 191, 0.12)";
    const target = this.boardToScreen(this.actorY + 1, 3.5);
    this.roundRect(ctx, originX - tile * 0.06, target.y - tile * 0.48, tile * COLS + tile * 0.12, tile * 0.96, 8);
    ctx.fill();

    if (this.mode === "story") {
      ctx.fillStyle = "rgba(247, 193, 95, 0.13)";
      const bottom = this.boardToScreen(12, 3);
      this.roundRect(ctx, originX - tile * 0.04, bottom.y - tile * 0.48, tile * (7 - this.stoneFlag), tile * 0.96, 8);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(247, 241, 223, 0.32)";
    for (let col = 0; col < COLS; col += 1) {
      const p = this.boardToScreen(12, col);
      ctx.beginPath();
      ctx.arc(p.x, p.y + tile * 0.42, Math.max(1.5, tile * 0.06), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBoard(ctx) {
    this.drawBossWarningRow(ctx);
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = this.boardToScreen(row, col);
        ctx.strokeStyle = row === this.actorY + 1 ? "rgba(121, 221, 191, 0.48)" : "rgba(247, 241, 223, 0.1)";
        ctx.lineWidth = row === this.actorY + 1 ? 2 : 1;
        ctx.strokeRect(cell.x - cell.size / 2, cell.y - cell.size / 2, cell.size, cell.size);
        if (this.board[row][col]) this.drawBlock(ctx, cell.x, cell.y, cell.size * 0.86, this.board[row][col]);
      }
    }
    if (this.mode === "story") {
      for (let i = 0; i < this.stoneFlag; i += 1) {
        const cell = this.boardToScreen(12, 7 - i);
        this.drawGoalTotem(ctx, cell.x, cell.y, cell.size * 0.74);
      }
    }
  }

  drawBossWarningRow(ctx) {
    const boss = this.bossState;
    if (!boss?.active || boss.warningRow === null) return;
    const { originX, tile } = this.boardMetrics;
    const cell = this.boardToScreen(boss.warningRow, 0);
    const phase = Math.max(0, Math.min(1, (boss.warningUntil - performance.now()) / CHAPTER1_BOSS.warningDuration));
    const pulse = 0.45 + Math.sin(this.time * 0.018) * 0.18;
    ctx.save();
    ctx.fillStyle = `rgba(232, 92, 92, ${pulse})`;
    this.roundRect(ctx, originX - tile * 0.1, cell.y - tile * 0.48, tile * COLS + tile * 0.2, tile * 0.96, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 215, 114, 0.82)";
    ctx.lineWidth = Math.max(2, tile * 0.06);
    ctx.stroke();
    const flagX = originX + tile * COLS + tile * 0.5;
    this.drawRedFlagMarker(ctx, flagX, cell.y, tile * 0.86);
    ctx.fillStyle = "rgba(5, 8, 7, 0.72)";
    this.roundRect(ctx, originX + tile * 0.12, cell.y - tile * 0.38, tile * Math.max(0.2, 2.2 * phase), tile * 0.12, 4);
    ctx.fill();
    ctx.restore();
  }

  drawBossHud(ctx) {
    const boss = this.bossState;
    if (!boss || (boss.defeated && !boss.active)) return;
    const { originY } = this.boardMetrics;
    const x = 14;
    const y = Math.max(92, originY - 58);
    const w = Math.min(this.width - 28, 260);
    const h = 48;
    ctx.save();
    ctx.fillStyle = "rgba(5, 8, 7, 0.72)";
    this.roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = boss.active ? "rgba(232, 92, 92, 0.7)" : "rgba(247, 193, 95, 0.62)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawBossPortrait(ctx, x + 26, y + h / 2, 34);
    ctx.fillStyle = "#fff7d8";
    ctx.textAlign = "left";
    ctx.font = "900 12px Arial";
    ctx.fillText(boss.name, x + 50, y + 18);
    ctx.font = "800 10px Arial";
    ctx.fillStyle = boss.warningRow !== null ? "#e85c5c" : "rgba(247, 241, 223, 0.72)";
    const warning = boss.warningRow !== null ? `${this.rowLabel(boss.warningRow)} FLAG WARNING` : boss.defeated ? "FLAGS CLEARED" : "WATCH THE FLAGS";
    ctx.fillText(warning, x + 50, y + 34);

    for (let i = 0; i < boss.hpMax; i += 1) {
      const fx = x + w - 18 - i * 18;
      ctx.globalAlpha = i < boss.hp ? 1 : 0.28;
      this.drawRedFlagMarker(ctx, fx, y + 23, 16);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawBossPortrait(ctx, x, y, size) {
    const portrait = this.sprites.bossFlagSupervisor;
    if (portrait) {
      this.drawSpriteContain(ctx, portrait, 0, 0, portrait.width, portrait.height, x, y, size, size);
      return;
    }
    ctx.save();
    ctx.fillStyle = "#f7c15f";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.12, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9a323";
    this.roundRect(ctx, x - size * 0.25, y + size * 0.02, size * 0.5, size * 0.34, 5);
    ctx.fill();
    ctx.strokeStyle = "#e85c5c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.3);
    ctx.lineTo(x + size * 0.18, y - size * 0.34);
    ctx.stroke();
    ctx.fillStyle = "#e85c5c";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y - size * 0.32);
    ctx.lineTo(x + size * 0.52, y - size * 0.22);
    ctx.lineTo(x + size * 0.2, y - size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawRedFlagMarker(ctx, x, y, size) {
    const marker = this.sprites.bossRedFlag;
    if (marker) {
      this.drawSpriteContain(ctx, marker, 0, 0, marker.width, marker.height, x, y, size, size);
      return;
    }
    ctx.save();
    ctx.strokeStyle = "#3b2318";
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.18, y + size * 0.38);
    ctx.lineTo(x - size * 0.18, y - size * 0.42);
    ctx.stroke();
    ctx.fillStyle = "#e85c5c";
    ctx.beginPath();
    ctx.moveTo(x - size * 0.16, y - size * 0.42);
    ctx.lineTo(x + size * 0.42, y - size * 0.26);
    ctx.lineTo(x - size * 0.16, y - size * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(247, 193, 95, 0.72)";
    ctx.beginPath();
    ctx.arc(x - size * 0.18, y + size * 0.4, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPushBlock(ctx) {
    if (!this.pendingPush) return;
    const phase = Math.min(1, (performance.now() - this.pendingPush.start) / this.pendingPush.duration);
    const start = this.boardToScreen(this.pendingPush.row, -0.55);
    const end = this.boardToScreen(12, this.mode === "story" ? Math.max(0, 6 - this.stoneFlag) : 3);
    const t = phase < 0.45 ? 0 : (phase - 0.45) / 0.55;
    this.drawBlock(ctx, start.x, start.y + (end.y - start.y) * t, start.size * 0.86, this.pendingPush.block);
  }

  drawActor(ctx) {
    const row = this.board[this.actorY + 1];
    const lastBlockCol = row.reduce((last, value, index) => (value ? index : last), -1);
    const actorCol = lastBlockCol >= 0 ? Math.min(COLS - 0.22, lastBlockCol + 0.82) : 0.62;
    const point = this.boardToScreen(this.actorY + 1, actorCol);
    const pose = this.pendingPush || performance.now() < this.actorPushUntil ? 1 : this.mode === "survival" ? 2 : 0;
    const pushLean = pose === 1 ? -point.size * 0.1 : 0;
    this.drawHero(ctx, point.x + pushLean, point.y - point.size * 0.04, point.size * 1.24, pose, pose === 1);
  }

  drawHero(ctx, x, y, size, pose, flip = false) {
    const poses = [this.sprites.heroIdle, this.sprites.heroPush, this.sprites.heroAction];
    const poseImage = poses[pose];
    const renderW = pose === 0 ? size : size * 1.58;
    const renderH = size * 1.18;
    if (poseImage) {
      this.drawSpriteContain(ctx, poseImage, 0, 0, poseImage.width, poseImage.height, x, y - size * 0.08, renderW, renderH, flip);
      return;
    }
    const sheet = this.sprites.hero;
    if (sheet) {
      const sw = sheet.width / 3;
      this.drawSpriteContain(ctx, sheet, sw * pose, 0, sw, sheet.height, x, y - size * 0.08, renderW, renderH, flip);
      return;
    }
    ctx.fillStyle = "#f7c15f";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBlock(ctx, x, y, size, value) {
    if (value === OBSTACLE_DEVELOPMENT) {
      this.drawDevelopmentObstacle(ctx, x, y, size);
      return;
    }
    const blockImages = [
      this.sprites.blockLeaf,
      this.sprites.blockSun,
      this.sprites.blockWave,
      this.sprites.blockMountain,
      this.sprites.blockFire,
      this.sprites.blockCloud,
      this.sprites.blockMoon,
      this.sprites.blockRain,
      this.sprites.blockSnow,
      this.sprites.blockWind
    ];
    const blockImage = blockImages[((value - 1) % blockImages.length)];
    if (blockImage) {
      this.drawSpriteContain(ctx, blockImage, 0, 0, blockImage.width, blockImage.height, x, y, size, size);
      return;
    }
    const colors = {
      1: ["#173f2d", "#6ee58f"],
      2: ["#5a3514", "#ffd15c"],
      3: ["#123556", "#5ec6ff"],
      4: ["#273142", "#a8c0d6"],
      5: ["#552211", "#ff7b39"]
    };
    const [dark, light] = colors[((value - 1) % 5) + 1] || colors[1];
    const r = Math.max(5, size * 0.16);
    const left = x - size / 2;
    const top = y - size / 2;

    ctx.save();
    const body = ctx.createLinearGradient(left, top, left, top + size);
    body.addColorStop(0, light);
    body.addColorStop(0.46, dark);
    body.addColorStop(1, "#0b1715");
    ctx.fillStyle = body;
    this.roundRect(ctx, left, top, size, size, r);
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 241, 223, 0.62)";
    ctx.lineWidth = Math.max(1, size * 0.045);
    ctx.stroke();

    ctx.fillStyle = "rgba(5, 8, 7, 0.34)";
    this.roundRect(ctx, left + size * 0.12, top + size * 0.12, size * 0.76, size * 0.76, r * 0.8);
    ctx.fill();

    ctx.strokeStyle = light;
    ctx.fillStyle = light;
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    this.drawBlockSymbol(ctx, x, y, size * 0.58, ((value - 1) % 5) + 1);
    ctx.restore();
  }

  drawDevelopmentObstacle(ctx, x, y, size) {
    const left = x - size / 2;
    const top = y - size / 2;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
    ctx.beginPath();
    ctx.ellipse(x, y + size * 0.35, size * 0.38, size * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    const dirt = ctx.createLinearGradient(left, top, left, top + size);
    dirt.addColorStop(0, "#8a6a4a");
    dirt.addColorStop(0.5, "#4f3b32");
    dirt.addColorStop(1, "#211a18");
    ctx.fillStyle = dirt;
    this.roundRect(ctx, left + size * 0.08, top + size * 0.18, size * 0.84, size * 0.66, Math.max(5, size * 0.14));
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 241, 223, 0.36)";
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.stroke();

    ctx.strokeStyle = "#e85c5c";
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.27);
    ctx.lineTo(x + size * 0.18, y - size * 0.36);
    ctx.stroke();

    ctx.fillStyle = "#e85c5c";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y - size * 0.35);
    ctx.lineTo(x + size * 0.44, y - size * 0.25);
    ctx.lineTo(x + size * 0.2, y - size * 0.14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(247, 193, 95, 0.72)";
    ctx.lineWidth = Math.max(1, size * 0.045);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.34, y - size * 0.08);
    ctx.lineTo(x + size * 0.32, y + size * 0.08);
    ctx.stroke();
    ctx.restore();
  }

  drawBlockSymbol(ctx, x, y, size, value) {
    if (value === 1) {
      ctx.beginPath();
      ctx.ellipse(x, y, size * 0.28, size * 0.43, -0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - size * 0.18, y + size * 0.24);
      ctx.quadraticCurveTo(x, y, x + size * 0.22, y - size * 0.3);
      ctx.stroke();
      return;
    }
    if (value === 2) {
      ctx.beginPath();
      ctx.arc(x, y, size * 0.23, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * size * 0.34, y + Math.sin(a) * size * 0.34);
        ctx.lineTo(x + Math.cos(a) * size * 0.48, y + Math.sin(a) * size * 0.48);
        ctx.stroke();
      }
      return;
    }
    if (value === 3) {
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x - size * 0.44, y + i * size * 0.17);
        ctx.bezierCurveTo(x - size * 0.2, y - size * 0.16 + i * size * 0.17, x + size * 0.2, y + size * 0.16 + i * size * 0.17, x + size * 0.44, y + i * size * 0.17);
        ctx.stroke();
      }
      return;
    }
    if (value === 4) {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.44, y + size * 0.36);
      ctx.lineTo(x - size * 0.12, y - size * 0.32);
      ctx.lineTo(x + size * 0.08, y + size * 0.03);
      ctx.lineTo(x + size * 0.26, y - size * 0.22);
      ctx.lineTo(x + size * 0.48, y + size * 0.36);
      ctx.closePath();
      ctx.stroke();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.46);
    ctx.bezierCurveTo(x + size * 0.34, y - size * 0.16, x + size * 0.32, y + size * 0.28, x, y + size * 0.42);
    ctx.bezierCurveTo(x - size * 0.36, y + size * 0.18, x - size * 0.18, y - size * 0.08, x - size * 0.02, y - size * 0.2);
    ctx.bezierCurveTo(x + size * 0.04, y, x + size * 0.14, y + size * 0.14, x, y + size * 0.26);
    ctx.stroke();
  }

  drawTotem(ctx, x, y, size) {
    const guardian = this.sprites.guardian;
    if (guardian) {
      this.drawSpriteContain(ctx, guardian, 0, 0, guardian.width, guardian.height, x, y - size * 0.04, size, size * 1.18);
      return;
    }
    const sheet = this.sprites.totems;
    if (sheet) {
      this.drawSpriteContain(ctx, sheet, 0, 0, sheet.width * 0.42, sheet.height, x, y - size * 0.04, size, size * 1.18);
      return;
    }
    ctx.fillStyle = "#d58a52";
    this.roundRect(ctx, x - size * 0.3, y - size * 0.55, size * 0.6, size * 1.1, 12);
    ctx.fill();
  }

  drawGoalTotem(ctx, x, y, size) {
    const guardian = this.sprites.guardian;
    if (guardian) {
      this.drawSpriteContain(ctx, guardian, 0, 0, guardian.width, guardian.height, x, y - size * 0.04, size * 0.82, size * 0.96);
      return;
    }

    const sheet = this.sprites.totems;
    if (sheet) {
      this.drawSpriteContain(ctx, sheet, 0, 0, sheet.width * 0.42, sheet.height, x, y - size * 0.04, size * 0.82, size * 0.96);
      return;
    }

    const w = size * 0.58;
    const h = size * 0.82;
    const top = y - h * 0.48;
    const wood = ctx.createLinearGradient(x, top, x, top + h);
    wood.addColorStop(0, "#f4bf6f");
    wood.addColorStop(0.55, "#b66934");
    wood.addColorStop(1, "#6e3924");

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.beginPath();
    ctx.ellipse(x, y + h * 0.46, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = wood;
    this.roundRect(ctx, x - w / 2, top, w, h, Math.max(4, size * 0.12));
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 232, 159, 0.72)";
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.stroke();

    ctx.fillStyle = "#14342f";
    ctx.fillRect(x - w * 0.28, top + h * 0.28, w * 0.16, h * 0.14);
    ctx.fillRect(x + w * 0.12, top + h * 0.28, w * 0.16, h * 0.14);

    ctx.fillStyle = "#f7f1df";
    ctx.fillRect(x - w * 0.24, top + h * 0.6, w * 0.48, h * 0.08);

    ctx.fillStyle = "#79ddbf";
    ctx.beginPath();
    ctx.arc(x, top + h * 0.08, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawSpriteContain(ctx, sheet, sx, sy, sw, sh, cx, cy, maxW, maxH, flip = false) {
    const crop = this.tightCrop(sheet, sx, sy, sw, sh);
    const scale = Math.min(maxW / crop.sw, maxH / crop.sh);
    const dw = crop.sw * scale;
    const dh = crop.sh * scale;
    ctx.save();
    if (flip) {
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, crop.sx, crop.sy, crop.sw, crop.sh, -dw / 2, -dh / 2, dw, dh);
    } else {
      ctx.drawImage(sheet, crop.sx, crop.sy, crop.sw, crop.sh, cx - dw / 2, cy - dh / 2, dw, dh);
    }
    ctx.restore();
  }

  tightCrop(sheet, sx, sy, sw, sh) {
    const key = `${sheet.width}:${sheet.height}:${Math.round(sx)}:${Math.round(sy)}:${Math.round(sw)}:${Math.round(sh)}`;
    if (this.cropCache.has(key)) return this.cropCache.get(key);
    const x0 = Math.max(0, Math.floor(sx));
    const y0 = Math.max(0, Math.floor(sy));
    const x1 = Math.min(sheet.width, Math.ceil(sx + sw));
    const y1 = Math.min(sheet.height, Math.ceil(sy + sh));
    const temp = document.createElement("canvas");
    temp.width = sheet.width;
    temp.height = sheet.height;
    const tctx = temp.getContext("2d", { willReadFrequently: true });
    tctx.drawImage(sheet, 0, 0);
    const data = tctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let minX = x1;
    let minY = y1;
    let maxX = x0;
    let maxY = y0;
    for (let y = 0; y < y1 - y0; y += 1) {
      for (let x = 0; x < x1 - x0; x += 1) {
        const alpha = data[(y * (x1 - x0) + x) * 4 + 3];
        if (alpha <= 8) continue;
        minX = Math.min(minX, x0 + x);
        minY = Math.min(minY, y0 + y);
        maxX = Math.max(maxX, x0 + x);
        maxY = Math.max(maxY, y0 + y);
      }
    }
    const crop = minX <= maxX
      ? { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 }
      : { sx: x0, sy: y0, sw: x1 - x0, sh: y1 - y0 };
    this.cropCache.set(key, crop);
    return crop;
  }

  drawDebug(ctx) {
    if (!this.debug) return;
    const { originX, originY, tile } = this.boardMetrics;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.roundRect(ctx, 12, 82, this.width - 24, 72, 8);
    ctx.fill();
    ctx.fillStyle = "#79ddbf";
    ctx.font = "700 11px monospace";
    ctx.fillText(`actorY=${this.actorY} targetRow=${this.actorY + 1} pending=${this.pendingPush ? "yes" : "no"}`, 22, 104);
    ctx.fillText(`origin=(${originX},${originY}) tile=${tile} zoom=${this.camera.zoom.toFixed(2)}`, 22, 122);
    ctx.fillText(this.pointer ? `pointer row=${this.pointer.row} col=${this.pointer.col}` : "pointer none", 22, 140);
    for (let row = 0; row < ROWS; row += 1) {
      const p = this.boardToScreen(row, -0.25);
      ctx.fillText(String(row), p.x, p.y + 3);
    }
    for (let col = 0; col < COLS; col += 1) {
      const p = this.boardToScreen(-0.35, col);
      ctx.fillText(String(col), p.x - 3, p.y);
    }
  }

  metrics() {
    const tile = Math.floor(Math.min((this.width - 28) / 9.05, (this.height - 202) / ROWS));
    const desiredY = Math.round(Math.max(164, this.height * 0.205));
    const maxY = Math.round(this.height - 72 - tile * ROWS);
    this.boardMetrics = {
      tile,
      originX: Math.round((this.width - tile * COLS) / 2 + tile * 0.28),
      originY: Math.max(126, Math.min(desiredY, maxY))
    };
  }

  center() {
    const { originX, originY, tile } = this.boardMetrics;
    return { x: originX + tile * COLS / 2, y: originY + tile * ROWS / 2 };
  }

  boardToScreen(row, col) {
    this.metrics();
    const { originX, originY, tile } = this.boardMetrics;
    return { x: originX + col * tile + tile / 2, y: originY + row * tile + tile / 2, size: tile };
  }

  screenToBoard(x, y) {
    this.metrics();
    const { originX, originY, tile } = this.boardMetrics;
    return { row: Math.floor((y - originY) / tile), col: Math.floor((x - originX) / tile) };
  }

  pulse(zoom, shake) {
    this.camera.target = Math.max(this.camera.target, zoom);
    this.camera.shake = Math.max(this.camera.shake, shake);
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.9 + Math.random() * 2.8;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.1, size: 2 + Math.random() * 3.4, color, life: 420 + Math.random() * 420, maxLife: 840 });
    }
  }

  color(value) {
    if (value === OBSTACLE_DEVELOPMENT) return "#8a6a4a";
    return ["#000", "#79ddbf", "#f7c15f", "#e85c5c", "#7ba8ff", "#d783e6"][value] || "#f7f1df";
  }

  roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
}

new Game2026();

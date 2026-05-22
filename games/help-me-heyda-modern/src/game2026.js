const DPR = Math.min(window.devicePixelRatio || 1, 2);
const ROWS = 13;
const COLS = 8;
const ACTOR_MAX = 10;
const SAVE_KEY = "help-me-heyda-2026-story-progress";

const chapters = [
  ["Scene 1", "숲이 숨을 멈춘 날", "새벽 안개가 걷히자 숲의 심장부에 붉은 깃발이 꽂혀 있었다. 수목족 마을은 지도 위에서 이미 사라진 이름이 되었고, 멀리서는 쇳소리를 품은 불도저가 천천히 깨어났다.", "assets/story1.png"],
  ["Scene 2", "헤이다의 첫 걸음", "어른들은 포기했고 아이들은 숨었다. 하지만 헤이다는 오래된 토템을 품에 안고 마을 입구로 걸어간다. 그녀가 밀어내는 것은 돌조각이 아니라, 사라지려는 기억을 붙잡는 마지막 손길이다.", "assets/story2.png"],
  ["Scene 3", "토템의 노래", "같은 문양이 이어지는 순간 숲의 빛이 되살아난다. 토템은 길을 만들고, 길은 사람들을 불러 모은다. 콤보가 이어질수록 침묵하던 마을은 다시 노래하기 시작한다.", "assets/story3.png"],
  ["Final Scene", "도와줘, 헤이다", "마지막 대치의 순간, 헤이다는 불도저를 부수지 않는다. 대신 마을 사람들이 살아온 길과 이름을 보여준다. 이 싸움은 파괴가 아니라 기억을 지키는 이야기다.", "assets/story4.png"]
];

class Sound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.next = 0;
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
    if (!this.ctx) return;
    const cues = {
      start: [[392, 0, 0.1], [523, 0.08, 0.14], [784, 0.22, 0.18]],
      push: [[82, 0, 0.07], [165, 0.05, 0.08]],
      clear: [[523, 0, 0.08], [659, 0.08, 0.08], [880, 0.16, 0.16]],
      fail: [[139, 0, 0.16], [92, 0.13, 0.2]],
      menu: [[196, 0, 0.1], [294, 0.08, 0.12]],
      villain: [[73, 0, 0.12], [55, 0.1, 0.16]]
    };
    for (const [freq, delay, length] of cues[name] || cues.menu) {
      this.tone(freq, this.ctx.currentTime + delay, length, name === "push" ? "sawtooth" : "triangle", 0.055);
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
    this.stageFiles = [];
    this.stageCache = new Map();
    this.stage = 1;
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.stageResult = null;
    this.clearAdvanceAt = 0;
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
    this.mistakes = 0;
    this.message = "Ready";
    this.storyTime = 900;
    this.storyTimeMax = 900;
    this.clearBlastUntil = 0;
    this.debug = false;
    this.pointer = null;
    this.camera = { zoom: 1, target: 1, shake: 0 };
    this.particles = [];
    this.time = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 7200;
    this.sprites = {};
    this.cropCache = new Map();
    this.bind();
    this.resize();
    this.boot();
    this.show("intro");
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
      gameOverScreen: "assets/ChatGPT Image 2026년 5월 22일 오후 01_30_42 (2).png",
      totems: "assets/totem-block-sheet-source.png",
      villain: "assets/asu.png",
      bulldozer: "assets/buldoder.png",
      tent: "assets/tent.png"
    };
    for (const [key, src] of Object.entries(files)) {
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      const keepFullImage = key === "background" || key === "clearScreen" || key === "gameOverScreen";
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
    if (!this.stageFiles.length) return this.fallbackStage();
    const file = this.stageFiles[number - 1] || this.stageFiles[0];
    const res = await fetch(`../../help-me-heyda/public/legacy/data/${file}`);
    const text = await res.text();
    const board = text.trim().split(/\n/).map((line) => {
      const row = line.split(",").map((value) => this.normalizeBlock(Number.parseInt(value, 10) || 0, number));
      while (row.length < COLS) row.push(0);
      return row.slice(0, COLS);
    });
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    const normalized = board.slice(0, ROWS);
    this.stageCache.set(number, this.cloneBoard(normalized));
    return this.cloneBoard(normalized);
  }

  bind() {
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      this.sound.unlock();
      await this.handle(action);
    });
    this.canvas.addEventListener("pointerdown", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer = this.screenToBoard(event.clientX - rect.left, event.clientY - rect.top);
      if (this.handleResultTap(event.clientX - rect.left, event.clientY - rect.top)) return;
      if (this.gameOver) {
        this.openMenu();
        return;
      }
      if (this.pointer.row >= 1 && this.pointer.row <= 11) this.tapRow(this.pointer.row - 1);
    });
    window.addEventListener("keydown", async (event) => {
      if (this.screen === "menu") {
        const menuMap = { ArrowUp: "story", ArrowRight: "survival", ArrowDown: "help", ArrowLeft: "option" };
        if (menuMap[event.code]) {
          event.preventDefault();
          return this.handle(menuMap[event.code]);
        }
      }
      const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "push", Space: "push", Enter: "push", KeyD: "debug", Escape: "menu" };
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
    if (action === "story") return this.openStory();
    if (action === "survival") return this.startSurvival();
    if (action === "help") return this.show("help");
    if (action === "option") return this.openSettings();
    if (action === "debug") return this.toggleDebug();
    if (action.startsWith("dev-stage-")) return this.startStory(Number.parseInt(action.replace("dev-stage-", ""), 10) || 1);
    if (action === "dev-clear") return this.showResultShortcut("clear");
    if (action === "dev-gameover") return this.showResultShortcut("gameover");
    if (action === "prev-chapter") return this.setChapter(Math.max(0, this.chapter - 1));
    if (action === "next-chapter") {
      if (this.chapter < chapters.length - 1) return this.setChapter(this.chapter + 1);
      return this.startStory(this.getSavedStage());
    }
    if (action === "move-up" || action === "up") return this.move(-1);
    if (action === "move-down" || action === "down") return this.move(1);
    if (action === "push") return this.push();
  }

  openMenu() {
    this.sound.cue("menu");
    this.show("menu");
  }

  openStory() {
    this.setChapter(0);
    this.show("story");
  }

  openSettings() {
    this.sound.cue("menu");
    this.show("settings");
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
    this.resultState = type === "ending" ? "ending" : "clear";
    this.stageBestCombo = Math.max(this.stageBestCombo, 2);
    this.stageResult = {
      stage: this.stage,
      boardScore: 1200,
      clearBonus: 800,
      timeLeft: Math.ceil(this.storyTime),
      timeBonus: Math.ceil(this.storyTime) * 5,
      bestCombo: this.stageBestCombo,
      comboBonus: this.stageBestCombo * 100,
      stageScore: 2000 + Math.ceil(this.storyTime) * 5 + this.stageBestCombo * 100,
      totalScore: this.score + 2000 + Math.ceil(this.storyTime) * 5 + this.stageBestCombo * 100
    };
    this.message = type === "ending" ? "Ending Test" : "Clear Test";
    this.sound.cue("clear");
  }

  setChapter(index) {
    this.chapter = index;
    const [kicker, title, text, image] = chapters[index];
    document.querySelector("#chapterKicker").textContent = kicker;
    document.querySelector("#chapterTitle").textContent = title;
    document.querySelector("#chapterText").textContent = text;
    const chapterImage = document.querySelector("#chapterImage");
    if (chapterImage) chapterImage.src = image;
    this.sound.cue("menu");
  }

  show(name) {
    this.screen = name;
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
    this.app.classList.toggle("is-playing", name === "play");
  }

  async startStory(stage) {
    this.mode = "story";
    this.stage = stage;
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.clearAdvanceAt = 0;
    this.board = await this.loadStage(stage);
    this.actorY = 10;
    this.pendingPush = null;
    this.stoneFlag = stage < 7 ? 4 : stage < 10 ? 3 : stage < 14 ? 2 : 1;
    this.storyTimeMax = this.stageTime(stage);
    this.storyTime = this.storyTimeMax;
    this.clearBlastUntil = 0;
    if (stage === 1) this.score = 0;
    this.stageStartScore = this.score;
    this.stageBestCombo = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.message = `Stage ${stage}: 줄 터치 이동, 같은 줄 다시 터치 Push`;
    this.pulse(1.08, 0);
    this.sound.cue("start");
    this.updateHud();
    this.show("play");
  }

  async startSurvival() {
    this.mode = "survival";
    this.stageClear = false;
    this.gameOver = false;
    this.resultState = null;
    this.clearAdvanceAt = 0;
    this.board = this.emptyBoard();
    for (let row = 9; row <= 11; row += 1) {
      for (let col = 0; col < COLS - 1; col += 1) this.board[row][col] = this.randomBlock();
    }
    this.actorY = 10;
    this.pendingPush = null;
    this.stoneFlag = 0;
    this.storyTime = 0;
    this.clearBlastUntil = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 7200;
    this.score = 0;
    this.combo = 0;
    this.message = "4개 이상 같은 토템을 모으세요";
    this.pulse(1.08, 0);
    this.sound.cue("start");
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

  randomBlock(limit = this.availableBlockCount(this.stage)) {
    return Math.floor(Math.random() * limit) + 1;
  }

  normalizeBlock(value, stage = this.stage) {
    if (!value) return 0;
    return ((value - 1) % this.availableBlockCount(stage)) + 1;
  }

  availableBlockCount(stage) {
    if (stage <= 3) return 3;
    if (stage <= 5) return 4;
    if (stage <= 7) return 5;
    if (stage <= 9) return 6;
    if (stage <= 11) return 7;
    if (stage <= 13) return 8;
    if (stage <= 15) return 9;
    return 10;
  }

  stageTime(stage) {
    const times = [980, 950, 920, 890, 860, 830, 800, 770, 740, 710, 680, 650, 620, 600, 580, 560, 545, 540];
    return times[Math.min(stage - 1, times.length - 1)] || 540;
  }

  getTotalStages() {
    return this.stageFiles.length || 18;
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

  tapRow(row) {
    if (this.screen !== "play" || this.pendingPush || this.stageClear || this.gameOver) return;
    const nextY = Math.max(0, Math.min(ACTOR_MAX, row));
    if (nextY === this.actorY) {
      this.push();
      return;
    }
    this.actorY = nextY;
    this.message = `R${this.actorY + 1}: 한 번 더 터치하면 Push`;
    this.pulse(1.02, 0);
  }

  selectRow(row) {
    if (this.screen !== "play" || this.pendingPush || this.stageClear || this.gameOver) return;
    this.actorY = Math.max(0, Math.min(ACTOR_MAX, row));
    this.pulse(1.02, 0);
  }

  move(delta) {
    this.selectRow(this.actorY + delta);
  }

  push() {
    if (this.stageClear || this.gameOver) {
      return;
    }
    if (this.screen !== "play" || this.pendingPush) return;
    const row = this.actorY + 1;
    const block = this.board[row][0];
    if (!block) {
      this.message = "이 줄에는 밀 블록이 없습니다";
      this.sound.cue("fail");
      return;
    }
    for (let col = 0; col < COLS - 1; col += 1) this.board[row][col] = this.board[row][col + 1];
    this.board[row][COLS - 1] = 0;
    this.pendingPush = { block, row, start: performance.now(), duration: 280 };
    this.actorPushUntil = performance.now() + 190;
    this.message = `R${row} 토템 밀기`;
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
    this.checkBottom();
    this.settleOneStep();
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
    this.shiftUp();
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
      this.message = this.combo > 1 ? `콤보 ${this.combo}` : "바닥 클리어";
      this.pulse(1.18, 1);
      this.sound.cue("clear");
      this.checkStageClear();
    } else {
      this.combo = 0;
      this.mistakes += 1;
      this.message = "문양 불일치";
      this.shiftUp();
      this.sound.cue("fail");
    }
  }

  checkStageClear() {
    if (this.mode !== "story") return;
    for (let row = 1; row <= 11; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col]) return;
      }
    }
    if (this.board[12].some(Boolean)) return;
    this.stageClear = true;
    this.resultState = this.isFinalStage() ? "ending" : "clear";
    this.clearAdvanceAt = 0;
    const boardScore = this.score - this.stageStartScore;
    const clearBonus = Math.max(300, 1000 - this.mistakes * 80);
    const timeLeft = Math.ceil(this.storyTime);
    const timeBonus = timeLeft * 5;
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
    this.sound.cue("clear");
  }

  async nextStage() {
    const next = this.stage + 1;
    if (this.isFinalStage()) {
      this.resultState = "ending";
      this.message = "Ending: 마을의 길이 지켜졌습니다";
      return;
    }
    await this.startStory(next);
  }

  isFinalStage() {
    return this.stageFiles.length ? this.stage >= this.stageFiles.length : this.stage >= 18;
  }

  checkSurvivalBottom() {
    const counts = new Map();
    for (let col = 0; col <= 6; col += 1) {
      const value = this.board[12][col];
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    }
    const match = [...counts.entries()].find(([, count]) => count >= 4);
    if (match) {
      const [target] = match;
      for (let col = 0; col <= 6; col += 1) if (this.board[12][col] === target) this.board[12][col] = 0;
      this.combo += 1;
      this.score += 2 ** this.combo;
      this.message = `서바이벌 콤보 ${this.combo}`;
      this.pulse(1.18, 1);
      this.sound.cue("clear");
    } else if (this.board[12][0]) {
      this.combo = 0;
      this.message = "라인 상승";
      this.shiftUp();
    }
  }

  settleOneStep() {
    for (let row = ROWS - 3; row >= 1; row -= 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col] && !this.board[row + 1][col]) {
          this.board[row + 1][col] = this.board[row][col];
          this.board[row][col] = 0;
        }
      }
    }
  }

  shiftUp() {
    for (let row = 0; row < ROWS - 1; row += 1) this.board[row] = [...this.board[row + 1]];
    this.board[12] = Array(COLS).fill(0);
    this.pulse(1.1, 3);
  }

  survivalRise() {
    if (this.pendingPush) return;
    this.shiftUp();
    for (let col = 0; col <= 6; col += 1) this.board[12][col] = this.randomBlock();
    this.survivalDelay = Math.max(5200, this.survivalDelay - 80);
    this.message = "불도저 압박";
    this.sound.cue("villain");
  }

  updateHud() {
    document.querySelector("#timeLabel").textContent = this.mode === "story" ? String(Math.max(0, Math.ceil(this.storyTime))) : String(Math.ceil(this.survivalDelay / 1000));
    document.querySelector("#scoreLabel").textContent = String(this.score);
    document.querySelector("#comboLabel").textContent = String(this.combo);
  }

  endGame(reason) {
    if (this.gameOver || this.stageClear) return;
    this.gameOver = true;
    this.resultState = "gameover";
    this.pendingPush = null;
    this.message = reason;
    this.clearBlastUntil = 0;
    this.pulse(1.06, 4);
    this.sound.cue("fail");
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
    if (this.screen === "play" && this.mode === "story" && !this.stageClear && !this.gameOver) {
      this.storyTime = Math.max(0, this.storyTime - delta / 100);
      if (Math.floor(this.time / 120) !== Math.floor((this.time - delta) / 120)) this.updateHud();
      if (this.storyTime <= 0) {
        this.endGame("Game Over: 불도저가 마을에 도달했습니다");
      }
    }
    if (this.screen === "play" && this.mode === "survival" && !this.gameOver) {
      this.survivalTimer += delta;
      if (this.survivalTimer > this.survivalDelay) {
        this.survivalTimer = 0;
        this.survivalRise();
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
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawWorld(ctx);
    if (this.screen === "play") this.drawGame(ctx);
    this.drawParticles(ctx);
    if (this.screen === "play") this.drawResultOverlay(ctx);
    if (this.screen === "play") this.drawDebug(ctx);
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

      if (this.screen === "intro") this.drawTotem(ctx, this.width * 0.5, this.height * 0.42, 150);
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
    if (this.screen === "intro") this.drawTotem(ctx, this.width * 0.5, this.height * 0.42, 150);
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
      if (ny >= 0.78) this.openMenu();
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
        timeLeft: Math.ceil(this.storyTime),
        timeBonus: 0,
        bestCombo: this.stageBestCombo,
        comboBonus: 0,
        stageScore: this.score,
        totalScore: this.score
      };
      const panelX = this.width * 0.16;
      const panelY = this.height * 0.47;
      const panelW = this.width * 0.68;
      const lineH = Math.max(19, this.height * 0.023);
      ctx.fillStyle = "rgba(5, 8, 7, 0.56)";
      this.roundRect(ctx, panelX, panelY, panelW, lineH * 5.7, 8);
      ctx.fill();
      ctx.fillStyle = "#fff7d8";
      ctx.textAlign = "center";
      ctx.font = "900 18px Arial";
      ctx.fillText(this.resultState === "ending" ? "모든 스테이지 클리어" : `Stage ${result.stage} Clear`, this.width / 2, panelY + lineH * 1.05);
      ctx.font = "800 14px Arial";
      ctx.fillText(`스테이지 점수  ${result.stageScore.toLocaleString()}`, this.width / 2, panelY + lineH * 2.15);
      ctx.fillText(`남은 시간  ${result.timeLeft}s   보너스  ${result.timeBonus.toLocaleString()}`, this.width / 2, panelY + lineH * 3.15);
      ctx.fillText(`최대 콤보  ${result.bestCombo}   보너스  ${result.comboBonus.toLocaleString()}`, this.width / 2, panelY + lineH * 4.15);
      ctx.fillStyle = "#f7c15f";
      ctx.font = "900 16px Arial";
      ctx.fillText(`총 점수  ${result.totalScore.toLocaleString()}`, this.width / 2, panelY + lineH * 5.2);
    }
    if (this.resultState === "gameover") {
      ctx.fillStyle = "rgba(5, 8, 7, 0.42)";
      this.roundRect(ctx, this.width * 0.14, this.height * 0.62, this.width * 0.72, 42, 8);
      ctx.fill();
      ctx.fillStyle = "#fff7d8";
      ctx.textAlign = "center";
      ctx.font = "900 17px Arial";
      ctx.fillText(`Stage ${this.stage}  Score ${this.score}`, this.width / 2, this.height * 0.62 + 27);
    }
    if (this.resultState === "ending") {
      ctx.fillStyle = "rgba(5, 8, 7, 0.72)";
      this.roundRect(ctx, this.width * 0.1, this.height * 0.78, this.width * 0.8, 72, 8);
      ctx.fill();
      ctx.fillStyle = "#f7c15f";
      ctx.textAlign = "center";
      ctx.font = "900 20px Arial";
      ctx.fillText("마을은 다시 숲의 노래를 되찾았습니다", this.width / 2, this.height * 0.78 + 31);
      ctx.font = "800 14px Arial";
      ctx.fillText("터치하면 메뉴로 돌아갑니다", this.width / 2, this.height * 0.78 + 55);
    }
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
    const startX = this.width + 56;
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
    if (poseImage) {
      this.drawSpriteContain(ctx, poseImage, 0, 0, poseImage.width, poseImage.height, x, y - size * 0.08, size, size * 1.18, flip);
      return;
    }
    const sheet = this.sprites.hero;
    if (sheet) {
      const sw = sheet.width / 3;
      this.drawSpriteContain(ctx, sheet, sw * pose, 0, sw, sheet.height, x, y - size * 0.08, size, size * 1.18, flip);
      return;
    }
    ctx.fillStyle = "#f7c15f";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBlock(ctx, x, y, size, value) {
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

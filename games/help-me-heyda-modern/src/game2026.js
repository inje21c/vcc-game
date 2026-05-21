const DPR = Math.min(window.devicePixelRatio || 1, 2);
const ROWS = 13;
const COLS = 8;
const ACTOR_MAX = 10;

const chapters = [
  ["Chapter 1", "숲의 심장", "관광 개발의 표식이 새벽 숲에 박힌다. 모두가 침묵할 때, 헤이다는 마지막 토템을 들고 마을 입구로 걸어간다."],
  ["Chapter 2", "쇳소리의 새벽", "불도저의 엔진음이 가까워질수록 숲은 더 낮게 숨을 쉰다. 헤이다는 토템의 문양을 이어 길을 막고, 아이들은 그 뒤에서 첫 노래를 배운다."],
  ["Chapter 3", "토템의 노래", "같은 문양이 이어지는 순간 오래된 기억이 빛난다. 콤보는 점수가 아니라 마을 사람들이 되찾는 용기다."],
  ["Chapter 4", "헤이다의 손", "헤이다는 쇳덩이를 부수지 않는다. 대신 숲의 길과 사람들의 이름을 보여준다. 지켜야 할 것은 땅이 아니라 함께 살아온 시간이다."]
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
    this.board = this.emptyBoard();
    this.actorY = 10;
    this.pendingPush = null;
    this.actorPushUntil = 0;
    this.stoneFlag = 4;
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.message = "Ready";
    this.debug = false;
    this.pointer = null;
    this.camera = { zoom: 1, target: 1, shake: 0 };
    this.particles = [];
    this.time = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 7200;
    this.sprites = {};
    this.bind();
    this.resize();
    this.boot();
    this.show("intro");
    requestAnimationFrame((time) => this.tick(time));
  }

  async boot() {
    await Promise.all([this.loadSprites(), this.loadStages()]);
  }

  async loadSprites() {
    const files = {
      hero: "assets/heyda-character-sheet-source.png",
      totems: "assets/totem-block-sheet-source.png",
      villain: "assets/villain-bulldozer-sheet-source.png"
    };
    for (const [key, src] of Object.entries(files)) {
      const img = new Image();
      img.src = src;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      this.sprites[key] = this.stripGreen(img);
    }
  }

  stripGreen(img) {
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
      if (g > 150 && r < 105 && b < 135) pixels.data[i + 3] = 0;
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
      const row = line.split(",").map((value) => Number.parseInt(value, 10) || 0);
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
      if (this.pointer.row >= 1 && this.pointer.row <= 11) this.selectRow(this.pointer.row - 1);
    });
    window.addEventListener("keydown", async (event) => {
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
    if (action === "option" || action === "debug") return this.toggleDebug();
    if (action === "prev-chapter") return this.setChapter(Math.max(0, this.chapter - 1));
    if (action === "next-chapter") {
      if (this.chapter < chapters.length - 1) return this.setChapter(this.chapter + 1);
      return this.startStory(1);
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

  setChapter(index) {
    this.chapter = index;
    const [kicker, title, text] = chapters[index];
    document.querySelector("#chapterKicker").textContent = kicker;
    document.querySelector("#chapterTitle").textContent = title;
    document.querySelector("#chapterText").textContent = text;
    this.sound.cue("menu");
  }

  show(name) {
    this.screen = name;
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("is-active", screen.dataset.screen === name));
    this.app.classList.toggle("is-playing", name === "play");
  }

  async startStory(stage) {
    this.mode = "story";
    this.board = await this.loadStage(stage);
    this.actorY = 10;
    this.pendingPush = null;
    this.stoneFlag = stage < 7 ? 4 : stage < 10 ? 3 : stage < 14 ? 2 : 1;
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.message = "같은 토템을 바닥에 모으세요";
    this.pulse(1.08, 0);
    this.sound.cue("start");
    this.updateHud();
    this.show("play");
  }

  async startSurvival() {
    this.mode = "survival";
    this.board = this.emptyBoard();
    for (let row = 9; row <= 11; row += 1) {
      for (let col = 0; col < COLS - 1; col += 1) this.board[row][col] = this.randomBlock();
    }
    this.actorY = 10;
    this.pendingPush = null;
    this.stoneFlag = 0;
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

  randomBlock() {
    return Math.floor(Math.random() * 5) + 1;
  }

  selectRow(row) {
    if (this.screen !== "play" || this.pendingPush) return;
    this.actorY = Math.max(0, Math.min(ACTOR_MAX, row));
    this.pulse(1.02, 0);
  }

  move(delta) {
    this.selectRow(this.actorY + delta);
  }

  push() {
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
      this.score += 120 * this.combo;
      this.message = this.combo > 1 ? `콤보 ${this.combo}` : "바닥 클리어";
      this.pulse(1.18, 1);
      this.sound.cue("clear");
    } else {
      this.combo = 0;
      this.mistakes += 1;
      this.message = "문양 불일치";
      this.shiftUp();
      this.sound.cue("fail");
    }
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
    document.querySelector("#modeLabel").textContent = this.mode === "story" ? "Story" : "Survival";
    document.querySelector("#scoreLabel").textContent = String(this.score);
    document.querySelector("#comboLabel").textContent = String(this.combo);
  }

  tick(now) {
    const delta = Math.min(48, now - (this.last || now));
    this.last = now;
    this.time += delta;
    this.finishPush(now);
    if (this.screen === "play" && this.mode === "survival") {
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
    if (this.screen === "play") this.drawDebug(ctx);
  }

  drawWorld(ctx) {
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
    if (this.screen === "intro") this.drawTotem(ctx, this.width * 0.5, this.height * 0.42, 150);
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
    ctx.fillStyle = "rgba(5, 8, 7, 0.56)";
    this.roundRect(ctx, 14, this.height - 104, this.width - 28, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#f7f1df";
    ctx.font = "700 13px Arial";
    ctx.fillText(this.message, 28, this.height - 80);
  }

  drawVillain(ctx) {
    const sheet = this.sprites.villain;
    const progress = this.mode === "story" ? Math.min(1, this.mistakes / 5 + 0.08) : Math.min(1, this.survivalTimer / this.survivalDelay);
    const x = this.width - 44 - progress * 74 + Math.sin(this.time * 0.004) * 3;
    const y = 118;
    if (sheet) {
      ctx.drawImage(sheet, 0, 0, sheet.width * 0.56, sheet.height, x - 52, y - 42, 104, 74);
      ctx.drawImage(sheet, sheet.width * 0.56, 0, sheet.width * 0.44, sheet.height, 16, 116, 52, 70);
    } else {
      ctx.fillStyle = "#d9a323";
      this.roundRect(ctx, x - 48, y - 20, 92, 38, 8);
      ctx.fill();
      ctx.fillStyle = "#3b3326";
      ctx.fillRect(x - 34, y + 12, 70, 12);
    }
  }

  drawBoardPanel(ctx) {
    const { originX, originY, tile } = this.boardMetrics;
    ctx.fillStyle = "rgba(5, 8, 7, 0.58)";
    this.roundRect(ctx, originX - tile * 0.18, originY - tile * 0.18, tile * COLS + tile * 0.36, tile * ROWS + tile * 0.36, 16);
    ctx.fill();
  }

  drawBoard(ctx) {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = this.boardToScreen(row, col);
        ctx.strokeStyle = row === this.actorY + 1 ? "rgba(121, 221, 191, 0.48)" : "rgba(247, 241, 223, 0.1)";
        ctx.lineWidth = row === this.actorY + 1 ? 2 : 1;
        ctx.strokeRect(cell.x - cell.size / 2, cell.y - cell.size / 2, cell.size, cell.size);
        if (this.board[row][col]) this.drawBlock(ctx, cell.x, cell.y, cell.size * 0.88, this.board[row][col]);
      }
    }
    if (this.mode === "story") {
      for (let i = 0; i < this.stoneFlag; i += 1) {
        const cell = this.boardToScreen(12, 7 - i);
        this.drawTotem(ctx, cell.x, cell.y, cell.size);
      }
    }
  }

  drawPushBlock(ctx) {
    if (!this.pendingPush) return;
    const phase = Math.min(1, (performance.now() - this.pendingPush.start) / this.pendingPush.duration);
    const start = this.boardToScreen(this.pendingPush.row, -0.55);
    const end = this.boardToScreen(12, this.mode === "story" ? Math.max(0, 6 - this.stoneFlag) : 3);
    const t = phase < 0.45 ? 0 : (phase - 0.45) / 0.55;
    this.drawBlock(ctx, start.x, start.y + (end.y - start.y) * t, start.size * 0.88, this.pendingPush.block);
  }

  drawActor(ctx) {
    const row = this.board[this.actorY + 1];
    let empty = row.findIndex((value) => value === 0);
    if (empty < 1) empty = 1;
    const point = this.boardToScreen(this.actorY + 1, empty - 0.68);
    const pose = this.pendingPush || performance.now() < this.actorPushUntil ? 1 : this.mode === "survival" ? 2 : 0;
    this.drawHero(ctx, point.x, point.y + point.size * 0.08, point.size * 1.45, pose);
  }

  drawHero(ctx, x, y, size, pose) {
    const sheet = this.sprites.hero;
    if (sheet) {
      const sw = sheet.width / 3;
      ctx.drawImage(sheet, sw * pose, 0, sw, sheet.height, x - size * 0.5, y - size * 0.66, size, size * 1.18);
      return;
    }
    ctx.fillStyle = "#f7c15f";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBlock(ctx, x, y, size, value) {
    const sheet = this.sprites.totems;
    if (sheet) {
      const startX = sheet.width * 0.46;
      const blockW = (sheet.width - startX) / 5;
      const index = (value - 1) % 5;
      ctx.drawImage(sheet, startX + blockW * index, sheet.height * 0.08, blockW, sheet.height * 0.84, x - size / 2, y - size / 2, size, size);
      return;
    }
    ctx.fillStyle = this.color(value);
    this.roundRect(ctx, x - size / 2, y - size / 2, size, size, 8);
    ctx.fill();
  }

  drawTotem(ctx, x, y, size) {
    const sheet = this.sprites.totems;
    if (sheet) {
      ctx.drawImage(sheet, 0, 0, sheet.width * 0.42, sheet.height, x - size * 0.5, y - size * 0.72, size, size * 1.35);
      return;
    }
    ctx.fillStyle = "#d58a52";
    this.roundRect(ctx, x - size * 0.3, y - size * 0.55, size * 0.6, size * 1.1, 12);
    ctx.fill();
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
    const tile = Math.floor(Math.min((this.width - 44) / 9.35, (this.height - 226) / ROWS));
    this.boardMetrics = {
      tile,
      originX: Math.round((this.width - tile * COLS) / 2 + tile * 0.28),
      originY: Math.round(Math.max(96, (this.height - tile * ROWS) / 2 + 8))
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

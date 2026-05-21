const DPR = Math.min(window.devicePixelRatio || 1, 2);
const COLS = 7;
const ROWS = 10;

const chapters = [
  {
    kicker: "Chapter 1",
    title: "숲의 심장",
    text: "관광 개발의 표식이 새벽 숲에 박힌다. 모두가 침묵할 때, 헤이다는 마지막 토템을 들고 마을 입구로 걸어간다."
  },
  {
    kicker: "Chapter 2",
    title: "쇳소리의 새벽",
    text: "불도저의 엔진음이 가까워질수록 숲은 더 낮게 숨을 쉰다. 헤이다는 토템의 문양을 이어 길을 막고, 아이들은 그 뒤에서 첫 노래를 배운다."
  },
  {
    kicker: "Chapter 3",
    title: "토템의 노래",
    text: "같은 문양이 이어지는 순간 오래된 기억이 빛난다. 콤보는 점수가 아니라 마을 사람들이 되찾는 용기다."
  },
  {
    kicker: "Chapter 4",
    title: "헤이다의 손",
    text: "헤이다는 쇳덩이를 부수지 않는다. 대신 숲의 길과 사람들의 이름을 보여준다. 지켜야 할 것은 땅이 아니라 함께 살아온 시간이다."
  }
];

class AudioDirector {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.started = false;
    this.nextPulse = 0;
  }

  unlock() {
    if (!this.enabled) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      this.enabled = false;
      return;
    }
    if (!this.ctx) {
      this.ctx = new AudioContextClass();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.nextPulse = this.ctx.currentTime;
      this.loop();
    }
  }

  loop() {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    while (this.nextPulse < now + 0.5) {
      const step = Math.round(this.nextPulse * 2) % 8;
      const root = step % 4 === 0 ? 110 : 146.83;
      this.tone(root, this.nextPulse, 0.42, "sine", 0.035);
      if (step === 2 || step === 6) this.noise(this.nextPulse + 0.04, 0.06, 0.025);
      if (step === 7) this.tone(293.66, this.nextPulse + 0.1, 0.16, "triangle", 0.03);
      this.nextPulse += 0.5;
    }
    window.setTimeout(() => this.loop(), 180);
  }

  cue(name) {
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const cues = {
      start: [[392, 0, 0.11], [523.25, 0.09, 0.14], [783.99, 0.23, 0.22]],
      menu: [[196, 0, 0.1], [293.66, 0.08, 0.14], [440, 0.18, 0.16]],
      push: [[82.4, 0, 0.08], [164.8, 0.05, 0.08]],
      clear: [[523.25, 0, 0.08], [659.25, 0.07, 0.08], [880, 0.14, 0.18]],
      story: [[220, 0, 0.2], [330, 0.14, 0.22], [493.88, 0.28, 0.3]],
      fail: [[138.59, 0, 0.18], [92.5, 0.14, 0.24]]
    };
    for (const [freq, delay, length] of cues[name] || cues.menu) {
      this.tone(freq, now + delay, length, name === "push" ? "sawtooth" : "triangle", 0.06);
    }
    if (name === "clear") this.noise(now + 0.03, 0.22, 0.05);
  }

  tone(freq, start, length, type, volume) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + length + 0.04);
  }

  noise(start, length, volume) {
    const samples = Math.max(1, Math.floor(this.ctx.sampleRate * length));
    const buffer = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < samples; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / samples);
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.master);
    source.start(start);
  }
}

class ModernHeyda {
  constructor() {
    this.app = document.querySelector(".app");
    this.canvas = document.querySelector("#scene");
    this.ctx = this.canvas.getContext("2d");
    this.audio = new AudioDirector();
    this.screen = "intro";
    this.mode = "Story";
    this.chapter = 0;
    this.score = 0;
    this.combo = 0;
    this.heroRow = 6;
    this.camera = { zoom: 1, targetZoom: 1, shake: 0 };
    this.particles = [];
    this.time = 0;
    this.survivalTimer = 0;
    this.survivalDelay = 5200;
    this.board = this.createBoard();
    this.images = {};
    this.loadImages();
    this.bind();
    this.resize();
    this.show("intro");
    requestAnimationFrame((t) => this.tick(t));
  }

  loadImages() {
    for (const name of ["hero0", "hero1", "block", "stone", "logo", "title"]) {
      const img = new Image();
      img.src = `../../help-me-heyda/public/legacy/img/${name}.png`;
      this.images[name] = img;
    }
  }

  bind() {
    window.addEventListener("resize", () => this.resize());
    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      this.audio.unlock();
      this.handle(action);
    });
    window.addEventListener("keydown", (event) => {
      const map = { ArrowUp: "move-up", ArrowDown: "move-down", Space: "push", Enter: "push", Escape: "open-menu" };
      if (map[event.code]) {
        event.preventDefault();
        this.handle(map[event.code]);
      }
    });
  }

  resize() {
    const rect = this.app.getBoundingClientRect();
    this.width = Math.floor(rect.width);
    this.height = Math.floor(rect.height);
    this.canvas.width = Math.floor(this.width * DPR);
    this.canvas.height = Math.floor(this.height * DPR);
    this.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  handle(action) {
    if (action === "open-menu") {
      this.audio.cue("menu");
      this.show("menu");
      return;
    }
    if (action === "story") {
      this.chapter = 0;
      this.updateStory();
      this.audio.cue("story");
      this.show("story");
      return;
    }
    if (action === "survival") {
      this.startPlay("Survival");
      return;
    }
    if (action === "help") {
      this.show("help");
      return;
    }
    if (action === "option") {
      this.audio.enabled = !this.audio.enabled;
      this.audio.cue("menu");
      return;
    }
    if (action === "prev-chapter") {
      this.chapter = Math.max(0, this.chapter - 1);
      this.updateStory();
      this.audio.cue("story");
      return;
    }
    if (action === "next-chapter") {
      if (this.chapter < chapters.length - 1) {
        this.chapter += 1;
        this.updateStory();
        this.audio.cue("story");
      } else {
        this.startPlay("Story");
      }
      return;
    }
    if (action === "move-up") this.moveHero(-1);
    if (action === "move-down") this.moveHero(1);
    if (action === "push") this.pushBlock();
  }

  show(name) {
    this.screen = name;
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
    this.app.classList.toggle("is-playing", name === "play");
  }

  updateStory() {
    const chapter = chapters[this.chapter];
    document.querySelector("#chapterKicker").textContent = chapter.kicker;
    document.querySelector("#chapterTitle").textContent = chapter.title;
    document.querySelector("#chapterText").textContent = chapter.text;
  }

  startPlay(mode) {
    this.mode = mode;
    this.score = 0;
    this.combo = 0;
    this.heroRow = 6;
    this.board = this.createBoard(mode === "Survival" ? 5 : 4);
    this.survivalDelay = 6200;
    this.survivalTimer = 0;
    this.camera.targetZoom = 1.08;
    this.audio.cue("start");
    this.updateHud();
    this.show("play");
  }

  createBoard(seedRows = 4) {
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    for (let row = ROWS - seedRows; row < ROWS; row += 1) {
      for (let col = 1; col < COLS; col += 1) board[row][col] = this.randomTile();
    }
    return board;
  }

  randomTile() {
    return Math.floor(Math.random() * 5) + 1;
  }

  moveHero(delta) {
    if (this.screen !== "play") return;
    this.heroRow = Math.max(1, Math.min(ROWS - 2, this.heroRow + delta));
    this.camera.targetZoom = 1.04;
  }

  pushBlock() {
    if (this.screen !== "play") return;
    this.ensureBoardMetrics();
    const row = this.heroRow;
    const empty = this.board[row].findIndex((cell, index) => index > 0 && cell === 0);
    const col = empty === -1 ? 1 : empty;
    this.board[row][col] = this.randomTile();
    this.score += 10 + this.combo * 4;
    this.camera.targetZoom = 1.18;
    this.camera.shake = 8;
    this.spawnParticles(74, this.boardY(row), "#79ddbf", 18);
    this.audio.cue("push");
    this.resolveLines();
    this.updateHud();
  }

  resolveLines() {
    let cleared = 0;
    for (let row = 0; row < ROWS; row += 1) {
      const counts = new Map();
      for (let col = 1; col < COLS; col += 1) {
        const value = this.board[row][col];
        if (value) counts.set(value, (counts.get(value) || 0) + 1);
      }
      const matched = [...counts.values()].some((count) => count >= 4);
      if (matched) {
        for (let col = 1; col < COLS; col += 1) {
          if (this.board[row][col]) this.spawnParticles(this.boardX(col), this.boardY(row), this.tileColor(this.board[row][col]), 10);
          this.board[row][col] = 0;
        }
        cleared += 1;
      }
    }
    if (cleared > 0) {
      this.combo += cleared;
      this.score += cleared * 120 * Math.max(1, this.combo);
      this.camera.targetZoom = 1.24;
      this.audio.cue("clear");
    } else {
      this.combo = Math.max(0, this.combo - 1);
    }
  }

  dropSurvivalRow() {
    this.board.shift();
    const row = Array(COLS).fill(0);
    for (let col = 1; col < COLS; col += 1) row[col] = this.randomTile();
    this.board.push(row);
    this.camera.shake = 5;
    this.camera.targetZoom = 1.13;
    this.audio.cue("fail");
  }

  updateHud() {
    document.querySelector("#modeLabel").textContent = this.mode;
    document.querySelector("#scoreLabel").textContent = String(this.score);
    document.querySelector("#comboLabel").textContent = String(this.combo);
  }

  tick(now) {
    const delta = Math.min(48, now - (this.last || now));
    this.last = now;
    this.time += delta;
    if (this.screen === "play" && this.mode === "Survival") {
      this.survivalTimer += delta;
      if (this.survivalTimer > this.survivalDelay) {
        this.survivalTimer = 0;
        this.survivalDelay = Math.max(3800, this.survivalDelay - 90);
        this.dropSurvivalRow();
      }
    }
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.09;
    this.camera.targetZoom += (1 - this.camera.targetZoom) * 0.035;
    this.camera.shake *= 0.88;
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * delta / 16;
      p.y += p.vy * delta / 16;
      p.vy += 0.03 * delta / 16;
      p.life -= delta;
      return p.life > 0;
    });
    this.draw();
    requestAnimationFrame((t) => this.tick(t));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawWorld(ctx);
    if (this.screen === "play") this.drawBoard(ctx);
    this.drawParticles(ctx);
  }

  drawWorld(ctx) {
    const sky = ctx.createLinearGradient(0, 0, 0, this.height);
    sky.addColorStop(0, "#122d2d");
    sky.addColorStop(0.48, "#773b41");
    sky.addColorStop(0.78, "#d58a52");
    sky.addColorStop(1, "#08100d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.width, this.height);

    const sunY = this.height * 0.23 + Math.sin(this.time * 0.0004) * 12;
    ctx.fillStyle = "rgba(247, 193, 95, 0.7)";
    ctx.beginPath();
    ctx.arc(this.width * 0.72, sunY, 54, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 18; i += 1) {
      const x = (i * 53 + this.time * 0.009) % (this.width + 90) - 45;
      const h = 120 + Math.sin(i * 1.7) * 34;
      ctx.fillStyle = i % 2 ? "rgba(8, 36, 31, 0.86)" : "rgba(28, 45, 35, 0.82)";
      ctx.beginPath();
      ctx.moveTo(x, this.height);
      ctx.lineTo(x + 18, this.height - h);
      ctx.lineTo(x + 36, this.height);
      ctx.fill();
    }

    if (this.screen === "intro") {
      ctx.save();
      ctx.globalAlpha = 0.56 + Math.sin(this.time * 0.002) * 0.1;
      this.drawTotem(ctx, this.width * 0.5, this.height * 0.42, 126);
      ctx.restore();
    }
  }

  drawBoard(ctx) {
    this.ensureBoardMetrics();
    const { tile, originX, originY } = this;
    const boardH = tile * ROWS;

    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.camera.shake;
    const shakeY = (Math.random() - 0.5) * this.camera.shake;
    ctx.translate(this.width / 2 + shakeX, originY + boardH / 2 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.width / 2, -(originY + boardH / 2));

    ctx.fillStyle = "rgba(5, 8, 7, 0.54)";
    this.roundRect(ctx, originX - 10, originY - 10, tile * COLS + 20, boardH + 20, 14);
    ctx.fill();

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 1; col < COLS; col += 1) {
        const x = originX + col * tile;
        const y = originY + row * tile;
        ctx.strokeStyle = "rgba(247, 241, 223, 0.1)";
        ctx.strokeRect(x, y, tile, tile);
        const value = this.board[row][col];
        if (value) this.drawTile(ctx, x + 3, y + 3, tile - 6, value);
      }
    }

    const heroX = originX - tile * 0.8;
    const heroY = originY + this.heroRow * tile + tile * 0.5;
    this.drawHero(ctx, heroX, heroY, tile * 0.9);
    ctx.restore();
  }

  drawTile(ctx, x, y, size, value) {
    ctx.fillStyle = this.tileColor(value);
    this.roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(5, 8, 7, 0.32)";
    ctx.beginPath();
    ctx.arc(x + size * 0.5, y + size * 0.5, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHero(ctx, x, y, size) {
    const img = this.images.hero0;
    if (img?.complete && img.naturalWidth) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x - size * 0.5, y - size * 0.62, size, size * 1.2);
      return;
    }
    ctx.fillStyle = "#f7c15f";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.2, size * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a3f2c";
    this.roundRect(ctx, x - size * 0.22, y, size * 0.44, size * 0.42, 8);
    ctx.fill();
  }

  drawTotem(ctx, x, y, size) {
    ctx.fillStyle = "#d58a52";
    this.roundRect(ctx, x - size * 0.32, y - size * 0.5, size * 0.64, size, 18);
    ctx.fill();
    ctx.fillStyle = "#0f2b29";
    ctx.fillRect(x - size * 0.18, y - size * 0.28, size * 0.12, size * 0.12);
    ctx.fillRect(x + size * 0.06, y - size * 0.28, size * 0.12, size * 0.12);
    ctx.fillStyle = "#f7f1df";
    ctx.fillRect(x - size * 0.2, y + size * 0.12, size * 0.4, size * 0.08);
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

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 2 + Math.random() * 4,
        color,
        life: 420 + Math.random() * 420,
        maxLife: 840
      });
    }
  }

  boardX(col) {
    this.ensureBoardMetrics();
    return this.originX + col * this.tile + this.tile / 2;
  }

  boardY(row) {
    this.ensureBoardMetrics();
    return this.originY + row * this.tile + this.tile / 2;
  }

  ensureBoardMetrics() {
    const boardW = this.width * 0.72;
    this.tile = Math.floor(boardW / COLS);
    const boardH = this.tile * ROWS;
    this.originX = (this.width - this.tile * COLS) / 2;
    this.originY = Math.max(104, (this.height - boardH) / 2 + 20);
  }

  tileColor(value) {
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

new ModernHeyda();

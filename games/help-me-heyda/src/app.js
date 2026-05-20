const LOGICAL_WIDTH = 120;
const LOGICAL_HEIGHT = 132;
const BOARD_X = 15;
const BOARD_Y = 5;
const BOTTOM_Y = 105;
const TILE_W = 12;
const TILE_H = 8;
const ROWS = 13;
const COLS = 8;

const imageNames = [
  "title", "grid", "bg1", "bg2", "bg3", "back", "block", "stone",
  "feather", "feather_number", "combo", "logo", "cursor",
  "enemy0", "enemy1", "boom0", "boom1", "boom2",
  "hero0", "hero1", "hero2", "hero3", "hero4", "hero5",
  "s_hero0", "s_hero1", "s_hero2", "s_hero3",
  "tent0", "tent1", "button0", "button1"
];

class HeydaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.images = {};
    this.stageFiles = [];
    this.stageCache = new Map();
    this.scene = "loading";
    this.mode = "story";
    this.stage = 1;
    this.score = 0;
    this.mistakes = 0;
    this.combo = 0;
    this.skill = 0;
    this.time = 900;
    this.actorY = 10;
    this.stoneFlag = 4;
    this.actorPushUntil = 0;
    this.blockRectTick = 0;
    this.pendingPush = null;
    this.message = "자료를 불러오는 중";
    this.board = this.emptyBoard();
    this.lastTick = 0;
  }

  async init() {
    await Promise.all([this.loadImages(), this.loadStageManifest()]);
    await this.startStory(1);
    this.renderRows();
    requestAnimationFrame((time) => this.loop(time));
  }

  async loadImages() {
    const entries = await Promise.all(imageNames.map(async (name) => {
      const img = new Image();
      img.src = `legacy/img/${name}.png`;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      return [name, img];
    }));
    this.images = Object.fromEntries(entries);
  }

  async loadStageManifest() {
    const response = await fetch("legacy/stages.json");
    const manifest = await response.json();
    this.stageFiles = manifest.files;
  }

  async loadStage(number) {
    if (this.stageCache.has(number)) {
      return this.cloneBoard(this.stageCache.get(number));
    }
    const file = this.stageFiles[number - 1] || this.stageFiles[0];
    const response = await fetch(`legacy/data/${file}`);
    const text = await response.text();
    const board = text.trim().split(/\n/).map((line) => {
      const values = line.split(",").map((value) => Number.parseInt(value, 10) || 0);
      while (values.length < COLS) values.push(0);
      return values.slice(0, COLS);
    });
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    this.stageCache.set(number, this.cloneBoard(board.slice(0, ROWS)));
    return this.cloneBoard(board.slice(0, ROWS));
  }

  async startStory(stage = 1) {
    this.mode = "story";
    this.scene = "play";
    this.stage = Math.max(1, Math.min(stage, this.stageFiles.length || 18));
    this.board = await this.loadStage(this.stage);
    this.actorY = 10;
    this.pendingPush = null;
    this.time = 900;
    this.combo = 0;
    this.skill = 0;
    this.mistakes = 0;
    this.stoneFlag = this.getStoneFlag(this.stage);
    this.message = "같은 블록으로 아래 줄을 채우세요";
    this.updateHud();
  }

  startSurvival() {
    this.mode = "survival";
    this.scene = "play";
    this.stage = 0;
    this.board = this.emptyBoard();
    for (let row = 10; row <= 11; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        this.board[row][col] = this.randomBlock();
      }
    }
    this.actorY = 10;
    this.pendingPush = null;
    this.time = 900;
    this.score = 0;
    this.combo = 0;
    this.skill = 5;
    this.stoneFlag = 0;
    this.message = "같은 블록 4개를 모으세요";
    this.updateHud();
  }

  emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  cloneBoard(board) {
    return board.map((row) => [...row]);
  }

  getStoneFlag(stage) {
    if (stage > 0 && stage < 7) return 4;
    if (stage > 6 && stage < 10) return 3;
    if (stage > 9 && stage < 14) return 2;
    if (stage > 13 && stage < 17) return 1;
    return 0;
  }

  randomBlock() {
    return Math.floor(Math.random() * 10) + 1;
  }

  loop(time) {
    const delta = time - this.lastTick;
    this.lastTick = time;
    this.finishPushAnimation(time);
    if (this.scene === "play" && delta < 1000) {
      this.time = Math.max(0, this.time - delta / 1000 * 8);
      if (this.time === 0) this.endGame("시간 종료");
    }
    this.draw();
    requestAnimationFrame((next) => this.loop(next));
  }

  moveActor(amount) {
    if (this.scene !== "play") return;
    if (this.pendingPush) return;
    this.actorY = Math.max(0, Math.min(10, this.actorY + amount));
  }

  selectRow(row) {
    if (this.scene !== "play") return;
    if (this.pendingPush) return;
    this.actorY = Math.max(0, Math.min(10, row));
  }

  async push() {
    if (this.scene === "score") {
      await this.nextStage();
      return;
    }
    if (this.scene !== "play") return;
    if (this.pendingPush) return;
    const row = this.actorY + 1;
    const block = this.board[row][0];
    if (!block) {
      this.message = "이 줄에는 밀 블록이 없습니다";
      return;
    }
    for (let col = 0; col < COLS - 1; col += 1) {
      this.board[row][col] = this.board[row][col + 1];
    }
    this.board[row][COLS - 1] = 0;
    const now = performance.now();
    this.pendingPush = {
      block,
      row,
      start: now,
      duration: 260
    };
    this.actorPushUntil = now + 180;
    this.updateHud();
  }

  useSkill() {
    if (this.scene !== "play") return;
    if (this.pendingPush) return;
    if (this.skill < 5) {
      this.message = "스킬 포인트가 부족합니다";
      return;
    }
    const target = this.board[this.actorY + 1][0];
    if (!target) return;
    this.skill -= 5;
    for (let row = 1; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col] === target) this.board[row][col] = 0;
      }
    }
    this.settleBlocksOneStep();
    this.message = `${target}번 블록 제거`;
    this.updateHud();
  }

  settleBlocksOneStep() {
    for (let row = ROWS - 2; row >= 1; row -= 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col] && !this.board[row + 1][col]) {
          this.board[row + 1][col] = this.board[row][col];
          this.board[row][col] = 0;
        }
      }
    }
  }

  finishPushAnimation(time) {
    if (!this.pendingPush) return;
    if (time - this.pendingPush.start < this.pendingPush.duration) return;
    const { block } = this.pendingPush;
    this.pendingPush = null;
    this.addBottomBlock(block);
    this.checkClear();
    this.settleBlocksOneStep();
    this.updateHud();
  }

  addBottomBlock(block) {
    const lastCol = this.mode === "story" ? 6 - this.stoneFlag : 6;
    for (let col = lastCol; col >= 0; col -= 1) {
      if (!this.board[12][col]) {
        this.board[12][col] = block;
        return;
      }
    }
    this.shiftBoardUp();
    this.board[12][lastCol] = block;
  }

  checkClear() {
    if (this.mode === "story") {
      this.checkStoryBottom();
      if (this.isStoryStageEmpty()) {
        this.scene = "score";
        const stageScore = Math.max(0, Math.round(this.time) * 5 - this.mistakes * 5);
        this.score += stageScore;
        this.message = `스테이지 클리어 +${stageScore}`;
      }
      return;
    }
    this.checkSurvivalBottom();
  }

  checkStoryBottom() {
    const lastCol = 6 - this.stoneFlag;
    const values = this.board[12].slice(0, lastCol + 1).filter(Boolean);
    if (values.length <= lastCol) return;
    const same = values.every((value) => value === values[0]);
    if (same) {
      for (let col = 0; col <= lastCol; col += 1) this.board[12][col] = 0;
      this.combo += 1;
      if (this.combo > 1) this.skill += 1;
      this.message = this.combo > 1 ? `콤보 ${this.combo}` : "바닥 클리어";
    } else {
      this.shiftBoardUp();
      this.combo = 0;
      this.mistakes += 1;
      this.message = "실수";
    }
  }

  checkSurvivalBottom() {
    const counts = new Map();
    for (let col = 0; col <= 6; col += 1) {
      const value = this.board[12][col];
      if (!value) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    const matched = [...counts.entries()].find(([, count]) => count >= 4);
    if (matched) {
      const [target] = matched;
      for (let col = 0; col <= 6; col += 1) {
        if (this.board[12][col] === target) this.board[12][col] = 0;
      }
      this.combo += 1;
      this.score += 2 ** this.combo;
      if (this.combo > 1) this.skill += 1;
      this.message = `서바이벌 콤보 ${this.combo}`;
    } else if (this.board[12][0]) {
      this.shiftBoardUp();
      this.combo = 0;
      this.message = "라인 상승";
    }
  }

  shiftBoardUp() {
    for (let row = 0; row < ROWS - 1; row += 1) {
      this.board[row] = [...this.board[row + 1]];
    }
    this.board[12] = Array(COLS).fill(0);
    if (this.board[0].some(Boolean)) this.endGame("블록이 화면을 넘었습니다");
  }

  isStoryStageEmpty() {
    for (let row = 1; row <= 11; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (this.board[row][col]) return false;
      }
    }
    return true;
  }

  async nextStage() {
    if (this.stage >= this.stageFiles.length) {
      this.endGame("엔딩");
      return;
    }
    await this.startStory(this.stage + 1);
  }

  pause() {
    if (this.scene === "play") {
      this.scene = "pause";
      this.message = "일시정지";
    } else if (this.scene === "pause") {
      this.scene = "play";
      this.message = "재개";
    }
  }

  help() {
    this.scene = "help";
    this.message = "행 선택 후 밀기";
  }

  endGame(message) {
    this.scene = "gameover";
    this.message = message;
  }

  draw() {
    this.ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (this.scene === "loading") {
      this.drawPanel("LOADING", this.message);
      return;
    }
    this.drawGameFrame();
    this.drawBoard();
    this.drawPushBlock();
    this.drawActor();
    this.drawHudText();
    if (this.scene === "score") this.drawPanel("CLEAR", "밀기 버튼으로 다음 스테이지");
    if (this.scene === "pause") this.drawPanel("PAUSE", "Ⅱ 버튼으로 계속");
    if (this.scene === "gameover") this.drawPanel("GAME OVER", this.message);
    if (this.scene === "help") this.drawPanel("HELP", "행 선택 → 밀기 / 스킬은 같은 블록 제거");
  }

  drawGameFrame() {
    this.ctx.fillStyle = "#100f0c";
    this.ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.drawImage("bg1", 0, 0);
    this.drawImage("bg2", 0, 13);
    this.drawImage("bg3", 0, 101);
    this.drawImage("back", 16, 12);
    this.drawImage("feather", 100, 106);
    if (this.mode === "story") {
      this.drawImage(this.scene === "gameover" ? "tent1" : "tent0", 17, this.scene === "gameover" ? 2 : 1);
    }
    this.drawEnemy();
  }

  drawBoard() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const value = this.board[row][col];
        if (!value) continue;
        const x = BOARD_X + col * TILE_W;
        const y = row < 12 ? BOARD_Y + row * TILE_H : BOTTOM_Y;
        this.drawBlock(value, x, y);
      }
    }
    for (let k = 0; k < this.stoneFlag; k += 1) {
      if (this.mode === "story") this.drawImage("stone", 88 - k * TILE_W, BOTTOM_Y);
    }
  }

  drawBlock(value, x, y) {
    const img = this.images.block;
    if (!img || !img.complete || !img.naturalWidth) {
      this.ctx.fillStyle = this.blockColor(value);
      this.ctx.fillRect(x, y, TILE_W - 1, TILE_H - 1);
      return;
    }
    const index = Math.max(0, Math.min(11, value - 1));
    const sx = 0;
    const sy = index * TILE_H;
    this.ctx.drawImage(img, sx, sy, TILE_W, TILE_H, x, y, TILE_W, TILE_H);
  }

  blockColor(value) {
    const colors = ["#c84d38", "#e2b84a", "#6eb65d", "#4a9dcf", "#9d73c9", "#d16b9e"];
    return colors[value % colors.length];
  }

  drawActor() {
    const row = this.board[this.actorY + 1] || [];
    let firstEmpty = row.findIndex((value) => value === 0);
    if (firstEmpty < 0) firstEmpty = COLS - 1;
    if (firstEmpty === 0) firstEmpty = 1;

    const selectedY = 13 + this.actorY * TILE_H;
    const blink = this.blockRectTick % 4;
    this.ctx.strokeStyle = ["#ffffff", "#8a8a8a", "#000000", "#8a8a8a"][blink];
    this.ctx.strokeRect(15.5, selectedY + 0.5, 11, 7);
    this.blockRectTick = (this.blockRectTick + 1) % 4;

    const prefix = this.mode === "survival" ? "s_hero" : "hero";
    const isPushing = performance.now() < this.actorPushUntil;
    const frame = isPushing ? 1 : 0;
    const x = isPushing ? 24 + firstEmpty * TILE_W : 28 + (firstEmpty - 1) * TILE_W;
    const y = 4 + this.actorY * TILE_H;
    this.drawImage(`${prefix}${frame}`, x, y);
  }

  drawPushBlock() {
    if (!this.pendingPush) return;
    const elapsed = performance.now() - this.pendingPush.start;
    const phase = Math.min(1, elapsed / this.pendingPush.duration);
    const sourceY = 13 + this.pendingPush.row * TILE_H;
    const targetY = Math.min(53 + this.pendingPush.row * TILE_H, 102);
    const y = phase < 0.45
      ? sourceY
      : sourceY + (targetY - sourceY) * ((phase - 0.45) / 0.55);
    this.drawBlock(this.pendingPush.block, 1, Math.round(y));
  }

  drawEnemy() {
    const frame = Math.floor(performance.now() / 220) % 2;
    if (this.mode === "story") {
      this.drawImage(`enemy${frame}`, 112 - Math.floor((900 - this.time) / 10), 3);
      return;
    }
    this.drawImage(`enemy${frame}`, 74, 3);
  }

  drawHudText() {
    this.ctx.fillStyle = "#fff7c7";
    this.ctx.font = "7px monospace";
    this.ctx.fillText(this.mode.toUpperCase(), 4, 8);
    this.ctx.fillText(`T ${Math.ceil(this.time)}`, 38, 8);
    this.ctx.fillText(`S ${this.score}`, 76, 8);
    this.ctx.fillText(this.message.slice(0, 22), 4, 126);
  }

  drawPanel(title, body) {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    this.ctx.fillRect(10, 37, 100, 50);
    this.ctx.strokeStyle = "#f0d76c";
    this.ctx.strokeRect(10.5, 37.5, 99, 49);
    this.ctx.fillStyle = "#f8e57a";
    this.ctx.font = "10px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(title, 60, 55);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = "6px monospace";
    this.ctx.fillText(body, 60, 70);
    this.ctx.textAlign = "left";
  }

  drawImage(name, x, y) {
    const img = this.images[name];
    if (img && img.complete && img.naturalWidth) this.ctx.drawImage(img, x, y);
  }

  updateHud() {
    document.getElementById("modeLabel").textContent = this.mode.toUpperCase();
    document.getElementById("stageLabel").textContent = this.mode === "story" ? `STAGE ${this.stage}` : "SURVIVAL";
    document.getElementById("scoreLabel").textContent = `SCORE ${this.score}`;
  }

  renderRows() {
    const root = document.getElementById("rowSelect");
    root.innerHTML = "";
    for (let row = 0; row <= 10; row += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(row + 1);
      button.dataset.row = String(row);
      button.addEventListener("click", () => this.selectRow(row));
      root.append(button);
    }
  }
}

const game = new HeydaGame(document.getElementById("game"));
await game.init();

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "up") game.moveActor(-1);
  if (action === "down") game.moveActor(1);
  if (action === "push") await game.push();
  if (action === "skill") game.useSkill();
  if (action === "pause") game.pause();
  if (action === "story") await game.startStory(1);
  if (action === "survival") game.startSurvival();
  if (action === "help") game.help();
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "ArrowUp") game.moveActor(-1);
  if (event.key === "ArrowDown") game.moveActor(1);
  if (event.key === "ArrowLeft" || event.key === " ") await game.push();
  if (event.key === "ArrowRight") game.useSkill();
  if (event.key === "Escape") game.pause();
});

function envValue(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const REPO = envValue(process.env.GITHUB_REPOSITORY) || "inje21c/vcc-game";
const TOKEN = envValue(process.env.GITHUB_ISSUES_TOKEN);
const INVITE_CODE = envValue(process.env.BETA_REPORT_CODE);
const LABEL_SOURCE = Object.prototype.hasOwnProperty.call(process.env, "BETA_REPORT_LABELS")
  ? envValue(process.env.BETA_REPORT_LABELS)
  : "beta";
const LABELS = LABEL_SOURCE
  .split(",")
  .map((label) => label.trim())
  .filter(Boolean);
const recentSubmissions = new Map();

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function rateLimited(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const previous = recentSubmissions.get(ip) || 0;
  recentSubmissions.set(ip, now);
  return now - previous < 30000;
}

function clean(value, limit = 2000) {
  return String(value || "").trim().slice(0, limit);
}

function titleFor(data) {
  const kind = clean(data.kind, 40) || "리포트";
  const area = clean(data.area, 80) || "위치 미입력";
  return `[Beta] ${kind}: ${area}`.slice(0, 120);
}

function bodyFor(data) {
  const fields = [
    ["제보자", clean(data.nickname, 120) || "미입력"],
    ["제보 종류", clean(data.kind, 80) || "미입력"],
    ["발생 위치", clean(data.area, 200) || "미입력"],
    ["무슨 일이 있었나요?", clean(data.description, 4000) || "미입력"],
    ["어떻게 바뀌면 좋을까요?", clean(data.expected, 2000) || "미입력"],
    ["기기/브라우저", clean(data.device, 500) || "미입력"],
    ["플레이 URL", clean(data.url, 500) || "미입력"],
    ["User Agent", clean(data.userAgent, 500) || "미입력"],
    ["화면 크기", clean(data.viewport, 120) || "미입력"],
    ["작성 시각", new Date().toISOString()]
  ];

  return fields.map(([label, value]) => `### ${label}\n\n${value}`).join("\n\n");
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    if (req.body.length > 20000) throw new Error("Payload too large");
    return JSON.parse(req.body || "{}");
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.length > 20000) throw new Error("Payload too large");
  return JSON.parse(raw || "{}");
}

function githubHeaders() {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "vcc-game-beta-report",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

async function createIssue(issue) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: githubHeaders(),
    body: JSON.stringify(issue)
  });
  const result = await response.json().catch(() => ({}));
  return { response, result };
}

function isLabelError(response, result) {
  const text = JSON.stringify(result || {}).toLowerCase();
  return response.status === 422 && text.includes("label");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, message: "POST only" });
    return;
  }

  if (!TOKEN) {
    send(res, 500, { ok: false, message: "Server is missing GITHUB_ISSUES_TOKEN." });
    return;
  }

  if (!INVITE_CODE) {
    send(res, 500, { ok: false, message: "Server is missing BETA_REPORT_CODE." });
    return;
  }

  let data;
  try {
    data = await readJson(req);
  } catch {
    send(res, 400, { ok: false, message: "리포트 형식이 올바르지 않습니다." });
    return;
  }

  if (clean(data.website)) {
    send(res, 200, { ok: true, message: "접수되었습니다." });
    return;
  }

  if (clean(data.inviteCode, 120) !== clean(INVITE_CODE, 120)) {
    send(res, 403, { ok: false, message: "초대코드가 맞지 않습니다." });
    return;
  }

  if (!clean(data.description, 4000)) {
    send(res, 400, { ok: false, message: "무슨 일이 있었는지 입력해주세요." });
    return;
  }

  if (rateLimited(req)) {
    send(res, 429, { ok: false, message: "잠시 후 다시 보내주세요." });
    return;
  }

  const issue = {
    title: titleFor(data),
    body: bodyFor(data)
  };
  if (LABELS.length) issue.labels = LABELS;

  let { response, result } = await createIssue(issue);
  if (!response.ok && issue.labels && isLabelError(response, result)) {
    const fallbackIssue = { ...issue };
    delete fallbackIssue.labels;
    ({ response, result } = await createIssue(fallbackIssue));
  }

  if (!response.ok) {
    send(res, 502, { ok: false, message: "GitHub 이슈 생성에 실패했습니다.", detail: result.message || response.statusText });
    return;
  }

  send(res, 200, { ok: true, message: "리포트가 접수되었습니다.", issueUrl: result.html_url });
};

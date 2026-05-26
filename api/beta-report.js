const REPO = process.env.GITHUB_REPOSITORY || "vibecoding001/vcc-game";
const TOKEN = process.env.GITHUB_ISSUES_TOKEN;
const INVITE_CODE = process.env.BETA_REPORT_CODE;
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
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.length > 20000) throw new Error("Payload too large");
  return JSON.parse(raw || "{}");
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

  if (rateLimited(req)) {
    send(res, 429, { ok: false, message: "잠시 후 다시 보내주세요." });
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

  if (clean(data.inviteCode, 120) !== INVITE_CODE) {
    send(res, 403, { ok: false, message: "초대코드가 맞지 않습니다." });
    return;
  }

  if (!clean(data.description, 4000)) {
    send(res, 400, { ok: false, message: "무슨 일이 있었는지 입력해주세요." });
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: "POST",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "vcc-game-beta-report",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    body: JSON.stringify({
      title: titleFor(data),
      body: bodyFor(data),
      labels: ["beta"]
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    send(res, 502, { ok: false, message: "GitHub 이슈 생성에 실패했습니다.", detail: result.message || response.statusText });
    return;
  }

  send(res, 200, { ok: true, message: "리포트가 접수되었습니다.", issueUrl: result.html_url });
};

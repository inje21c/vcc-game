const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 5173;
const mimes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safe = path.normalize(urlPath).replace(/^(\.\.[\\/])+/, '');
  let filePath = path.join(root, safe);
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch {}
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('404: ' + urlPath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': mimes[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.log('서버 시작: http://localhost:' + port + '/games/help-me-heyda-modern/public/');
  console.log('종료: Ctrl+C');
});

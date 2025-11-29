// Lightweight static server for the main website (no external deps)
// Serves files from the project root on http://localhost:8080

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname; // project root containing index.html
const PORT = process.env.SITE_PORT || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, data, headers = {}) {
  res.writeHead(status, headers);
  if (data) res.end(data); else res.end();
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return send(res, 404, 'Not found');
      return send(res, 500, 'Server error');
    }
    send(res, 200, data, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  });
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let safePath = path.normalize(urlPath).replace(/^\/+/, '');
    if (!safePath || safePath === '') safePath = 'index.html';
    let filePath = path.join(ROOT, safePath);

    // If directory, serve index.html inside it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      // fallback to root index
      return serveFile(path.join(ROOT, 'index.html'), res);
    }

    serveFile(filePath, res);
  } catch (e) {
    send(res, 500, 'Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Site server running at http://localhost:${PORT}`);
});



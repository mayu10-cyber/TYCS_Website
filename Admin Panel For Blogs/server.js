const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5050;

// Configure paths: admin runs beside the website folder
const SITE_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = SITE_ROOT; // site root contains index.html etc.
const ASSETS_DIR = path.join(PUBLIC_DIR, 'assets');
const BLOGS_JSON = path.join(ASSETS_DIR, 'blogs.json');

// Where new blog files will be created
const BLOG_OUTPUT_DIR = PUBLIC_DIR; // write blogN.html to site root

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve the admin UI first
app.use('/', express.static(path.join(__dirname, 'static')));
// Also serve the main site (so /assets/... and /blogN.html resolve for previews and Open links)
app.use('/', express.static(PUBLIC_DIR));

// Configure multer storage into site assets
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    try {
      if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
      cb(null, ASSETS_DIR);
    } catch (e) {
      cb(e, ASSETS_DIR);
    }
  },
  filename: function (_req, file, cb) {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(safe);
    const base = path.basename(safe, ext);
    cb(null, `${base}-${timestamp}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Upload image endpoint
app.post('/api/upload-image', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 20MB)' : 'Upload failed';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
      const relPath = path.join('assets', path.basename(req.file.path)).replace(/\\/g, '/');
      return res.json({ path: relPath });
    } catch (e) {
      console.error('Post-upload processing error:', e);
      return res.status(500).json({ error: 'Internal error after upload' });
    }
  });
});

// Helper: find next blog file name blogX.html
function getNextBlogFilename() {
  const files = fs.readdirSync(BLOG_OUTPUT_DIR);
  const nums = files
    .map((f) => {
      const m = f.match(/^blog(\d+)\.html$/i);
      return m ? parseInt(m[1], 10) : null;
    })
    .filter((n) => Number.isInteger(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `blog${next}.html`;
}

// Create blog endpoint
app.post('/api/create-blog', (req, res) => {
  try {
    const {
      title, // H2 and page subject
      pageTitle, // <title>
      publishDate, // yyyy-mm-dd
      introParagraphs = [], // array of paragraphs
      imageSrc, // assets/... or http(s) link
      backHref = 'index.html' // default back link
    } = req.body;

    if (!title || !pageTitle || !publishDate || !imageSrc) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const filename = getNextBlogFilename();
    const outPath = path.join(BLOG_OUTPUT_DIR, filename);

    const html = generateBlogHtml({ title, pageTitle, publishDate, introParagraphs, imageSrc, backHref });
    fs.writeFileSync(outPath, html, 'utf8');

    // Update assets/blogs.json
    upsertBlogsJson({
      pageTitle,
      title,
      date: publishDate,
      image: imageSrc,
      link: filename,
      backHref,
      paragraphs: Array.isArray(introParagraphs) ? introParagraphs : [],
      excerpt: (Array.isArray(introParagraphs) && introParagraphs[0]) ? String(introParagraphs[0]).slice(0, 180) : ''
    });

    // Optionally append to index.html blog list? We keep the main site static per request
    return res.json({ ok: true, filename, url: `/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

function generateBlogHtml({ title, pageTitle, publishDate, introParagraphs, imageSrc, backHref }) {
  const safeParas = Array.isArray(introParagraphs) ? introParagraphs : [];
  const parasHtml = safeParas
    .map(p => `<p>${escapeHtml(p)}</p>`) 
    .join('\n\n            ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(pageTitle)}</title>
    <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .container { display: flex; flex-wrap: wrap; gap: 40px; }
        .content { flex: 1; min-width: 300px; }
        .image-container { width: 400px; }
        .image-container img { width: 700px; height: auto; border-radius: 2rem; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top: 80px; }
        h1 { color: #2c3e50; font-size: 2.2rem; margin-bottom: 20px; }
        .meta { color: #7f8c8d; font-style: italic; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        p { margin-bottom: 20px; font-size: 1.1rem; }
        .back-button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 1rem; margin-top: 30px; transition: background-color 0.3s; }
        .back-button:hover { background-color: #2980b9; }
        .divider { border-top: 1px solid #eee; margin: 40px 0; }
        h2 { color: #2c3e50; font-size: 1.8rem; }
        @media (max-width: 900px) { .container { flex-direction: column; } .image-container img { width: 100%; margin-bottom: 30px; } body { padding: 15px; } h1 { font-size: 1.8rem; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <a href="${escapeAttr(backHref)}" class="back-button">Back to Home</a>
            <h2>${escapeHtml(title)}</h2>
            <div class="meta">Published on: ${escapeHtml(publishDate)}</div>
            ${parasHtml}
            <div class="divider"></div>
        </div>
        <div class="image-container">
            <img src="${escapeAttr(imageSrc)}" alt="${escapeAttr(title)}">
        </div>
    </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function decodeHtmlEntities(str) {
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractParagraphsFromHtml(html) {
  try {
    const result = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = pRegex.exec(html)) !== null) {
      const inner = match[1]
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      const cleaned = decodeHtmlEntities(inner).trim();
      if (cleaned) result.push(cleaned);
    }
    return result;
  } catch {
    return [];
  }
}

app.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}`);
  console.log(`Writing blogs to: ${BLOG_OUTPUT_DIR}`);
  console.log(`Uploading images to: ${ASSETS_DIR}`);
});

function upsertBlogsJson(entry) {
  try {
    if (!fs.existsSync(BLOGS_JSON)) {
      fs.writeFileSync(BLOGS_JSON, JSON.stringify([entry], null, 2), 'utf8');
      return;
    }
    const raw = fs.readFileSync(BLOGS_JSON, 'utf8');
    let data = [];
    try { data = JSON.parse(raw); } catch { data = []; }

    // prevent duplicate of same link
    const existingIndex = data.findIndex(b => b.link === entry.link);
    if (existingIndex >= 0) {
      data[existingIndex] = entry;
    } else {
      data.push(entry);
    }
    fs.writeFileSync(BLOGS_JSON, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update blogs.json', err);
  }
}

function readBlogsJson() {
  try {
    if (!fs.existsSync(BLOGS_JSON)) return [];
    const raw = fs.readFileSync(BLOGS_JSON, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// List blogs
app.get('/api/blogs', (_req, res) => {
  const blogs = readBlogsJson();
  // sort desc by date
  blogs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(blogs);
});

// Read existing blog content (paragraphs) from generated HTML
app.get('/api/blogs/:link/content', (req, res) => {
  try {
    const link = String(req.params.link || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!/^blog\d+\.html$/i.test(link)) return res.status(400).json({ error: 'Invalid blog link' });
    const filePath = path.join(BLOG_OUTPUT_DIR, link);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Blog file not found' });
    const html = fs.readFileSync(filePath, 'utf8');
    const paragraphs = extractParagraphsFromHtml(html);
    return res.json({ paragraphs });
  } catch (err) {
    console.error('Failed to read blog content:', err);
    return res.status(500).json({ error: 'Failed to read blog content' });
  }
});

// Update existing blog (metadata and regenerate HTML)
app.put('/api/update-blog', (req, res) => {
  try {
    const { link, pageTitle, title, date, image, backHref = 'index.html', paragraphs = [] } = req.body;
    if (!link) return res.status(400).json({ error: 'Missing link' });
    const safeLink = String(link).replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!/^blog\d+\.html$/i.test(safeLink)) return res.status(400).json({ error: 'Invalid blog link' });

    const blogs = readBlogsJson();
    const idx = blogs.findIndex(b => b.link === safeLink);
    if (idx < 0) return res.status(404).json({ error: 'Blog not found' });

    // Build new entry from provided fields or existing
    const old = blogs[idx];
    const updated = {
      pageTitle: pageTitle ?? old.pageTitle,
      title: title ?? old.title,
      date: date ?? old.date,
      image: image ?? old.image,
      link: old.link,
      backHref: backHref ?? old.backHref ?? 'index.html',
      paragraphs: Array.isArray(paragraphs) && paragraphs.length ? paragraphs : (old.paragraphs || []),
      excerpt: (Array.isArray(paragraphs) && paragraphs[0]) ? String(paragraphs[0]).slice(0, 180) : (old.excerpt || '')
    };

    // Regenerate HTML file
    const html = generateBlogHtml({
      title: updated.title,
      pageTitle: updated.pageTitle,
      publishDate: updated.date,
      introParagraphs: updated.paragraphs || [],
      imageSrc: updated.image,
      backHref: updated.backHref
    });
    fs.writeFileSync(path.join(BLOG_OUTPUT_DIR, safeLink), html, 'utf8');

    // Save JSON
    blogs[idx] = updated;
    fs.writeFileSync(BLOGS_JSON, JSON.stringify(blogs, null, 2), 'utf8');
    res.json({ ok: true, filename: safeLink, url: `/${safeLink}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete a blog
app.delete('/api/blogs/:link', (req, res) => {
  try {
    const link = String(req.params.link || '').replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!/^blog\d+\.html$/i.test(link)) return res.status(400).json({ error: 'Invalid blog link' });
    const filePath = path.join(BLOG_OUTPUT_DIR, link);

    // Remove file if present
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}

    const blogs = readBlogsJson();
    const next = blogs.filter(b => b.link !== link);
    fs.writeFileSync(BLOGS_JSON, JSON.stringify(next, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});



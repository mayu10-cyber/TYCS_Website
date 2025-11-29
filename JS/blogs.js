async function fetchAndRenderBlogs() {
  try {
    const response = await fetch('assets/blogs.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load blogs.json');
    const blogs = await response.json();
    renderBlogs(blogs);
  } catch (err) {
    console.error('Blog load error:', err);
  }
}

function renderBlogs(blogs) {
  const container = document.querySelector('.blog-posts.card-container');
  if (!container) return;

  // sort by date desc if parsable
  const sorted = [...blogs].sort((a, b) => {
    const da = new Date(a.date).getTime() || 0;
    const db = new Date(b.date).getTime() || 0;
    return db - da;
  });

  container.innerHTML = '';

  for (const item of sorted) {
    const article = document.createElement('article');
    article.className = 'blog-post';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'post-image-container';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.pageTitle || item.title || 'Blog image';
    img.className = 'post-image';
    imageDiv.appendChild(img);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'post-content';

    const h3 = document.createElement('h3');
    h3.textContent = item.pageTitle || item.title || 'Untitled';
    const meta = document.createElement('p');
    meta.className = 'post-meta';
    meta.textContent = 'Published on: ' + (item.date || '');
    const excerpt = document.createElement('p');
    excerpt.className = 'post-excerpt';
    excerpt.textContent = item.excerpt || '';
    const link = document.createElement('a');
    link.href = item.link;
    link.className = 'read-more';
    link.textContent = 'Read Full';

    contentDiv.appendChild(h3);
    contentDiv.appendChild(meta);
    contentDiv.appendChild(excerpt);
    contentDiv.appendChild(link);

    article.appendChild(imageDiv);
    article.appendChild(contentDiv);

    container.appendChild(article);
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderBlogs);



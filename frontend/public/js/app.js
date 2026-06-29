/* ════════════════════════════════════════════
   EPSILIUS — app.js  (SPA completa)
   ════════════════════════════════════════════ */

const API = '';  // mismo origen — en producción cambiá a tu URL

// ─── Estado global ──────────────────────────
let currentUser = JSON.parse(localStorage.getItem('epsilius_user') || 'null');
let authToken   = localStorage.getItem('epsilius_token') || '';
let currentProductId = null;
let allProducts = [];
let socket;

// ─── Init ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  loadFeatured();
  loadStats();
  initSocket();
  // Cargar archivo seleccionado
  document.getElementById('adm-file').addEventListener('change', e => {
    document.getElementById('adm-file-name').textContent = e.target.files[0]?.name || '';
  });
  document.getElementById('adm-image').addEventListener('change', e => {
    document.getElementById('adm-image-name').textContent = e.target.files[0]?.name || '';
  });
});

// ─── Páginas ─────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  const navEl = document.getElementById('nav-' + page.replace('-page',''));
  if (navEl) navEl.classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'store')      loadStore();
  if (page === 'chat-page')  loadChatHistory();
  if (page === 'admin-page') loadAdminData();
}

// ─── Modales ──────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── Toast ────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${msg}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── Auth ─────────────────────────────────────
function updateAuthUI() {
  const loggedIn = !!currentUser;
  document.getElementById('user-info').style.display    = loggedIn ? 'flex' : 'none';
  document.getElementById('auth-buttons').style.display = loggedIn ? 'none' : 'flex';
  if (loggedIn) {
    document.getElementById('nav-avatar').textContent   = (currentUser.username || '?')[0].toUpperCase();
    document.getElementById('nav-username').textContent = currentUser.username;
    if (currentUser.role === 'admin') {
      document.getElementById('nav-admin').style.display = 'inline-block';
    }
  }
}

async function doRegister() {
  const body = {
    username: document.getElementById('reg-username').value.trim(),
    email:    document.getElementById('reg-email').value.trim(),
    password: document.getElementById('reg-password').value,
    country:  document.getElementById('reg-country').value.trim()
  };
  if (!body.username || !body.email || !body.password) return toast('Completá todos los campos', 'error');
  try {
    const res = await api('POST', '/api/auth/register', body);
    authToken = res.token; currentUser = res.user;
    localStorage.setItem('epsilius_token', authToken);
    localStorage.setItem('epsilius_user', JSON.stringify(currentUser));
    updateAuthUI(); closeModal('register-modal');
    toast(`¡Bienvenido/a, ${currentUser.username}!`, 'success');
  } catch(e) { toast(e.message, 'error'); }
}

async function doLogin() {
  const body = {
    email:    document.getElementById('login-email').value.trim(),
    password: document.getElementById('login-password').value
  };
  try {
    const res = await api('POST', '/api/auth/login', body);
    authToken = res.token; currentUser = res.user;
    localStorage.setItem('epsilius_token', authToken);
    localStorage.setItem('epsilius_user', JSON.stringify(currentUser));
    updateAuthUI(); closeModal('login-modal');
    toast(`¡Bienvenido/a de nuevo, ${currentUser.username}!`, 'success');
  } catch(e) { toast(e.message, 'error'); }
}

function logout() {
  currentUser = null; authToken = '';
  localStorage.removeItem('epsilius_token'); localStorage.removeItem('epsilius_user');
  updateAuthUI(); showPage('home'); toast('Sesión cerrada', 'info');
}

// ─── API helper ───────────────────────────────
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

async function apiForm(path, formData) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// ─── Estadísticas ──────────────────────────────
async function loadStats() {
  try {
    const products = await api('GET', '/api/products');
    document.getElementById('stat-products').textContent = products.length;
    const totalDownloads = products.reduce((a, p) => a + (p.downloads || 0), 0);
    document.getElementById('stat-downloads').textContent = totalDownloads;
    document.getElementById('stat-users').textContent = '∞';
  } catch {}
}

// ─── Productos ────────────────────────────────
function productEmoji(cat) {
  return { programa: '🖥️', extension: '🧩', herramienta: '🔧', archivo: '📁', otro: '✨' }[cat] || '📦';
}

function renderStars(r) {
  const n = Math.round(r || 0);
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function buildCard(p, showBuy = true) {
  const isFree = !p.price || p.price === 0;
  return `
    <div class="product-card" onclick="openProduct('${p._id}')">
      <div class="card-img">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : productEmoji(p.category)}
      </div>
      <div class="card-body">
        <div class="card-category">${productEmoji(p.category)} ${p.category}</div>
        <div class="card-title">${p.title}</div>
        <div class="card-desc">${p.description?.slice(0, 100)}${p.description?.length > 100 ? '…' : ''}</div>
        <div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.75rem">
          ${(p.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="card-footer">
          <div>
            <div class="card-price ${isFree ? 'free' : ''}">${isFree ? 'GRATIS' : `$${p.price.toLocaleString()}`}</div>
            <div class="stars" style="font-size:0.75rem">${renderStars(p.rating)} <span style="color:var(--text-dim)">(${p.reviews || 0})</span></div>
          </div>
          ${showBuy ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();buyProduct('${p._id}')">
            ${isFree ? '⬇️ Obtener' : '🛒 Comprar'}
          </button>` : ''}
        </div>
      </div>
    </div>`;
}

async function loadFeatured() {
  try {
    const products = await api('GET', '/api/products?featured=true');
    const grid = document.getElementById('featured-grid');
    if (!products.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:3rem">Pronto habrá herramientas destacadas aquí.</div>'; return; }
    grid.innerHTML = products.slice(0, 4).map(p => buildCard(p)).join('');
  } catch {}
}

async function loadStore(category = '', search = '') {
  const grid = document.getElementById('store-grid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:3rem">Cargando…</div>';
  try {
    let url = '/api/products?';
    if (category) url += `category=${category}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    allProducts = await api('GET', url);
    if (!allProducts.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:3rem">No hay herramientas en esta categoría aún.</div>';
      return;
    }
    grid.innerHTML = allProducts.map(p => buildCard(p)).join('');
  } catch(e) { grid.innerHTML = `<div style="color:var(--danger)">Error: ${e.message}</div>`; }
}

let currentCategory = '';
function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadStore(cat, document.getElementById('search-input')?.value || '');
}
function searchProducts() {
  const q = document.getElementById('search-input').value;
  loadStore(currentCategory, q);
}

// ─── Detalle de producto ──────────────────────
async function openProduct(id) {
  currentProductId = id;
  showPage('product');
  try {
    const [product, comments] = await Promise.all([
      api('GET', `/api/products/${id}`),
      api('GET', `/api/comments/${id}`)
    ]);
    renderProductDetail(product);
    renderComments(comments, id);
  } catch(e) { toast(e.message, 'error'); }
}

function renderProductDetail(p) {
  const isFree = !p.price || p.price === 0;
  document.getElementById('product-detail-content').innerHTML = `
    <div class="detail-img">
      ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}">` : `<span style="font-size:6rem">${productEmoji(p.category)}</span>`}
    </div>
    <div class="detail-info">
      <div class="card-category">${productEmoji(p.category)} ${p.category} · v${p.version || '1.0'}</div>
      <h1>${p.title}</h1>
      <div class="stars">${renderStars(p.rating)} <span style="color:var(--text-dim);font-size:0.85rem">${p.reviews || 0} reseñas · ${p.downloads || 0} descargas</span></div>
      <div class="detail-price ${isFree ? 'free' : ''}">${isFree ? 'GRATIS' : `$${p.price?.toLocaleString()} ARS`}</div>
      <p style="color:var(--text-dim);margin-bottom:1rem">${p.description}</p>
      <div class="detail-tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div style="display:flex;gap:0.75rem;margin-top:1.5rem;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="buyProduct('${p._id}')" style="font-size:1rem;padding:0.75rem 1.5rem">
          ${isFree ? '⬇️ Obtener gratis' : '🛒 Comprar ahora'}
        </button>
        ${p.downloadUrl ? `<a href="${p.downloadUrl}" target="_blank" class="btn btn-outline">🔗 Link externo</a>` : ''}
      </div>
    </div>`;
}

function renderComments(comments, productId) {
  const form = document.getElementById('comment-form-container');
  if (currentUser) {
    form.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;margin-bottom:1rem">
        <div class="form-group">
          <label>Tu reseña</label>
          <textarea id="comment-text" placeholder="¿Qué te pareció esta herramienta?" rows="3"></textarea>
        </div>
        <div style="display:flex;align-items:center;gap:1rem">
          <div class="form-group" style="margin:0">
            <label>Puntuación</label>
            <select id="comment-rating" style="padding:0.4rem 0.7rem;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:8px">
              <option value="5">⭐⭐⭐⭐⭐ Excelente</option>
              <option value="4">⭐⭐⭐⭐ Muy bueno</option>
              <option value="3">⭐⭐⭐ Bueno</option>
              <option value="2">⭐⭐ Regular</option>
              <option value="1">⭐ Malo</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="postComment('${productId}')" style="margin-top:1.2rem">Publicar</button>
        </div>
      </div>`;
  } else {
    form.innerHTML = `<p style="color:var(--text-dim);margin-bottom:1rem;font-size:0.9rem">
      <a href="#" onclick="openModal('login-modal')">Ingresá</a> para dejar tu reseña.
    </p>`;
  }

  const list = document.getElementById('comments-list');
  if (!comments.length) { list.innerHTML = '<div style="color:var(--text-dim)">Todavía no hay comentarios. ¡Sé el primero!</div>'; return; }
  list.innerHTML = comments.map(c => `
    <div class="comment-card" id="comment-${c._id}">
      <div class="comment-header">
        <div class="comment-avatar">${(c.user?.username || '?')[0].toUpperCase()}</div>
        <div>
          <div class="comment-user">${c.user?.username || 'Anónimo'} ${c.user?.country ? `<span style="color:var(--text-dim);font-size:0.8rem">— ${c.user.country}</span>` : ''}</div>
          <div class="comment-date">${new Date(c.createdAt).toLocaleDateString('es-AR')} · <span class="stars">${renderStars(c.rating)}</span></div>
        </div>
      </div>
      <div class="comment-text">${c.text}</div>
      <div class="comment-actions">
        <button class="btn btn-sm btn-outline" onclick="likeComment('${c._id}')">👍 ${c.likes || 0}</button>
        ${currentUser?.role === 'admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteComment('${c._id}','${productId}')">🗑️</button>` : ''}
      </div>
    </div>`).join('');
}

async function postComment(productId) {
  const text = document.getElementById('comment-text').value.trim();
  const rating = +document.getElementById('comment-rating').value;
  if (!text) return toast('Escribí tu reseña', 'error');
  try {
    await api('POST', `/api/comments/${productId}`, { text, rating });
    const comments = await api('GET', `/api/comments/${productId}`);
    renderComments(comments, productId);
    toast('Reseña publicada ✅', 'success');
  } catch(e) { toast(e.message, 'error'); }
}

async function likeComment(commentId) {
  if (!currentUser) return toast('Ingresá para dar like', 'error');
  try {
    const res = await api('POST', `/api/comments/${commentId}/like`);
    toast(res.liked ? '👍 Like agregado' : 'Like quitado', 'success');
    const comments = await api('GET', `/api/comments/${currentProductId}`);
    renderComments(comments, currentProductId);
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteComment(commentId, productId) {
  if (!confirm('¿Eliminar este comentario?')) return;
  try {
    await api('DELETE', `/api/comments/${commentId}`);
    const comments = await api('GET', `/api/comments/${productId}`);
    renderComments(comments, productId);
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Comprar ──────────────────────────────────
async function buyProduct(productId) {
  const modal = document.getElementById('buy-modal');
  const content = document.getElementById('buy-modal-content');
  openModal('buy-modal');
  content.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-dim)">Cargando…</div>';
  try {
    const product = await api('GET', `/api/products/${productId}`);
    const isFree = !product.price || product.price === 0;
    content.innerHTML = `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:1.25rem;display:flex;gap:1rem;align-items:center">
        <span style="font-size:2.5rem">${productEmoji(product.category)}</span>
        <div>
          <div style="font-weight:700">${product.title}</div>
          <div style="font-size:1.3rem;font-weight:800;color:${isFree ? 'var(--success)' : 'var(--accent2)'}">${isFree ? 'GRATIS' : `$${product.price?.toLocaleString()} ARS`}</div>
        </div>
      </div>
      ${isFree ? `
        <p style="color:var(--text-dim);margin-bottom:1rem;font-size:0.9rem">Esta herramienta es gratuita. Dejá tu email para recibir el archivo.</p>
        <div class="form-group"><label>Tu email</label><input type="email" id="buy-email" placeholder="tu@email.com" value="${currentUser?.email || ''}"></div>
        <button class="btn btn-success" onclick="confirmPurchase('${productId}', true)" style="width:100%">⬇️ Obtener gratis</button>
      ` : `
        <p style="color:var(--text-dim);margin-bottom:1rem;font-size:0.9rem">Vas a ser redirigido a Mercado Pago para completar el pago. Después de pagar, envianos el comprobante a <b>epsiliusoficial@gmail.com</b> y te enviamos el archivo.</p>
        <div class="form-group"><label>Tu email (para enviarte el producto)</label><input type="email" id="buy-email" placeholder="tu@email.com" value="${currentUser?.email || ''}"></div>
        <button class="btn btn-primary" onclick="confirmPurchase('${productId}', false)" style="width:100%;font-size:1rem;padding:0.75rem">💳 Pagar con Mercado Pago</button>
      `}`;
  } catch(e) { content.innerHTML = `<div style="color:var(--danger)">${e.message}</div>`; }
}

async function confirmPurchase(productId, isFree) {
  const email = document.getElementById('buy-email').value.trim();
  if (!email) return toast('Ingresá tu email', 'error');
  try {
    const res = await api('POST', '/api/orders', { productId, email, userId: currentUser?._id });
    closeModal('buy-modal');
    if (isFree) {
      toast('¡Gracias! Te enviamos el acceso a tu email.', 'success');
    } else {
      window.open(res.mpLink, '_blank');
      toast('Completá el pago en Mercado Pago y envianos el comprobante.', 'success');
    }
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Chat ─────────────────────────────────────
function initSocket() {
  socket = io();
  if (currentUser) socket.emit('join', currentUser);

  socket.on('receive_message', msg => {
    appendChatMessage(msg);
  });

  socket.on('online_count', count => {
    const el = document.getElementById('online-count');
    if (el) el.innerHTML = `<span class="online-dot"></span>${count} en línea`;
  });
}

async function loadChatHistory() {
  const box = document.getElementById('chat-messages');
  box.innerHTML = '<div style="text-align:center;color:var(--text-dim);font-size:0.85rem">Cargando…</div>';
  try {
    const msgs = await api('GET', '/api/chat/history');
    box.innerHTML = '';
    msgs.forEach(m => appendChatMessage(m));
    box.scrollTop = box.scrollHeight;
  } catch { box.innerHTML = '<div style="color:var(--text-dim)">No hay mensajes aún.</div>'; }
}

function appendChatMessage(msg) {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  const isOwn = msg.user === currentUser?.username;
  const div = document.createElement('div');
  div.className = `chat-msg ${isOwn ? 'own' : ''}`;
  div.innerHTML = `
    <div class="msg-avatar">${(msg.user || '?')[0].toUpperCase()}</div>
    <div class="msg-content">
      <div class="msg-name">${isOwn ? 'Vos' : msg.user} <span style="color:var(--text-dim);font-size:0.7rem;font-weight:400">${new Date(msg.timestamp).toLocaleTimeString('es-AR', {hour:'2-digit',minute:'2-digit'})}</span></div>
      <div class="msg-text">${escapeHtml(msg.text)}</div>
    </div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function sendChatMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (!currentUser) return toast('Ingresá para chatear', 'error');
  socket.emit('send_message', { user: currentUser.username, avatar: currentUser.avatar, text });
  input.value = '';
}

// ─── Contacto ─────────────────────────────────
async function sendContact() {
  const body = {
    name:    document.getElementById('contact-name').value.trim(),
    email:   document.getElementById('contact-email').value.trim(),
    subject: document.getElementById('contact-subject').value.trim(),
    message: document.getElementById('contact-message').value.trim()
  };
  if (!body.name || !body.email || !body.message) return toast('Completá nombre, email y mensaje', 'error');
  try {
    await api('POST', '/api/contact', body);
    toast('¡Mensaje enviado! Te respondemos pronto.', 'success');
    ['contact-name','contact-email','contact-subject','contact-message'].forEach(id => document.getElementById(id).value = '');
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Admin ────────────────────────────────────
async function uploadProduct() {
  if (!currentUser || currentUser.role !== 'admin') return toast('Solo admin', 'error');
  const title = document.getElementById('adm-title').value.trim();
  const desc  = document.getElementById('adm-desc').value.trim();
  if (!title || !desc) return toast('Título y descripción son obligatorios', 'error');

  const fd = new FormData();
  fd.append('title',       title);
  fd.append('description', desc);
  fd.append('price',       document.getElementById('adm-price').value || '0');
  fd.append('category',    document.getElementById('adm-category').value);
  fd.append('version',     document.getElementById('adm-version').value || '1.0');
  fd.append('tags',        document.getElementById('adm-tags').value);
  fd.append('downloadUrl', document.getElementById('adm-downloadurl').value);
  fd.append('featured',    document.getElementById('adm-featured').checked);

  const file  = document.getElementById('adm-file').files[0];
  const image = document.getElementById('adm-image').files[0];
  if (file)  fd.append('file', file);
  if (image) fd.append('image', image);

  try {
    await apiForm('/api/products', fd);
    toast('¡Herramienta publicada!', 'success');
    ['adm-title','adm-price','adm-version','adm-tags','adm-downloadurl','adm-desc'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('adm-featured').checked = false;
    document.getElementById('adm-file-name').textContent = '';
    document.getElementById('adm-image-name').textContent = '';
    loadAdminData();
  } catch(e) { toast(e.message, 'error'); }
}

async function loadAdminData() {
  if (!currentUser || currentUser.role !== 'admin') return;
  try {
    const [products, orders] = await Promise.all([
      api('GET', '/api/products'),
      api('GET', '/api/orders')
    ]);

    // Productos
    const pList = document.getElementById('admin-products-list');
    pList.innerHTML = products.length ? `
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead>
          <tr style="text-align:left;color:var(--text-dim);border-bottom:1px solid var(--border)">
            <th style="padding:0.5rem">Título</th><th>Precio</th><th>Cat.</th><th>Acc.</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:0.5rem">${p.title}</td>
              <td>${p.price ? `$${p.price}` : 'Gratis'}</td>
              <td>${p.category}</td>
              <td><button class="btn btn-danger btn-sm" onclick="deleteProduct('${p._id}')">🗑️</button></td>
            </tr>`).join('')}
        </tbody>
      </table>` : '<p style="color:var(--text-dim)">No hay productos aún.</p>';

    // Órdenes
    const oList = document.getElementById('admin-orders-list');
    oList.innerHTML = orders.length ? `
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead>
          <tr style="text-align:left;color:var(--text-dim);border-bottom:1px solid var(--border)">
            <th style="padding:0.5rem">Producto</th><th>Email</th><th>Monto</th><th>Estado</th><th>Acc.</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr style="border-bottom:1px solid var(--border)">
              <td style="padding:0.5rem">${o.product?.title || 'N/A'}</td>
              <td>${o.email}</td>
              <td>$${o.amount}</td>
              <td><span style="color:${o.status==='pagado'?'var(--success)':o.status==='cancelado'?'var(--danger)':'var(--warning)'}">${o.status}</span></td>
              <td>${o.status === 'pendiente' ? `<button class="btn btn-success btn-sm" onclick="confirmOrder('${o._id}')">✅</button>` : ''}</td>
            </tr>`).join('')}
        </tbody>
      </table>` : '<p style="color:var(--text-dim)">No hay órdenes aún.</p>';
  } catch(e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar esta herramienta?')) return;
  try {
    await api('DELETE', `/api/products/${id}`);
    toast('Producto eliminado', 'success');
    loadAdminData();
  } catch(e) { toast(e.message, 'error'); }
}

async function confirmOrder(id) {
  try {
    await api('PUT', `/api/orders/${id}/confirm`);
    toast('Orden confirmada como pagada ✅', 'success');
    loadAdminData();
  } catch(e) { toast(e.message, 'error'); }
}

// ─── Utils ────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

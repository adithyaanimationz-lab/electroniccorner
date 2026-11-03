/* Electronic Corner — store + admin.
   The website is plain files (hosted free on Render). Products, orders and supplier costs
   are saved in Google Firebase (free), set up once with firebase-config.txt. */

const PIN = "8259";
const INSTAGRAM = "electroniccorner";
const DM_LINK = `https://ig.me/m/${INSTAGRAM}`;
const IG_PROFILE = u => `https://instagram.com/${encodeURIComponent(u)}`;
const FIREBASE_VERSION = "10.12.2";
const DEMO = new URLSearchParams(location.search).has("demo");   // ?demo = try everything without Firebase (data stays in this browser)
const MAX_QTY = 10, MAX_PHOTOS = 4;

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => { const v = Math.round((Number(n) || 0) * 100) / 100; return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }); };
const calcPrice = s => Math.round((Number(s.cost) || 0) * (Number(s.markup) || 1) + (Number(s.shipping) || 0));
const unitCostOf = s => (Number(s.cost) || 0) + (Number(s.shipping) || 0);
const priceOf = p => Number(p.price) || 0;
const mrpOf = p => Number(p.mrp) || 0;
const offOf = p => { const m = mrpOf(p), pr = priceOf(p); return m > pr ? Math.round((1 - pr / m) * 100) : 0; };
const orderTotal = o => (o.items || []).reduce((a, i) => a + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
const orderProfit = o => (o.items || []).reduce((a, i) => { const s = S.supplier[i.pid]; return a + ((Number(i.price) || 0) - (s ? unitCostOf(s) : (Number(i.price) || 0))) * (Number(i.qty) || 0); }, 0);
const statusLabel = s => ({ new: "Awaiting payment", paid: "Paid", fulfilled: "Shipped", cancelled: "Cancelled" })[s] || s;
const when = ms => ms ? new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "Just now";
const route = () => (location.hash || "#store").slice(1);
function toast(msg) { document.querySelectorAll(".toast").forEach(t => t.remove()); const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ---------- icons & drawings ---------- */
const I = {
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.7l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7H6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
  key: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
const ART = {
  earbuds: '<svg viewBox="0 0 120 100" fill="none"><rect x="20" y="48" width="80" height="40" rx="20" fill="#16223d" stroke="#2b3d66" stroke-width="2"/><path d="M38 14c10 0 16 7 16 16s-6 15-14 15c-3 0-4 2-4 6v8a5 5 0 0 1-10 0V30c0-9 4-16 12-16z" fill="#e8edf7"/><path d="M82 14c-10 0-16 7-16 16s6 15 14 15c3 0 4 2 4 6v8a5 5 0 0 0 10 0V30c0-9-4-16-12-16z" fill="#e8edf7"/></svg>',
  watch: '<svg viewBox="0 0 120 100" fill="none"><rect x="46" y="2" width="28" height="22" rx="6" fill="#26345a"/><rect x="46" y="76" width="28" height="22" rx="6" fill="#26345a"/><rect x="34" y="20" width="52" height="60" rx="16" fill="#0b1220" stroke="#e8edf7" stroke-width="3"/><path d="M60 34v16l10 6" stroke="#0ea5ff" stroke-width="4" stroke-linecap="round"/></svg>',
  other: '<svg viewBox="0 0 120 100" fill="none"><rect x="26" y="14" width="68" height="72" rx="14" fill="#16223d" stroke="#e8edf7" stroke-width="3"/><path d="M48 50h24M60 38v24" stroke="#0ea5ff" stroke-width="4" stroke-linecap="round"/></svg>',
};
const CATS = [["earbuds", "Earbuds"], ["neckband", "Neckband"], ["watch", "Smartwatch"], ["powerbank", "Power bank"], ["speaker", "Speaker"], ["headphones", "Headphones"], ["charger", "Charger"], ["projector", "Projector"], ["other", "Other gadget"]];
const catLabel = c => (CATS.find(x => x[0] === c) || CATS[CATS.length - 1])[1];
const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

/* ---------- photos: a file name in the site folder, or "photo:<id>" saved in Firebase ---------- */
const PHOTO_CACHE = new Map();
const photosOf = p => Array.isArray(p.images) ? p.images.filter(Boolean) : [];
function photoTag(ref, alt, extra = "") {
  if (String(ref).startsWith("photo:")) {
    const src = PHOTO_CACHE.get(ref);
    return `<img ${src ? `src="${esc(src)}"` : ""} data-photo="${esc(ref)}" alt="${esc(alt)}" ${extra}>`;
  }
  return `<img src="${esc(encodeURI(ref))}" alt="${esc(alt)}" ${extra}>`;
}
const imgOf = p => { const ph = photosOf(p); return ph.length ? photoTag(ph[0], p.name, 'loading="lazy"') : (ART[p.category] || ART.other); };
async function hydratePhotos(root = document) {
  for (const img of root.querySelectorAll("img[data-photo]:not([src])")) {
    const ref = img.dataset.photo;
    try {
      let src = PHOTO_CACHE.get(ref);
      if (!src && S.db) { src = await S.db.getPhoto(ref.slice(6)); if (src) PHOTO_CACHE.set(ref, src); }
      if (src) img.src = src;
    } catch (e) {}
  }
}
async function compressImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    let q = 0.85, out = c.toDataURL("image/jpeg", q);
    while (out.length > 700000 && q > 0.4) { q -= 0.15; out = c.toDataURL("image/jpeg", q); }
    return out;
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- data: Firebase, or a demo copy kept in this browser ---------- */
function parseConfig(text) {
  const cfg = {};
  for (const k of ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"]) {
    const m = text.match(new RegExp(k + "\\s*[:=]\\s*[\"']([^\"']+)[\"']"));
    if (m) cfg[k] = m[1].trim();
  }
  return cfg.apiKey && cfg.projectId && cfg.appId && !/^paste/i.test(cfg.apiKey) && cfg.projectId !== "your-project" ? cfg : null;
}
async function loadConfig() {
  try { const r = await fetch("firebase-config.txt", { cache: "no-store" }); return r.ok ? parseConfig(await r.text()) : null; } catch (e) { return null; }
}
async function firebaseDB(cfg) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  const [{ initializeApp }, F, A] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js"), import(base + "firebase-auth.js")]);
  const app = initializeApp(cfg), fs = F.getFirestore(app), auth = A.getAuth(app);
  const ms = v => v && typeof v.toMillis === "function" ? v.toMillis() : (Number(v) || 0);
  const rows = snap => snap.docs.map(d => ({ ...d.data({ serverTimestamps: "estimate" }), _id: d.id }));
  return {
    kind: "firebase",
    watchProducts: (cb, err) => F.onSnapshot(F.collection(fs, "products"), s => cb(rows(s).map(p => ({ ...p, id: p._id }))), err),
    watchSupplier: (cb, err) => F.onSnapshot(F.collection(fs, "supplier"), s => { const m = {}; s.docs.forEach(d => { m[d.id] = d.data(); }); cb(m); }, err),
    watchOrders: (cb, err) => F.onSnapshot(F.collection(fs, "orders"), s => cb(rows(s).map(o => ({ ...o, docId: o._id, createdAt: ms(o.createdAt) }))), err),
    async getOrder(id) { const d = await F.getDoc(F.doc(fs, "orders", id)); return d.exists() ? { ...d.data(), docId: d.id, createdAt: ms(d.data().createdAt) } : null; },
    async placeOrder(o) { const r = await F.addDoc(F.collection(fs, "orders"), { ...o, createdAt: F.serverTimestamp() }); return r.id; },
    saveProduct: (id, data) => F.setDoc(F.doc(fs, "products", id), data),
    deleteProduct: id => F.deleteDoc(F.doc(fs, "products", id)),
    saveSupplier: (id, data) => F.setDoc(F.doc(fs, "supplier", id), data),
    deleteSupplier: id => F.deleteDoc(F.doc(fs, "supplier", id)),
    updateOrder: (id, patch) => F.updateDoc(F.doc(fs, "orders", id), patch),
    async savePhoto(dataUrl) { const r = await F.addDoc(F.collection(fs, "photos"), { data: dataUrl }); return r.id; },
    async getPhoto(id) { const d = await F.getDoc(F.doc(fs, "photos", id)); return d.exists() ? d.data().data : null; },
    onAuth: cb => A.onAuthStateChanged(auth, u => cb(u ? { email: u.email } : null)),
    signIn: (e, p) => A.signInWithEmailAndPassword(auth, e, p),
    signOut: () => A.signOut(auth),
  };
}
function demoDB() {
  const K = "ec_demo_db";
  const st = store.get(K, null) || { products: {}, supplier: {}, orders: {}, photos: {} };
  const subs = { products: [], supplier: [], orders: [] }, authSubs = [];
  let user = store.get("ec_demo_user", null);
  const save = () => store.set(K, st);
  const value = c => c === "supplier" ? { ...st.supplier } : Object.entries(st[c]).map(([id, d]) => c === "orders" ? { ...d, docId: id } : { ...d, id });
  const emit = c => subs[c].forEach(f => f(value(c)));
  const watch = c => cb => { subs[c].push(cb); setTimeout(() => cb(value(c)), 0); return () => { subs[c] = subs[c].filter(f => f !== cb); }; };
  const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
  const after = c => { save(); emit(c); };
  return {
    kind: "demo",
    watchProducts: watch("products"), watchSupplier: watch("supplier"), watchOrders: watch("orders"),
    async getOrder(id) { const o = st.orders[id]; return o ? { ...o, docId: id } : null; },
    async placeOrder(o) { const id = rid(); st.orders[id] = { ...o, createdAt: Date.now() }; after("orders"); return id; },
    async saveProduct(id, d) { st.products[id] = d; after("products"); },
    async deleteProduct(id) { delete st.products[id]; after("products"); },
    async saveSupplier(id, d) { st.supplier[id] = d; after("supplier"); },
    async deleteSupplier(id) { delete st.supplier[id]; after("supplier"); },
    async updateOrder(id, p) { st.orders[id] = { ...st.orders[id], ...p }; after("orders"); },
    async savePhoto(u) { const id = rid(); st.photos[id] = u; save(); return id; },
    async getPhoto(id) { return st.photos[id] || null; },
    onAuth(cb) { authSubs.push(cb); setTimeout(() => cb(user), 0); return () => {}; },
    async signIn(e, p) { if (!e || !p) throw { code: "auth/invalid-credential" }; user = { email: e }; store.set("ec_demo_user", user); authSubs.forEach(f => f(user)); },
    async signOut() { user = null; store.set("ec_demo_user", null); authSubs.forEach(f => f(null)); },
  };
}

/* ---------- state ---------- */
const STARTER = (window.STARTER_PRODUCTS || []).map(p => ({ ...p }));
const S = {
  db: null, mode: "loading",           // loading | live | setup (no Firebase yet) | error
  products: [], productsLoaded: false, loadErr: "",
  supplier: {}, orders: [], user: null, authKnown: false, isAdmin: false, adminChecking: false, adminErr: "",
  cart: store.get("ec_cart", []), mine: store.get("ec_my_orders", []), mineData: {},
  unlocked: false, tab: "products",
};
try { S.unlocked = sessionStorage.getItem("ec_admin") === "1"; } catch (e) {}
const sortP = list => [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
const qtyOf = id => (S.cart.find(c => c.id === id) || {}).qty || 0;
const cartLines = () => S.cart.map(c => ({ ...c, p: S.products.find(p => p.id === c.id) })).filter(c => c.p);
function saveCart() { store.set("ec_cart", S.cart); renderNav(); refreshBuyCtls(); }

/* ---------- storefront ---------- */
function buyCtl(p, size) {
  if (p.inStock === false) return `<button class="btn ${size} block" disabled>Currently unavailable</button>`;
  const q = qtyOf(p.id);
  if (!q) return `<button class="btn primary ${size} block" data-add="${esc(p.id)}">${I.cart} Add to cart</button>`;
  return `<div class="stepper ${size}" role="group" aria-label="Quantity in cart">
    <button data-dec="${esc(p.id)}" aria-label="${q === 1 ? "Remove from cart" : "Remove one"}">${q === 1 ? I.trash : I.minus}</button>
    <span aria-live="polite"><b>${q}</b> in cart</span>
    <button data-inc="${esc(p.id)}" aria-label="Add one more" ${q >= MAX_QTY ? "disabled" : ""}>${I.plus}</button>
  </div>`;
}
function cardHTML(p) {
  const off = offOf(p);
  return `<article class="card">
    <a class="card-link" href="#product-${esc(p.id)}">
      <div class="thumb">${imgOf(p)}<span class="badge">${esc(catLabel(p.category))}</span></div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <div class="price-row"><span class="price">${money(priceOf(p))}</span>${off ? `<s class="mrp">${money(mrpOf(p))}</s><span class="off">${off}% off</span>` : ""}</div>
      </div>
    </a>
    <div class="card-buy"><div class="buy-ctl" data-pid="${esc(p.id)}" data-size="sm">${buyCtl(p, "sm")}</div></div>
  </article>`;
}
function refreshBuyCtls() {
  document.querySelectorAll(".buy-ctl[data-pid]").forEach(el => { const p = S.products.find(x => x.id === el.dataset.pid); if (p) el.innerHTML = buyCtl(p, el.dataset.size); });
}
function changeQty(id, delta) {
  const it = S.cart.find(c => c.id === id);
  if (!it) { if (delta > 0) { S.cart.push({ id, qty: 1 }); toast("Added to cart"); } }
  else { it.qty = Math.min(MAX_QTY, it.qty + delta); if (it.qty < 1) S.cart = S.cart.filter(c => c !== it); }
  saveCart();
}

function renderNav() {
  const r = route(), n = S.cart.reduce((a, c) => a + c.qty, 0);
  $("#brandTag").hidden = r !== "admin";
  if (r === "admin") {
    $("#nav").innerHTML = `<a class="navlink" href="#store">View store</a>${S.unlocked && S.user ? `<button class="btn sm ghost" id="signOutBtn">Sign out</button>` : ""}${S.unlocked ? `<button class="btn sm ghost" id="lockBtn">${I.lock} Lock</button>` : ""}`;
    const lb = $("#lockBtn"); if (lb) lb.onclick = () => { S.unlocked = false; try { sessionStorage.removeItem("ec_admin"); } catch (e) {} render(); };
    const so = $("#signOutBtn"); if (so) so.onclick = async () => { await S.db.signOut(); toast("Signed out"); };
  } else {
    $("#nav").innerHTML = `<a class="navlink hide-sm" href="#store">Shop</a><a class="navlink" href="#my-orders">My orders</a><a class="navlink hide-sm" href="${DM_LINK}" target="_blank" rel="noopener">Help</a><button class="btn sm" id="cartBtn" aria-label="Open cart, ${n} item${n === 1 ? "" : "s"}">${I.cart}<span class="count">${n}</span></button>`;
    $("#cartBtn").onclick = () => openCart();
  }
}

function renderStore() {
  const list = S.products;
  let grid;
  if (!S.productsLoaded) grid = `<div class="empty">Loading products…</div>`;
  else if (S.loadErr) grid = `<div class="empty">${esc(S.loadErr)}</div>`;
  else if (!list.length) grid = `<div class="empty">New products are coming soon. Follow <a href="https://instagram.com/${INSTAGRAM}" target="_blank" rel="noopener">@${INSTAGRAM}</a> for updates.</div>`;
  else grid = list.map(cardHTML).join("");
  $("#app").innerHTML = `<div class="wrap">
    <section class="hero">
      <div class="eyebrow">Top picks for India</div>
      <h1>Trending tech, <em>delivered across India.</em></h1>
      <p>Wireless earbuds, smartwatches, power banks and more, priced in rupees and delivered free to your door.</p>
      <div class="perks"><span><i></i>Free delivery across India</span><span><i></i>Pay once we confirm your order</span><span><i></i>Questions? DM <a href="${DM_LINK}" target="_blank" rel="noopener">@${INSTAGRAM}</a></span></div>
    </section>
    <div class="section-head"><h2>Shop the collection</h2><span>${list.length ? `${list.length} product${list.length === 1 ? "" : "s"}` : ""}</span></div>
    <div class="grid">${grid}</div>
  </div>`;
}

function renderProduct(id) {
  const p = S.products.find(x => x.id === id);
  if (!p) {
    $("#app").innerHTML = `<div class="wrap" style="padding-block:40px 64px"><div class="empty">${S.productsLoaded ? `This product isn't available any more. <a href="#store">See all products</a>` : "Loading product…"}</div></div>`;
    return;
  }
  const ph = photosOf(p), price = priceOf(p), off = offOf(p);
  const feats = (Array.isArray(p.features) ? p.features : []).filter(Boolean);
  const others = S.products.filter(x => x.id !== p.id);
  document.title = `${p.name} · Electronic Corner`;
  $("#app").innerHTML = `<div class="wrap pdp">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#store">All products</a><span aria-hidden="true">›</span><span>${esc(catLabel(p.category))}</span></nav>
    <div class="pdp-grid">
      <section class="gallery" aria-label="Product photos">
        ${ph.length > 1 ? `<div class="thumbs">${ph.map((r, i) => `<button type="button" class="tb${i ? "" : " on"}" data-ph="${i}" aria-label="Show photo ${i + 1} of ${ph.length}">${photoTag(r, "")}</button>`).join("")}</div>` : ""}
        <div class="main-photo">${ph.length ? photoTag(ph[0], p.name, 'id="pdpImg"') : (ART[p.category] || ART.other)}</div>
      </section>
      <section class="pdp-info">
        <h1>${esc(p.name)}</h1>
        ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ""}
        <div class="pdp-price">${off ? `<span class="off big">-${off}%</span>` : ""}<span class="price xl">${money(price)}</span></div>
        ${off ? `<div class="mrp-line">M.R.P.: <s>${money(mrpOf(p))}</s></div>` : ""}
        <div class="tax">Inclusive of all taxes</div>
        ${feats.length ? `<h2 class="about">About this item</h2><ul class="feats">${feats.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      </section>
      <aside class="buybox" aria-label="Buy this item">
        <div class="price lg">${money(price)}</div>
        <div class="bb-line">${I.truck}<span><b>Free delivery</b> anywhere in India</span></div>
        ${p.inStock === false ? `<div class="bb-out">Currently unavailable</div>` : ""}
        <div class="buy-ctl" data-pid="${esc(p.id)}" data-size="lg">${buyCtl(p, "lg")}</div>
        ${p.inStock === false ? "" : `<button class="btn buy lg block" data-buynow="${esc(p.id)}">Buy now</button>`}
        <dl class="bb-meta"><div><dt>Sold by</dt><dd>Electronic Corner</dd></div><div><dt>Payment</dt><dd>We contact you with payment details after you order</dd></div><div><dt>Help</dt><dd><a href="${DM_LINK}" target="_blank" rel="noopener">DM @${INSTAGRAM}</a></dd></div></dl>
      </aside>
    </div>
    ${others.length ? `<section class="more"><div class="section-head"><h2>You may also like</h2></div><div class="grid">${others.map(cardHTML).join("")}</div></section>` : ""}
  </div>`;
  if (ph.length > 1) {
    const tbs = [...document.querySelectorAll(".tb")];
    tbs.forEach(t => {
      const show = () => {
        const ref = ph[+t.dataset.ph], img = $("#pdpImg");
        if (String(ref).startsWith("photo:")) { img.removeAttribute("src"); img.dataset.photo = ref; hydratePhotos($(".main-photo")); }
        else { img.removeAttribute("data-photo"); img.src = encodeURI(ref); }
        tbs.forEach(x => x.classList.toggle("on", x === t));
      };
      t.onclick = show; t.onmouseenter = show;
    });
  }
}

/* ---------- cart & checkout ---------- */
function closeLayer() { $("#layer").innerHTML = ""; if (S.pendingRender) { S.pendingRender = false; render(); } }
function openCart(step) {
  const lines = cartLines(), total = lines.reduce((a, l) => a + priceOf(l.p) * l.qty, 0);
  let title = "Your cart", body, foot = "";
  if (step === "checkout") {
    title = "Checkout";
    const saved = store.get("ec_customer", {});
    const v = k => esc(saved[k] || "");
    body = `<form id="coForm" class="form" novalidate>
      <div class="field full"><label for="co-name">Full name</label><input id="co-name" autocomplete="name" value="${v("name")}"></div>
      <div class="field"><label for="co-phone">Mobile number</label><input id="co-phone" type="tel" autocomplete="tel" placeholder="10-digit mobile" value="${v("phone")}"></div>
      <div class="field"><label for="co-ig">Instagram <span class="opt">(optional)</span></label><input id="co-ig" autocomplete="off" placeholder="@yourname" value="${v("instagram")}"></div>
      <div class="field full"><label for="co-email">Email <span class="opt">(optional)</span></label><input id="co-email" type="email" autocomplete="email" value="${v("email")}"></div>
      <div class="field full"><label for="co-addr">Address</label><input id="co-addr" autocomplete="street-address" placeholder="House no., street, area" value="${v("address")}"></div>
      <div class="field"><label for="co-city">City</label><input id="co-city" autocomplete="address-level2" value="${v("city")}"></div>
      <div class="field"><label for="co-state">State</label><input id="co-state" autocomplete="address-level1" list="co-states" value="${v("state")}"></div>
      <div class="field"><label for="co-zip">PIN code</label><input id="co-zip" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="${v("zip")}"></div>
      <div class="field"><label>Country</label><div style="padding:10px 0">India</div></div>
      <datalist id="co-states">${STATES.map(s => `<option value="${s}">`).join("")}</datalist>
      <div class="full hint">After you place the order, we'll contact you on your mobile number to confirm it and share payment details. Questions? DM <a href="${DM_LINK}" target="_blank" rel="noopener">@${INSTAGRAM}</a>.</div>
      <div class="full err" id="coErr" role="alert"></div>
    </form>`;
    foot = `<div class="row total"><span>Total</span><b>${money(total)}</b></div>
      <div style="display:flex;gap:10px"><button class="btn" id="backBtn" type="button">Back</button><button class="btn primary" id="placeBtn" type="button" style="flex:1;justify-content:center">Place order</button></div>`;
  } else if (step && step.done) {
    title = "Order placed";
    body = `<div class="done"><div class="tick">${I.check}</div><h4>Thank you! Order ${esc(step.done)} is in.</h4>
      <p>We'll contact you on ${esc(step.phone)} to confirm your order and share payment details.</p>
      <p>Questions? DM us on Instagram with your order number.</p>
      <div class="acts"><a class="btn primary" href="#my-orders" id="toMine">See my orders</a><a class="btn" href="${DM_LINK}" target="_blank" rel="noopener">${I.chat} DM @${INSTAGRAM}</a></div></div>`;
  } else if (!lines.length) {
    body = `<div class="done"><p>Your cart is empty.</p><a class="btn" href="#store" id="toShop">Browse products</a></div>`;
  } else {
    body = lines.map(l => `<div class="line-item">
        <div class="mini">${imgOf(l.p)}</div>
        <div><a class="nm" href="#product-${esc(l.id)}">${esc(l.p.name)}</a>${l.p.inStock === false ? `<div class="err" style="font-size:12px">Currently unavailable</div>` : ""}
          <div class="qty"><button data-dec="${esc(l.id)}" aria-label="${l.qty === 1 ? "Remove from cart" : "Remove one"}">−</button><span>${l.qty}</span><button data-inc="${esc(l.id)}" aria-label="Add one more" ${l.qty >= MAX_QTY ? "disabled" : ""}>+</button></div></div>
        <div class="mono">${money(priceOf(l.p) * l.qty)}</div>
      </div>`).join("");
    foot = `<div class="row"><span>Delivery</span><b>Free</b></div><div class="row total"><span>Total</span><b>${money(total)}</b></div>
      <button class="btn primary" id="coBtn" style="justify-content:center">Checkout</button>`;
  }
  $("#layer").innerHTML = `<div class="scrim" id="scrim"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="drawer-head"><h3>${esc(title)}</h3><button class="iconbtn" id="closeD" aria-label="Close">${I.x}</button></div>
      <div class="drawer-body">${body}</div>${foot ? `<div class="drawer-foot">${foot}</div>` : ""}
    </aside>`;
  hydratePhotos($("#layer"));
  $("#scrim").onclick = closeLayer; $("#closeD").onclick = closeLayer;
  ["#toMine", "#toShop"].forEach(s => { const a = $(s); if (a) a.addEventListener("click", closeLayer); });
  $("#layer").querySelectorAll("[data-inc]").forEach(b => b.onclick = () => { changeQty(b.dataset.inc, +1); openCart(); });
  $("#layer").querySelectorAll("[data-dec]").forEach(b => b.onclick = () => { changeQty(b.dataset.dec, -1); openCart(); });
  const co = $("#coBtn"); if (co) co.onclick = () => openCart("checkout");
  const bk = $("#backBtn"); if (bk) bk.onclick = () => openCart();
  const pl = $("#placeBtn"); if (pl) pl.onclick = placeOrder;
  const cf = $("#coForm"); if (cf) cf.addEventListener("input", () => { $("#coErr").textContent = ""; });
  const first = $("#layer").querySelector("input,button"); if (first && step === "checkout") first.focus();
}
const newCode = () => "EC-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[b % 31]).join("");
async function placeOrder() {
  const v = id => $("#" + id).value.trim();
  const c = { name: v("co-name"), phone: v("co-phone"), email: v("co-email"), instagram: v("co-ig").replace(/^@/, ""), address: v("co-addr"), city: v("co-city"), state: v("co-state"), zip: v("co-zip"), country: "India" };
  const errEl = $("#coErr"); errEl.textContent = "";
  const missing = [["name", "your name"], ["phone", "your mobile number"], ["address", "your address"], ["city", "your city"], ["state", "your state"], ["zip", "your PIN code"]].find(([k]) => !c[k]);
  if (missing) { errEl.textContent = `Add ${missing[1]} so we can deliver your order.`; return; }
  if (c.phone.replace(/\D/g, "").length < 10) { errEl.textContent = "Enter a 10-digit mobile number."; return; }
  if (!/^\d{6}$/.test(c.zip)) { errEl.textContent = "Enter your 6-digit PIN code."; return; }
  if (c.email && !/^\S+@\S+\.\S+$/.test(c.email)) { errEl.textContent = "Check your email address, or leave it empty."; return; }
  const lines = cartLines(); if (!lines.length) { errEl.textContent = "Your cart is empty."; return; }
  const gone = lines.find(l => l.p.inStock === false);
  if (gone) { errEl.textContent = `${gone.p.name} is currently unavailable. Go back and remove it to continue.`; return; }
  if (!S.db) { errEl.innerHTML = `Online ordering opens soon. To order now, DM us on Instagram <a href="${DM_LINK}" target="_blank" rel="noopener">@${INSTAGRAM}</a>.`; return; }
  const items = lines.map(l => ({ pid: l.p.id, name: l.p.name, qty: l.qty, price: priceOf(l.p) }));
  const order = { code: newCode(), customer: c, items, total: items.reduce((a, i) => a + i.price * i.qty, 0), status: "new", tracking: "" };
  const btn = $("#placeBtn"); btn.disabled = true; btn.textContent = "Placing order…";
  try {
    const docId = await S.db.placeOrder(order);
    S.mine = [{ docId, code: order.code, total: order.total, at: Date.now() }, ...S.mine].slice(0, 30);
    store.set("ec_my_orders", S.mine);
    store.set("ec_customer", { ...c });
    S.cart = []; saveCart();
    openCart({ done: order.code, phone: c.phone });
  } catch (e) {
    btn.disabled = false; btn.textContent = "Place order";
    errEl.innerHTML = `We couldn't place your order. Check your internet connection and try again, or DM us on Instagram <a href="${DM_LINK}" target="_blank" rel="noopener">@${INSTAGRAM}</a>.`;
    console.error(e);
  }
}

/* ---------- my orders (kept on the customer's device) ---------- */
async function renderMine() {
  const list = S.mine;
  const head = `<div class="section-head"><h2>My orders</h2><a href="#store" class="navlink">Continue shopping</a></div>`;
  if (!list.length) { $("#app").innerHTML = `<div class="wrap" style="padding-block:36px 56px">${head}<div class="empty">You haven't ordered on this device yet.</div></div>`; return; }
  const draw = () => {
    if (route() !== "my-orders") return;
    $("#app").innerHTML = `<div class="wrap" style="padding-block:36px 56px">${head}<div class="orders">${list.map(m => {
      const o = S.mineData[m.docId];
      return `<div class="order" style="grid-template-columns:minmax(0,1fr) auto">
        <div><h4><span class="mono">${esc(m.code)}</span>${o ? `<span class="pill ${esc(o.status)}">${esc(statusLabel(o.status))}</span>` : ""}</h4>
          <div class="meta">${esc(when(m.at))}</div>
          ${o ? `<ul>${(o.items || []).map(i => `<li>${i.qty} × ${esc(i.name)}</li>`).join("")}</ul>${o.tracking ? `<div class="meta" style="margin-top:8px">Tracking: <span class="mono" style="color:var(--fg)">${esc(o.tracking)}</span></div>` : ""}` : `<div class="meta">${S.mineData[m.docId] === null ? "Couldn't load this order. DM us your order number." : "Loading…"}</div>`}
        </div>
        <div class="price">${money(o ? orderTotal(o) : m.total)}</div></div>`;
    }).join("")}</div><p class="muted" style="margin:-30px 0 56px">Questions about an order? DM <a href="${DM_LINK}" target="_blank" rel="noopener">@${INSTAGRAM}</a> with your order number.</p></div>`;
  };
  draw();
  if (!S.db) return;
  await Promise.all(list.map(async m => { try { S.mineData[m.docId] = await S.db.getOrder(m.docId); } catch (e) { S.mineData[m.docId] = null; } }));
  draw();
}

/* ---------- admin ---------- */
function renderLock() {
  $("#app").innerHTML = `<div class="wrap lock"><div class="lock-box">
    <div style="color:var(--accent)">${I.key}</div>
    <h2>Admin access</h2><p>Enter your 4-digit code.</p>
    <div class="pin" id="pin">${[0, 1, 2, 3].map(i => `<input id="pin${i}" inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" autocomplete="off">`).join("")}</div>
    <div class="err" id="pinErr" role="alert"></div>
  </div></div>`;
  const ins = [0, 1, 2, 3].map(i => $("#pin" + i));
  ins[0].focus();
  ins.forEach((inp, i) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(-1);
      if (inp.value && i < 3) ins[i + 1].focus();
      const code = ins.map(x => x.value).join("");
      if (code.length === 4) {
        if (code === PIN) { S.unlocked = true; try { sessionStorage.setItem("ec_admin", "1"); } catch (e) {} render(); }
        else { $("#pinErr").textContent = "Wrong code. Try again."; const p = $("#pin"); p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake"); ins.forEach(x => x.value = ""); ins[0].focus(); }
      }
    });
    inp.addEventListener("keydown", e => { if (e.key === "Backspace" && !inp.value && i > 0) ins[i - 1].focus(); });
  });
}
function renderSignIn() {
  $("#app").innerHTML = `<div class="wrap lock"><div class="lock-box">
    <div style="color:var(--accent)">${I.key}</div>
    <h2>Sign in as the owner</h2><p>Only needed once on each phone or computer. Use the email and password you added in Firebase.</p>
    <form class="form" id="siForm" novalidate>
      <div class="field"><label for="si-email">Email</label><input id="si-email" type="email" autocomplete="username"></div>
      <div class="field"><label for="si-pass">Password</label><input id="si-pass" type="password" autocomplete="current-password"></div>
      <div class="err" id="siErr" role="alert"></div>
      <button class="btn primary block" id="siBtn" type="submit">Sign in</button>
    </form>
  </div></div>`;
  $("#si-email").focus();
  $("#siForm").onsubmit = async e => {
    e.preventDefault();
    const btn = $("#siBtn"), err = $("#siErr"); err.textContent = ""; btn.disabled = true; btn.textContent = "Signing in…";
    try { await S.db.signIn($("#si-email").value.trim(), $("#si-pass").value); }
    catch (x) {
      const code = (x && x.code) || "";
      err.textContent = /invalid|wrong|not-found|user-disabled/.test(code) ? "Wrong email or password." :
        /too-many/.test(code) ? "Too many tries. Wait a few minutes and try again." :
        /network/.test(code) ? "No internet connection. Check it and try again." :
        /operation-not-allowed/.test(code) ? "Turn on Email/Password sign-in in Firebase: Authentication → Sign-in method." :
        "Couldn't sign in. Try again.";
      btn.disabled = false; btn.textContent = "Sign in";
    }
  };
}
function setupCard() {
  if (S.mode === "setup") return `<div class="notice setup"><h3>Connect your database to start taking orders</h3>
    The website works, but orders can't be saved until Firebase is connected.
    <ol><li>Set up Firebase as shown in the steps (README.md).</li><li>Paste your Firebase settings into <b>firebase-config.txt</b> on GitHub and save.</li><li>Wait a minute for Render to update, then reload this page.</li></ol></div>`;
  if (S.mode === "error") return `<div class="notice setup"><h3>Can't reach the database</h3>Check your internet connection and reload. If it keeps happening, check the settings in firebase-config.txt.</div>`;
  const needProducts = S.productsLoaded && !S.products.length;
  const needCosts = S.products.length > 0 && !Object.keys(S.supplier).length;
  if (!needProducts && !needCosts) return "";
  return `<div class="notice setup"><h3>Finish setting up your store</h3>
    ${needProducts ? `<p style="margin:0 0 10px">Your store has no products yet. Add the 5 products we set up together (photos, prices, M.R.P. and descriptions).</p><div class="acts"><button class="btn primary" id="seedBtn">${I.plus} Add the 5 starter products</button></div>` : ""}
    ${needCosts ? `<p style="margin:${needProducts ? "14px" : "0"} 0 10px">Add your supplier costs so the panel can show your profit. Choose the file <b>PRIVATE-supplier-costs.json</b> (never upload that file to GitHub).</p><div class="acts"><label class="btn" for="costFile">Choose supplier-cost file</label><input id="costFile" type="file" accept=".json,application/json" hidden></div>` : ""}
  </div>`;
}
function renderAdminGate() {
  if (!S.unlocked) return renderLock();
  if (S.mode === "loading") { $("#app").innerHTML = `<div class="wrap lock"><p class="muted">Loading…</p></div>`; return; }
  if (S.mode !== "live") { $("#app").innerHTML = `<div class="wrap" style="padding-bottom:56px">${setupCard()}</div>`; return; }
  if (!S.authKnown) { $("#app").innerHTML = `<div class="wrap lock"><p class="muted">Loading…</p></div>`; return; }
  if (!S.user) return renderSignIn();
  if (S.adminChecking) { $("#app").innerHTML = `<div class="wrap lock"><p class="muted">Checking access…</p></div>`; return; }
  if (!S.isAdmin) {
    $("#app").innerHTML = `<div class="wrap lock"><div class="lock-box"><h2>No access</h2><p>${esc(S.user.email || "This account")} can't open the store's orders. Sign in with the owner account, or check the email in your Firestore rules.</p><button class="btn block" id="soBtn">Sign out</button></div></div>`;
    $("#soBtn").onclick = () => S.db.signOut();
    return;
  }
  renderAdmin();
}
function renderAdmin() {
  const orders = [...S.orders].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const live = orders.filter(o => o.status !== "cancelled");
  const paid = orders.filter(o => o.status === "paid" || o.status === "fulfilled");
  const rev = paid.reduce((a, o) => a + orderTotal(o), 0), prof = paid.reduce((a, o) => a + orderProfit(o), 0);
  const toFulfil = orders.filter(o => o.status === "paid").length;
  const waiting = orders.filter(o => o.status === "new").length;
  let content;
  if (S.tab === "products") {
    content = `<div class="toolbar"><p>Customer price = supplier cost × markup + supplier delivery, rounded to the rupee.</p><button class="btn primary" id="addP">${I.plus} Add product</button></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Product</th><th>Supplier</th><th class="n">Cost</th><th class="n">Delivery</th><th class="n">Markup</th><th class="n">Your price</th><th class="n">Profit/unit</th><th></th></tr></thead>
      <tbody>${S.products.length ? S.products.map(p => { const s = S.supplier[p.id]; return `<tr>
        <td><div class="pcell"><div class="mini">${imgOf(p)}</div><span>${esc(p.name)}${p.inStock === false ? ` <span class="pill cancelled">Out of stock</span>` : ""}</span></div></td>
        <td>${s && s.supplierUrl ? `<a class="sup" href="${esc(s.supplierUrl)}" target="_blank" rel="noopener">${esc(s.supplier || "Link")} ${I.ext}</a>` : esc((s && s.supplier) || "—")}</td>
        <td class="n">${s ? money(s.cost) : "—"}</td><td class="n">${s ? money(s.shipping) : "—"}</td><td class="n">${s ? "×" + esc(s.markup) : "—"}</td>
        <td class="n"><span class="acc">${money(priceOf(p))}</span></td><td class="n"><span class="grn">${s ? money(priceOf(p) - unitCostOf(s)) : "—"}</span></td>
        <td class="n" style="white-space:nowrap"><button class="iconbtn" data-edit="${esc(p.id)}" aria-label="Edit ${esc(p.name)}">${I.edit}</button><button class="iconbtn danger" data-del="${esc(p.id)}" aria-label="Delete ${esc(p.name)}">${I.trash}</button></td>
      </tr>`; }).join("") : `<tr><td colspan="8" class="muted" style="text-align:center;padding:30px">${S.productsLoaded ? "No products yet." : "Loading…"}</td></tr>`}</tbody>
    </table></div>`;
  } else {
    content = !orders.length ? `<p class="muted" style="margin:26px 0 56px">No orders yet. When a customer orders on the website, it shows up here.</p>` :
    `<div class="orders" style="margin-top:26px">${orders.map(o => { const c = o.customer || {}; return `<div class="order">
      <div><h4><span class="mono">${esc(o.code || o.docId)}</span><span class="pill ${esc(o.status)}">${esc(statusLabel(o.status))}</span></h4>
        <div class="meta">${esc(when(o.createdAt))}</div>
        <ul>${(o.items || []).map(i => { const s = S.supplier[i.pid], cur = S.products.find(p => p.id === i.pid), off = cur && Math.abs(priceOf(cur) - Number(i.price)) > 0.005;
          return `<li>${Number(i.qty)} × ${esc(i.name)} <span class="muted">· ${money(i.price)}</span>${off ? ` <span class="pill new">listing is ${money(priceOf(cur))}</span>` : ""} ${s && s.supplierUrl ? `<a class="sup" href="${esc(s.supplierUrl)}" target="_blank" rel="noopener">order on ${esc(s.supplier || "supplier")} ${I.ext}</a>` : ""}</li>`; }).join("")}</ul>
        <div class="meta" style="margin-top:8px">Total <b class="mono">${money(orderTotal(o))}</b> · profit <b class="mono" style="color:var(--good)">${money(orderProfit(o))}</b></div>
      </div>
      <div class="meta"><b>${esc(c.name)}</b><br><a href="tel:${esc(String(c.phone || "").replace(/[^\d+]/g, ""))}">${esc(c.phone)}</a>${c.email ? ` · ${esc(c.email)}` : ""}${c.instagram ? `<br><a href="${IG_PROFILE(c.instagram)}" target="_blank" rel="noopener">@${esc(c.instagram)}</a>` : ""}<br>${esc(c.address)}, ${esc(c.city)}${c.state ? ", " + esc(c.state) : ""} ${esc(c.zip)}
        ${o.tracking ? `<br>Tracking: <span class="mono" style="color:var(--fg)">${esc(o.tracking)}</span>` : ""}</div>
      <div class="acts">
        ${o.status === "new" ? `<button class="btn sm primary" data-st="paid" data-o="${esc(o.docId)}">Mark paid</button>` : ""}
        ${o.status === "paid" ? `<button class="btn sm primary" data-ship="${esc(o.docId)}">Mark shipped</button>` : ""}
        ${o.status === "fulfilled" ? `<button class="btn sm" data-ship="${esc(o.docId)}">Edit tracking</button>` : ""}
        ${o.status !== "cancelled" && o.status !== "fulfilled" ? `<button class="btn sm ghost" data-st="cancelled" data-o="${esc(o.docId)}">Cancel</button>` : ""}
        ${o.status === "cancelled" ? `<button class="btn sm ghost" data-st="new" data-o="${esc(o.docId)}">Restore</button>` : ""}
      </div></div>`; }).join("")}</div>`;
  }
  $("#app").innerHTML = `<div class="wrap">
    ${setupCard()}
    <section class="stats">
      <div class="stat"><div class="k">Orders</div><div class="v">${live.length}</div></div>
      <div class="stat"><div class="k">Paid revenue</div><div class="v">${money(rev)}</div></div>
      <div class="stat"><div class="k">Paid profit</div><div class="v">${money(prof)}</div></div>
      <div class="stat"><div class="k">To fulfil</div><div class="v">${toFulfil}</div></div>
    </section>
    <div class="tabs" role="tablist"><button role="tab" aria-selected="${S.tab === "products"}" data-tab="products">Products</button><button role="tab" aria-selected="${S.tab === "orders"}" data-tab="orders">Orders (${live.length})${waiting ? ` · ${waiting} new` : ""}</button></div>
    ${content}
    ${S.db.kind === "demo" ? `<p class="hint" style="margin:-36px 0 40px">Demo mode: everything here is saved only in this browser.</p>` : ""}
  </div>`;
  hydratePhotos($("#app"));
  const A = $("#app");
  A.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; renderAdmin(); });
  const ap = $("#addP"); if (ap) ap.onclick = () => editProduct(null);
  A.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editProduct(S.products.find(p => p.id === b.dataset.edit)));
  A.querySelectorAll("[data-del]").forEach(b => b.onclick = () => confirmDelete(S.products.find(p => p.id === b.dataset.del)));
  A.querySelectorAll("[data-st]").forEach(b => b.onclick = () => setOrder(b.dataset.o, { status: b.dataset.st }));
  A.querySelectorAll("[data-ship]").forEach(b => b.onclick = () => shipDialog(b.dataset.ship));
  const seed = $("#seedBtn"); if (seed) seed.onclick = async () => {
    seed.disabled = true; seed.textContent = "Adding…";
    try { for (const p of STARTER) { const { id, ...data } = p; await S.db.saveProduct(id, data); } toast("Products added"); }
    catch (e) { seed.disabled = false; seed.textContent = "Add the 5 starter products"; toast("Couldn't add products. Check your Firestore rules."); }
  };
  const cf = $("#costFile"); if (cf) cf.onchange = async () => {
    const f = cf.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()), sup = j.suppliers || j; let n = 0;
      for (const [id, d] of Object.entries(sup)) { if (!d || typeof d !== "object") continue; await S.db.saveSupplier(id, { supplier: String(d.supplier || ""), supplierUrl: String(d.supplierUrl || ""), cost: Number(d.cost) || 0, shipping: Number(d.shipping) || 0, markup: Number(d.markup) || 1 }); n++; }
      toast(n ? `Supplier costs added for ${n} products` : "That file has no supplier costs in it");
    } catch (e) { toast("That isn't the supplier-cost file. Choose PRIVATE-supplier-costs.json."); }
  };
}
async function setOrder(docId, patch) {
  try { await S.db.updateOrder(docId, patch); toast("Order updated"); } catch (e) { toast("Couldn't update the order. Try again."); }
}
function shipDialog(docId) {
  const o = S.orders.find(x => x.docId === docId); if (!o) return;
  $("#layer").innerHTML = `<div class="scrim"></div><div class="modal"><div class="modal-box" role="dialog" aria-modal="true" aria-label="Ship order">
    <h3>Ship ${esc(o.code || "order")}</h3>
    <div class="field"><label for="trk">Tracking number <span class="opt">(optional)</span></label><input id="trk" value="${esc(o.tracking || "")}" placeholder="e.g. Delhivery 1490811234567"></div>
    <p class="hint">The customer sees this on their "My orders" page.</p>
    <div class="modal-actions"><button class="btn" id="mc">Cancel</button><button class="btn primary" id="ms">Save &amp; mark shipped</button></div>
  </div></div>`;
  $("#trk").focus();
  $("#mc").onclick = closeLayer;
  $("#ms").onclick = async () => { await setOrder(docId, { status: "fulfilled", tracking: $("#trk").value.trim().slice(0, 80) }); closeLayer(); };
}
function confirmDelete(p) {
  if (!p) return;
  $("#layer").innerHTML = `<div class="scrim"></div><div class="modal"><div class="modal-box" role="dialog" aria-modal="true" aria-label="Delete product">
    <h3>Delete ${esc(p.name)}?</h3><p class="muted" style="margin:0">It disappears from the store right away. Past orders keep their details.</p>
    <div class="modal-actions"><button class="btn" id="mc">Keep it</button><button class="btn primary" id="md" style="background:var(--bad);border-color:var(--bad);color:#fff">Delete</button></div>
  </div></div>`;
  $("#mc").onclick = closeLayer;
  $("#md").onclick = async () => { try { await S.db.deleteProduct(p.id); await S.db.deleteSupplier(p.id).catch(() => {}); toast("Product deleted"); } catch (e) { toast("Couldn't delete the product."); } closeLayer(); };
}
function editProduct(p) {
  const isNew = !p;
  const s = (p && S.supplier[p.id]) || {};
  p = p ? { ...p, supplier: s.supplier || "", supplierUrl: s.supplierUrl || "", cost: s.cost ?? "", shipping: s.shipping ?? "", markup: s.markup ?? 2 }
        : { name: "", description: "", category: "other", supplier: "", supplierUrl: "", cost: "", shipping: "", markup: 2, images: [], features: [] };
  let photos = [...photosOf(p)];
  $("#layer").innerHTML = `<div class="scrim"></div><div class="modal"><div class="modal-box" role="dialog" aria-modal="true" aria-label="${isNew ? "Add" : "Edit"} product">
    <h3>${isNew ? "Add product" : "Edit product"}</h3>
    <form class="form" id="pf" novalidate>
      <div class="field full"><label for="pf-name">Product name</label><input id="pf-name" value="${esc(p.name)}"></div>
      <div class="field full"><label for="pf-desc">Short description</label><textarea id="pf-desc" rows="2">${esc(p.description || "")}</textarea></div>
      <div class="field"><label for="pf-cat">Category</label><select id="pf-cat">${CATS.map(([k, l]) => `<option value="${k}" ${p.category === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <div class="field"><label for="pf-sup">Supplier</label><input id="pf-sup" value="${esc(p.supplier)}" placeholder="DeoDap"></div>
      <div class="field full"><label for="pf-url">Supplier link <span class="opt">(only you see this)</span></label><input id="pf-url" value="${esc(p.supplierUrl)}" placeholder="https://…"></div>
      <div class="field"><label for="pf-cost">Supplier cost (₹)</label><input id="pf-cost" inputmode="decimal" value="${esc(p.cost)}"></div>
      <div class="field"><label for="pf-ship">Supplier delivery (₹)</label><input id="pf-ship" inputmode="decimal" value="${esc(p.shipping)}"></div>
      <div class="field"><label for="pf-mk">Markup (×)</label><input id="pf-mk" inputmode="decimal" value="${esc(p.markup)}"></div>
      <div class="field"><label>Customer price</label><div class="mono" id="pf-price" style="padding:10px 0;color:var(--accent);font-weight:700"></div></div>
      <div class="field"><label for="pf-mrp">M.R.P. (₹) <span class="opt">(optional)</span></label><input id="pf-mrp" inputmode="decimal" value="${esc(p.mrp ?? "")}" placeholder="As printed on the box"></div>
      <div class="field"><label for="pf-stock">Availability</label><label class="check"><input type="checkbox" id="pf-stock" ${p.inStock === false ? "" : "checked"}> In stock</label></div>
      <div class="field full"><label for="pf-feat">About this item <span class="opt">(one point per line)</span></label><textarea id="pf-feat" rows="5">${esc((Array.isArray(p.features) ? p.features : []).join("\n"))}</textarea></div>
      <div class="field full"><label for="pf-drop">Photos <span class="opt">(the first is the main photo)</span></label>
        <div class="photo-strip" id="pf-strip"></div>
        <div class="dropzone" id="pf-drop" tabindex="0">
          <div class="dz-text"><b>Click here, then paste a photo (Ctrl+V)</b><span>Copy a photo from the supplier's page (right-click → Copy image), or <label for="pf-img" class="linkish">choose files</label>.</span></div>
        </div>
        <input id="pf-img" type="file" accept="image/*" multiple hidden>
        <span class="hint" id="pf-imgHint"></span></div>
      <div class="full err" id="pfErr" role="alert"></div>
    </form>
    <div class="modal-actions"><button class="btn" id="mc">Cancel</button><button class="btn primary" id="msv">${isNew ? "Add product" : "Save changes"}</button></div>
  </div></div>`;
  const hint = $("#pf-imgHint");
  const upd = () => {
    const pr = calcPrice({ cost: $("#pf-cost").value, shipping: $("#pf-ship").value, markup: $("#pf-mk").value }), m = Number($("#pf-mrp").value) || 0;
    $("#pf-price").textContent = money(pr) + (m > 0 ? (pr > m ? " · above M.R.P." : (pr < m ? ` · ${Math.round((1 - pr / m) * 100)}% off` : "")) : "");
  };
  ["pf-cost", "pf-ship", "pf-mk", "pf-mrp"].forEach(id => $("#" + id).addEventListener("input", upd)); upd();
  const countText = () => photos.length ? `${photos.length} of ${MAX_PHOTOS} photos.` : "No photo yet. The store shows a drawn icon until you add one.";
  const strip = () => {
    $("#pf-strip").innerHTML = photos.length ? photos.map((r, i) => `<div class="ph">${photoTag(r, "Photo " + (i + 1))}${i === 0 ? `<span class="ph-tag">Main</span>` : `<button type="button" class="ph-tag" data-main="${i}" aria-label="Make photo ${i + 1} the main photo">Make main</button>`}<button type="button" class="ph-x" data-rm="${i}" aria-label="Remove photo ${i + 1}">${I.x}</button></div>`).join("")
      : `<div class="ph empty">${ART[$("#pf-cat").value] || ART.other}</div>`;
    hydratePhotos($("#pf-strip"));
    $("#pf-strip").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { photos.splice(+b.dataset.rm, 1); strip(); hint.textContent = countText() + " Save to apply."; });
    $("#pf-strip").querySelectorAll("[data-main]").forEach(b => b.onclick = () => { photos.unshift(photos.splice(+b.dataset.main, 1)[0]); strip(); hint.textContent = "Main photo changed. Save to apply."; });
  };
  strip(); hint.textContent = countText();
  $("#pf-cat").addEventListener("change", () => { if (!photos.length) strip(); });
  const addFile = async f => {
    if (!f || !/^image\//.test(f.type)) { hint.textContent = "That isn't an image. Copy the photo itself (Copy image), not its link."; return; }
    if (photos.length >= MAX_PHOTOS) { hint.textContent = `Up to ${MAX_PHOTOS} photos. Remove one to add another.`; return; }
    hint.textContent = "Adding photo…";
    try { const data = await compressImage(f); const id = await S.db.savePhoto(data); const ref = "photo:" + id; PHOTO_CACHE.set(ref, data); photos.push(ref); strip(); hint.textContent = "Photo added. Save to put it in the store."; }
    catch (e) { hint.textContent = "Couldn't add that photo. Try a different image."; }
  };
  $("#pf-img").onchange = async e => { for (const f of [...e.target.files]) await addFile(f); e.target.value = ""; };
  $(".modal-box").addEventListener("paste", e => {
    const it = [...(e.clipboardData?.items || [])].find(i => i.kind === "file" && i.type.startsWith("image/"));
    if (it) { e.preventDefault(); addFile(it.getAsFile()); }
    else if (document.activeElement === $("#pf-drop")) hint.textContent = "No image on the clipboard. Right-click the photo and choose Copy image first.";
  });
  const dz = $("#pf-drop");
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", e => { e.preventDefault(); dz.classList.remove("over"); const f = e.dataTransfer.files[0]; if (f) addFile(f); });
  $("#mc").onclick = closeLayer;
  $("#msv").onclick = async () => {
    const err = $("#pfErr"); err.textContent = "";
    const raw = ["pf-cost", "pf-ship", "pf-mk"].map(id => $("#" + id).value.trim());
    const priv = { supplier: $("#pf-sup").value.trim(), supplierUrl: $("#pf-url").value.trim(), cost: +raw[0], shipping: +raw[1], markup: +raw[2] };
    const mrpRaw = $("#pf-mrp").value.trim();
    const pub = {
      name: $("#pf-name").value.trim(), description: $("#pf-desc").value.trim(), category: $("#pf-cat").value,
      images: photos, order: p.order ?? Date.now(), price: calcPrice(priv),
      mrp: mrpRaw === "" ? null : +mrpRaw, inStock: $("#pf-stock").checked,
      features: $("#pf-feat").value.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 10),
    };
    if (!pub.name) { err.textContent = "Give the product a name."; return; }
    if (raw.some(x => x === "") || [priv.cost, priv.shipping, priv.markup].some(n => !isFinite(n) || n < 0)) { err.textContent = "Cost, delivery and markup must be numbers."; return; }
    if (priv.markup < 1) { err.textContent = "Markup must be at least 1, or you'd sell at a loss."; return; }
    if (priv.supplierUrl && !/^https?:\/\//.test(priv.supplierUrl)) { err.textContent = "Supplier link must start with https://"; return; }
    if (pub.mrp !== null && (!isFinite(pub.mrp) || pub.mrp < 0)) { err.textContent = "M.R.P. must be a number, or leave it empty."; return; }
    if (pub.mrp && pub.price > pub.mrp) { err.textContent = `Your price (${money(pub.price)}) is above the M.R.P. (${money(pub.mrp)}). Selling above M.R.P. isn't allowed in India, so lower the markup or check the M.R.P.`; return; }
    const id = isNew ? "p-" + Date.now().toString(36) : p.id;
    const btn = $("#msv"); btn.disabled = true;
    try { await S.db.saveSupplier(id, priv); await S.db.saveProduct(id, pub); closeLayer(); toast(isNew ? "Product added" : "Changes saved"); }
    catch (e) { btn.disabled = false; err.textContent = "Couldn't save. Check your internet connection and try again."; }
  };
}

/* ---------- routing & updates ---------- */
function render() {
  renderNav();
  const r = route();
  if (r !== "admin" && !r.startsWith("product-")) document.title = "Electronic Corner · Trending gadgets delivered across India";
  if (r === "admin") renderAdminGate();
  else if (r === "my-orders") renderMine();
  else if (r.startsWith("product-")) renderProduct(r.slice(8));
  else renderStore();
  hydratePhotos($("#app"));
}
/* data changed: redraw, but never wipe a form someone is typing in */
function onData(kind) {
  if (document.querySelector(".modal")) { S.pendingRender = true; return; }
  const r = route();
  if (r === "admin") {
    if (!S.unlocked) return;
    if (S.mode === "live" && !S.user && kind !== "auth") return;
    renderNav(); renderAdminGate(); return;
  }
  if (kind === "products") { const y = scrollY; render(); scrollTo(0, y); }
}
window.addEventListener("hashchange", () => { closeLayer(); scrollTo(0, 0); render(); });
$("#app").addEventListener("click", e => {
  const b = e.target.closest(".buy-ctl button,[data-buynow]");
  if (!b || b.disabled) return;
  if (b.dataset.add) changeQty(b.dataset.add, +1);
  else if (b.dataset.inc) changeQty(b.dataset.inc, +1);
  else if (b.dataset.dec) changeQty(b.dataset.dec, -1);
  else if (b.dataset.buynow) { if (!qtyOf(b.dataset.buynow)) changeQty(b.dataset.buynow, +1); openCart("checkout"); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#layer").innerHTML) closeLayer(); });

let adminSubs = [];
function startAdminFeeds() {
  adminSubs.forEach(f => { try { f(); } catch (e) {} }); adminSubs = [];
  S.isAdmin = false; S.adminErr = ""; S.orders = []; S.supplier = {}; S.adminChecking = !!S.user;
  if (!S.user) return;
  adminSubs.push(S.db.watchSupplier(m => { S.supplier = m; S.isAdmin = true; S.adminChecking = false; onData("admin"); },
    () => { S.isAdmin = false; S.adminChecking = false; onData("admin"); }));
  adminSubs.push(S.db.watchOrders(list => { S.orders = list; onData("admin"); }, () => {}));
}

async function boot() {
  render();
  const showStarter = () => { S.products = sortP(STARTER); S.productsLoaded = true; };
  if (DEMO) { S.db = demoDB(); S.mode = "live"; }
  else {
    const cfg = await loadConfig();
    if (!cfg) { S.mode = "setup"; showStarter(); render(); return; }
    try { S.db = await firebaseDB(cfg); S.mode = "live"; }
    catch (e) { console.error(e); S.mode = "error"; showStarter(); render(); return; }
  }
  const timer = setTimeout(() => { if (!S.productsLoaded) { S.productsLoaded = true; S.loadErr = "Products are taking too long to load. Refresh the page to try again."; onData("products"); } }, 12000);
  S.db.watchProducts(list => { clearTimeout(timer); S.products = sortP(list); S.productsLoaded = true; S.loadErr = ""; onData("products"); },
    e => { clearTimeout(timer); console.error(e); S.productsLoaded = true; S.loadErr = "Couldn't load products. Refresh the page to try again."; onData("products"); });
  S.db.onAuth(u => { S.user = u; S.authKnown = true; startAdminFeeds(); onData("auth"); });
}
boot();

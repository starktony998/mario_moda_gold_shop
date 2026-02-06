// ==============================
// CONFIG
// ==============================
const SHOP_NAME = "Mario_Moda_Gold_Shop";
const WHATSAPP_NUMBER = "393510901180"; // +39 (Italia) + 3510901180
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

const CATEGORIES = [
  "Scarpe",
  "Borse",
  "Camicia",
  "T Shirt e polo",
  "Giubbini",
  "Cinture",
  "Capelli",
  "Occhiali",
  "Orologi"
];

// ==============================
// PRODUCTS (AUTO-PLACEHOLDER: 20 per categoria)
// - Dopo tu cambi NOME, PREZZO, IMMAGINE, DISPONIBILITÀ
// ==============================
function generatePlaceholders() {
  const products = [];
  let id = 1;

  for (const cat of CATEGORIES) {
    for (let i = 1; i <= 20; i++) {
      products.push({
        id: `p${id++}`,
        name: `${cat} - Articolo ${String(i).padStart(2, "0")}`,
        category: cat,
        price: randomPriceForCategory(cat),
        available: true,
        image: "" // metti qui il path tipo "img/scarpe1.jpg"
      });
    }
  }
  return products;
}

// Prezzi demo (li puoi cambiare come vuoi)
function randomPriceForCategory(cat) {
  const ranges = {
    "Scarpe": [49, 159],
    "Borse": [39, 179],
    "Camicia": [19, 79],
    "T Shirt e polo": [15, 69],
    "Giubbini": [49, 199],
    "Cinture": [15, 59],
    "Capelli": [9, 49],
    "Occhiali": [19, 99],
    "Orologi": [29, 199]
  };
  const [min, max] = ranges[cat] || [10, 100];
  const v = Math.floor(Math.random() * (max - min + 1)) + min;
  return Number((v + 0.99).toFixed(2));
}

const PRODUCTS = generatePlaceholders();

// ==============================
// STATE
// ==============================
const state = {
  route: "home",
  category: "Tutti",
  search: "",
  onlyAvailable: false,
  sort: "default",
  cart: loadCart() // { [productId]: qty }
};

// ==============================
// DOM
// ==============================
const pages = {
  home: document.getElementById("home"),
  catalogo: document.getElementById("catalogo"),
  contatti: document.getElementById("contatti"),
  "chi-siamo": document.getElementById("chi-siamo"),
};

const navLinks = Array.from(document.querySelectorAll("[data-route]"));

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const categoryList = document.getElementById("categoryList");
const productGrid = document.getElementById("productGrid");
const resultCount = document.getElementById("resultCount");
const catalogTitle = document.getElementById("catalogTitle");
const catalogSubtitle = document.getElementById("catalogSubtitle");

const onlyAvailableChk = document.getElementById("onlyAvailableChk");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const sortSelect = document.getElementById("sortSelect");

const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const checkoutBtn = document.getElementById("checkoutBtn");
const clearCartBtn = document.getElementById("clearCartBtn");

const yearEl = document.getElementById("year");

const homeCategories = document.getElementById("homeCategories");
const homeFeatured = document.getElementById("homeFeatured");
const homeWhatsBtn = document.getElementById("homeWhatsBtn");
const contactsWhatsBtn = document.getElementById("contactsWhatsBtn");

// ==============================
// INIT
// ==============================
function init() {
  yearEl.textContent = new Date().getFullYear();

  renderHome();
  renderCategories();
  renderProducts();
  renderCart();

  // routing by hash
  window.addEventListener("hashchange", syncRouteFromHash);
  syncRouteFromHash();

  navLinks.forEach(a => {
    a.addEventListener("click", (e) => {
      const route = a.getAttribute("data-route");
      if (!route) return;
      // allow default hash nav, but also update UI
      setRoute(route);
    });
  });

  // search
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim();
    if (state.route !== "catalogo") setRoute("catalogo");
    renderProducts();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";
    renderProducts();
  });

  // filters
  onlyAvailableChk.addEventListener("change", () => {
    state.onlyAvailable = !!onlyAvailableChk.checked;
    renderProducts();
  });

  resetFiltersBtn.addEventListener("click", () => {
    state.category = "Tutti";
    state.onlyAvailable = false;
    state.sort = "default";
    onlyAvailableChk.checked = false;
    sortSelect.value = "default";
    renderCategories();
    renderProducts();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    renderProducts();
  });

  // cart drawer
  cartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  // checkout
  checkoutBtn.addEventListener("click", checkoutToWhatsApp);
  clearCartBtn.addEventListener("click", () => {
    state.cart = {};
    persistCart();
    renderCart();
  });

  // Whats buttons
  homeWhatsBtn.addEventListener("click", () => openWhatsAppMessage("Ciao! Vorrei informazioni su Mario_Moda_Gold_Shop."));
  contactsWhatsBtn.addEventListener("click", () => openWhatsAppMessage("Ciao! Vorrei informazioni su spedizione e disponibilità prodotti."));
}

function syncRouteFromHash() {
  const hash = (window.location.hash || "#home").replace("#", "");
  const route = pages[hash] ? hash : "home";
  setRoute(route);
}

function setRoute(route) {
  state.route = route;

  Object.keys(pages).forEach(k => pages[k].classList.remove("is-visible"));
  pages[route].classList.add("is-visible");

  navLinks.forEach(l => l.classList.remove("is-active"));
  navLinks
    .filter(l => l.getAttribute("data-route") === route)
    .forEach(l => l.classList.add("is-active"));

  // when entering catalog, render
  if (route === "catalogo") {
    renderProducts();
  }
}

// ==============================
// HOME
// ==============================
function renderHome() {
  // chips on home
  homeCategories.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = cat;
    b.addEventListener("click", () => {
      state.category = cat;
      setRoute("catalogo");
      renderCategories();
      renderProducts();
      window.location.hash = "#catalogo";
    });
    homeCategories.appendChild(b);
  });

  // featured: take some first items
  const featured = PRODUCTS.slice(0, 4);
  homeFeatured.innerHTML = "";
  featured.forEach(p => {
    const el = document.createElement("div");
    el.className = "featured-item";
    el.innerHTML = `
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="meta">${escapeHtml(p.category)} • <strong>€${p.price.toFixed(2)}</strong></div>
    `;
    el.addEventListener("click", () => {
      state.category = p.category;
      setRoute("catalogo");
      renderCategories();
      renderProducts(p.id);
      window.location.hash = "#catalogo";
    });
    homeFeatured.appendChild(el);
  });
}

// ==============================
// CATEGORIES SIDEBAR
// ==============================
function renderCategories() {
  categoryList.innerHTML = "";

  const allBtn = makeCategoryButton("Tutti", PRODUCTS.length);
  categoryList.appendChild(allBtn);

  for (const cat of CATEGORIES) {
    const count = PRODUCTS.filter(p => p.category === cat).length;
    categoryList.appendChild(makeCategoryButton(cat, count));
  }

  // active class
  Array.from(categoryList.querySelectorAll(".cat-btn")).forEach(btn => {
    if (btn.dataset.cat === state.category) btn.classList.add("is-active");
  });
}

function makeCategoryButton(cat, count) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cat-btn";
  btn.dataset.cat = cat;
  btn.innerHTML = `<span>${escapeHtml(cat)}</span><span class="cat-count">${count}</span>`;
  btn.addEventListener("click", () => {
    state.category = cat;
    renderCategories();
    renderProducts();
  });
  return btn;
}

// ==============================
// PRODUCTS GRID
// ==============================
function renderProducts(scrollToId = null) {
  let list = [...PRODUCTS];

  // category
  if (state.category !== "Tutti") {
    list = list.filter(p => p.category === state.category);
  }

  // availability filter
  if (state.onlyAvailable) {
    list = list.filter(p => p.available);
  }

  // search
  const q = state.search.toLowerCase();
  if (q) {
    list = list.filter(p => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }

  // sort
  list = sortList(list, state.sort);

  // titles
  const title = state.category === "Tutti" ? "Tutti i prodotti" : state.category;
  catalogTitle.textContent = title;
  resultCount.textContent = String(list.length);
  catalogSubtitle.innerHTML = `Risultati: <span id="resultCount">${list.length}</span>`;

  // render
  productGrid.innerHTML = "";
  if (list.length === 0) {
    productGrid.innerHTML = `<div class="page-card" style="grid-column:1/-1;">Nessun prodotto trovato.</div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.id = `card-${p.id}`;

    const imgHtml = p.image
      ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" style="width:100%;height:150px;object-fit:cover;display:block;">`
      : `<div class="product-img">FOTO</div>`;

    card.innerHTML = `
      ${imgHtml}
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-meta">
          <span>${escapeHtml(p.category)}</span>
          <span class="product-price">€${p.price.toFixed(2)}</span>
        </div>
        <div class="availability ${p.available ? "ok" : "no"}">
          ${p.available ? "Disponibile" : "Esaurito"}
        </div>
        <div class="product-actions">
          <button class="btn btn-primary full" type="button" ${p.available ? "" : "disabled"} data-add="${p.id}">
            ${p.available ? "Aggiungi al carrello" : "Non disponibile"}
          </button>
        </div>
      </div>
    `;

    productGrid.appendChild(card);
  });

  // bind add-to-cart
  Array.from(productGrid.querySelectorAll("[data-add]")).forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-add");
      addToCart(id);
      openCart();
    });
  });

  if (scrollToId) {
    const el = document.getElementById(`card-${scrollToId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function sortList(list, sort) {
  if (sort === "priceAsc") return list.sort((a,b) => a.price - b.price);
  if (sort === "priceDesc") return list.sort((a,b) => b.price - a.price);
  if (sort === "nameAsc") return list.sort((a,b) => a.name.localeCompare(b.name, "it"));
  return list; // default
}

// ==============================
// CART
// ==============================
function addToCart(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p || !p.available) return;

  state.cart[productId] = (state.cart[productId] || 0) + 1;
  persistCart();
  renderCart();
}

function removeFromCart(productId) {
  delete state.cart[productId];
  persistCart();
  renderCart();
}

function changeQty(productId, delta) {
  const current = state.cart[productId] || 0;
  const next = current + delta;
  if (next <= 0) {
    removeFromCart(productId);
    return;
  }
  state.cart[productId] = next;
  persistCart();
  renderCart();
}

function cartItems() {
  return Object.entries(state.cart).map(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return { product: p, qty };
  }).filter(x => !!x.product);
}

function cartCount() {
  return cartItems().reduce((sum, x) => sum + x.qty, 0);
}

function cartTotal() {
  return cartItems().reduce((sum, x) => sum + (x.product.price * x.qty), 0);
}

function renderCart() {
  const items = cartItems();
  cartItemsEl.innerHTML = "";

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<div class="page-card">Il carrello è vuoto.</div>`;
  } else {
    items.forEach(({ product, qty }) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${escapeHtml(product.name)}</div>
            <div class="cart-item-meta">${escapeHtml(product.category)} • €${product.price.toFixed(2)}</div>
          </div>
          <button class="btn btn-ghost" type="button" data-remove="${product.id}" title="Rimuovi">Rimuovi</button>
        </div>

        <div class="cart-item-actions">
          <div class="qty">
            <button type="button" data-dec="${product.id}">-</button>
            <span>${qty}</span>
            <button type="button" data-inc="${product.id}">+</button>
          </div>
          <strong>€${(product.price * qty).toFixed(2)}</strong>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

    // bind
    cartItemsEl.querySelectorAll("[data-remove]").forEach(b => {
      b.addEventListener("click", () => removeFromCart(b.getAttribute("data-remove")));
    });
    cartItemsEl.querySelectorAll("[data-dec]").forEach(b => {
      b.addEventListener("click", () => changeQty(b.getAttribute("data-dec"), -1));
    });
    cartItemsEl.querySelectorAll("[data-inc]").forEach(b => {
      b.addEventListener("click", () => changeQty(b.getAttribute("data-inc"), +1));
    });
  }

  cartCountEl.textContent = String(cartCount());
  cartTotalEl.textContent = `€${cartTotal().toFixed(2)}`;
}

// ==============================
// WHATSAPP CHECKOUT
// ==============================
function checkoutToWhatsApp() {
  const items = cartItems();
  if (items.length === 0) {
    alert("Il carrello è vuoto.");
    return;
  }

  const lines = items.map(x => {
    return `- ${x.product.name} (x${x.qty})`;
  });

  const text =
    `Ciao, vorrei acquistare su ${SHOP_NAME} e vorrei:\n` +
    lines.join("\n");

  openWhatsAppMessage(text);
}

function openWhatsAppMessage(message) {
  const url = WHATSAPP_BASE + encodeURIComponent(message);
  window.open(url, "_blank", "noopener,noreferrer");
}

// ==============================
// UI: CART DRAWER
// ==============================
function openCart() {
  overlay.classList.remove("hidden");
  cartDrawer.classList.remove("hidden");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  overlay.classList.add("hidden");
  cartDrawer.classList.add("hidden");
  cartDrawer.setAttribute("aria-hidden", "true");
}

// ==============================
// STORAGE
// ==============================
function loadCart() {
  try {
    const raw = localStorage.getItem("mmgs_cart");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return {};
}

function persistCart() {
  localStorage.setItem("mmgs_cart", JSON.stringify(state.cart));
}

// ==============================
// UTILS
// ==============================
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s){ return escapeHtml(s); }

// ==============================
// START
// ==============================
init();

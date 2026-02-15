// ==============================
// CONFIG
// ==============================
const SHOP_NAME = "Mario_Moda_Gold_Shop";
const WHATSAPP_NUMBER = "393510901180";
const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}?text=`;

// ==============================
// CATEGORIES
// ==============================
const CATEGORIES = [
  "Scarpe",
  "Borse",
  "Camicia",
  "T Shirt e polo",
  "Giubbini",
  "Cinture",
  "Cappelli",
  "Occhiali",
  "Orologi"
];

// ==============================
// TAGLIE: preset per categoria
// ==============================
function getSizeOptionsForCategory(category) {
  if (category === "Scarpe") {
    // 36..46
    return Array.from({ length: 11 }, (_, i) => String(36 + i));
  }
  if (category === "Camicia" || category === "T Shirt e polo" || category === "Giubbini") {
    return ["XS", "S", "M", "L", "XL", "XXL"];
  }
  // accessori: taglia unica
  return ["UNICA"];
}

// crea un oggetto sizes di default (tutte disponibili) in base alla categoria
function defaultSizesForCategory(category) {
  const opts = getSizeOptionsForCategory(category);
  const obj = {};
  opts.forEach(s => (obj[s] = true));
  return obj;
}

// ==============================
// 🔥 PRODOTTI MANUALI: QUI INSERISCI TUTTO TU
// - status: "available" | "soldout" | "hidden"
// - sizes: oggetto {taglia: true/false}
//   * se non lo metti, lo crea automatico (tutte disponibili) in base alla categoria
// ==============================
const PRODUCTS = [
  {
    id: "p1",
    name: "Scarpa 1",
    category: "Scarpe",
    price: 180,00,
    status: "available",
    image: "img/scarpa1.jpeg",
    sizes: {
      "36": false,
      "37": false,
      "38": false,
      "39": false,
      "40": true,
      "41": false,
      "42": false,
      "43": true,
      "44": false,
      "45": false,
      "46": false
    }
  },
  {
    id: "p2",
    name: "Camicia Slim Fit Bianca",
    category: "Camicia",
    price: 59.99,
    status: "available",
    image: "img/camicia1.jpeg",
    sizes: {
      "XS": false,
      "S": true,
      "M": true,
      "L": true,
      "XL": false,
      "XXL": true
    }
  },
  {
    id: "p3",
    name: "Borsa Elegance Gold",
    category: "Borse",
    price: 129.99,
    status: "soldout",
    image: "img/borsa1.jpeg"
    // sizes non serve: sarà "UNICA" e comunque non acquistabile perché soldout
  }
];

// ==============================
// NORMALIZZAZIONE PRODOTTI
// (assicura sizes coerenti e presenti)
// ==============================
function normalizeProducts() {
  const allowedCats = new Set(CATEGORIES);

  PRODUCTS.forEach(p => {
    if (!allowedCats.has(p.category)) {
      console.warn("Categoria non valida per prodotto:", p);
    }

    // status default
    if (!p.status) p.status = "available";

    // sizes default
    if (!p.sizes || typeof p.sizes !== "object") {
      p.sizes = defaultSizesForCategory(p.category);
      return;
    }

    // forza le sole taglie ammesse per la categoria
    const allowedSizes = new Set(getSizeOptionsForCategory(p.category));
    const cleaned = {};
    for (const s of Object.keys(p.sizes)) {
      if (allowedSizes.has(s)) cleaned[s] = !!p.sizes[s];
    }
    // se manca qualche taglia ammessa, la aggiungo a true (così non si rompe nulla)
    allowedSizes.forEach(s => {
      if (!(s in cleaned)) cleaned[s] = true;
    });
    p.sizes = cleaned;
  });
}

// ==============================
// STATE
// cart: { [key]: qty } dove key = "productId|size"
// ==============================
const state = {
  route: "home",
  category: "Tutti",
  search: "",
  onlyAvailable: false,
  sort: "default",
  cart: loadCart()
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
  normalizeProducts();

  yearEl.textContent = new Date().getFullYear();

  renderHome();
  renderCategories();
  renderProducts();
  renderCart();

  window.addEventListener("hashchange", syncRouteFromHash);
  syncRouteFromHash();

  navLinks.forEach(a => {
    a.addEventListener("click", () => {
      const route = a.getAttribute("data-route");
      if (!route) return;
      setRoute(route);
    });
  });

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

  cartBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  checkoutBtn.addEventListener("click", checkoutToWhatsApp);
  clearCartBtn.addEventListener("click", () => {
    state.cart = {};
    persistCart();
    renderCart();
  });

  homeWhatsBtn?.addEventListener("click", () =>
    openWhatsAppMessage("Ciao! Vorrei informazioni.")
  );
  contactsWhatsBtn?.addEventListener("click", () =>
    openWhatsAppMessage("Ciao! Vorrei informazioni su disponibilità.")
  );
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

  if (route === "catalogo") renderProducts();
}

// ==============================
// HOME
// ==============================
function renderHome() {
  homeCategories && (homeCategories.innerHTML = "");
  CATEGORIES.forEach(cat => {
    if (!homeCategories) return;
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

  if (!homeFeatured) return;

  const featured = PRODUCTS.filter(p => p.status !== "hidden").slice(0, 4);
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
      renderProducts();
      window.location.hash = "#catalogo";
    });
    homeFeatured.appendChild(el);
  });
}

// ==============================
// CATEGORIES SIDEBAR
// ==============================
function renderCategories() {
  if (!categoryList) return;
  categoryList.innerHTML = "";

  const visibleProducts = PRODUCTS.filter(p => p.status !== "hidden");

  const allBtn = makeCategoryButton("Tutti", visibleProducts.length);
  categoryList.appendChild(allBtn);

  for (const cat of CATEGORIES) {
    const count = visibleProducts.filter(p => p.category === cat).length;
    categoryList.appendChild(makeCategoryButton(cat, count));
  }

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
// PRODUCTS GRID (con taglie)
// ==============================
function renderProducts() {
  if (!productGrid) return;

  let list = PRODUCTS.filter(p => p.status !== "hidden");

  if (state.category !== "Tutti") list = list.filter(p => p.category === state.category);
  if (state.onlyAvailable) list = list.filter(p => p.status === "available");

  const q = (state.search || "").toLowerCase();
  if (q) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  list = sortList(list, state.sort);

  const title = state.category === "Tutti" ? "Tutti i prodotti" : state.category;
  if (catalogTitle) catalogTitle.textContent = title;
  if (resultCount) resultCount.textContent = String(list.length);
  if (catalogSubtitle) catalogSubtitle.innerHTML = `Risultati: <span id="resultCount">${list.length}</span>`;

  productGrid.innerHTML = "";
  if (list.length === 0) {
    productGrid.innerHTML = `<div class="page-card" style="grid-column:1/-1;">Nessun prodotto trovato.</div>`;
    return;
  }

  list.forEach(p => {
    const card = document.createElement("article");
    card.className = "product-card";

    const isAvailableProduct = p.status === "available";

    const sizeEntries = Object.entries(p.sizes || {});
    const availableSizes = sizeEntries.filter(([, ok]) => ok).map(([s]) => s);
    const hasAnySize = availableSizes.length > 0;

    // default selected size: prima disponibile
    const defaultSize = hasAnySize ? availableSizes[0] : "";

    const availabilityText =
      p.status === "soldout" ? "Esaurito" : "Disponibile";
    const availabilityClass =
      p.status === "available" ? "ok" : "no";

    const imgHtml = p.image
      ? `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" style="width:100%;height:150px;object-fit:cover;display:block;">`
      : `<div class="product-img">FOTO</div>`;

    // select taglie (disabled su non disponibili)
    const sizeSelectId = `size-${p.id}`;
    const sizeSelectHtml = `
      <label class="size-label" for="${sizeSelectId}">Taglia</label>
      <select class="size-select" id="${sizeSelectId}" data-size-select="${p.id}" ${isAvailableProduct && hasAnySize ? "" : "disabled"}>
        ${
          sizeEntries
            .sort((a, b) => a[0].localeCompare(b[0], "it", { numeric: true }))
            .map(([size, ok]) => {
              const sel = (size === defaultSize) ? "selected" : "";
              const dis = ok ? "" : "disabled";
              const suffix = ok ? "" : " (non disp.)";
              return `<option value="${escapeAttr(size)}" ${sel} ${dis}>${escapeHtml(size)}${suffix}</option>`;
            })
            .join("")
        }
      </select>
    `;

    // bottone acquistabile solo se:
    // - prodotto available
    // - almeno una taglia disponibile
    const canBuy = isAvailableProduct && hasAnySize;

    card.innerHTML = `
      ${imgHtml}
      <div class="product-body">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-meta">
          <span>${escapeHtml(p.category)}</span>
          <span class="product-price">€${Number(p.price).toFixed(2)}</span>
        </div>

        <div class="availability ${availabilityClass}">
          ${escapeHtml(availabilityText)}
        </div>

        <div class="product-sizes">
          ${sizeSelectHtml}
        </div>

        <div class="product-actions">
          <button class="btn btn-primary full" type="button" ${canBuy ? "" : "disabled"} data-add="${p.id}">
            ${canBuy ? "Aggiungi al carrello" : "Non disponibile"}
          </button>
        </div>
      </div>
    `;

    productGrid.appendChild(card);
  });

  // bind add-to-cart (prende taglia selezionata)
  Array.from(productGrid.querySelectorAll("[data-add]")).forEach(btn => {
    btn.addEventListener("click", () => {
      const productId = btn.getAttribute("data-add");
      const sel = productGrid.querySelector(`[data-size-select="${CSS.escape(productId)}"]`);
      const size = sel ? sel.value : "UNICA";
      addToCart(productId, size);
      openCart();
    });
  });
}

function sortList(list, sort) {
  if (sort === "priceAsc") return list.sort((a,b) => a.price - b.price);
  if (sort === "priceDesc") return list.sort((a,b) => b.price - a.price);
  if (sort === "nameAsc") return list.sort((a,b) => a.name.localeCompare(b.name, "it"));
  return list;
}

// ==============================
// CART (con taglia)
// ==============================
function cartKey(productId, size) {
  return `${productId}|${size}`;
}

function parseCartKey(key) {
  const [id, ...rest] = String(key).split("|");
  return { id, size: rest.join("|") || "UNICA" };
}

function addToCart(productId, size) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p || p.status !== "available") return;

  const sizes = p.sizes || defaultSizesForCategory(p.category);
  if (!sizes[size]) return; // taglia non disponibile

  const key = cartKey(productId, size);
  state.cart[key] = (state.cart[key] || 0) + 1;
  persistCart();
  renderCart();
}

function removeFromCart(key) {
  delete state.cart[key];
  persistCart();
  renderCart();
}

function changeQty(key, delta) {
  const current = state.cart[key] || 0;
  const next = current + delta;
  if (next <= 0) {
    removeFromCart(key);
    return;
  }
  state.cart[key] = next;
  persistCart();
  renderCart();
}

function cartItems() {
  return Object.entries(state.cart).map(([key, qty]) => {
    const { id, size } = parseCartKey(key);
    const p = PRODUCTS.find(x => x.id === id);
    return { key, product: p, size, qty };
  }).filter(x => !!x.product);
}

function cartCount() {
  return cartItems().reduce((sum, x) => sum + x.qty, 0);
}

function cartTotal() {
  return cartItems().reduce((sum, x) => sum + (x.product.price * x.qty), 0);
}

function renderCart() {
  if (!cartItemsEl) return;

  const items = cartItems();
  cartItemsEl.innerHTML = "";

  if (items.length === 0) {
    cartItemsEl.innerHTML = `<div class="page-card">Il carrello è vuoto.</div>`;
  } else {
    items.forEach(({ key, product, size, qty }) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-item-top">
          <div>
            <div class="cart-item-name">${escapeHtml(product.name)} <span style="opacity:.8;">(Taglia: ${escapeHtml(size)})</span></div>
            <div class="cart-item-meta">${escapeHtml(product.category)} • €${product.price.toFixed(2)}</div>
          </div>
          <button class="btn btn-ghost" type="button" data-remove="${escapeAttr(key)}" title="Rimuovi">Rimuovi</button>
        </div>

        <div class="cart-item-actions">
          <div class="qty">
            <button type="button" data-dec="${escapeAttr(key)}">-</button>
            <span>${qty}</span>
            <button type="button" data-inc="${escapeAttr(key)}">+</button>
          </div>
          <strong>€${(product.price * qty).toFixed(2)}</strong>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });

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

  if (cartCountEl) cartCountEl.textContent = String(cartCount());
  if (cartTotalEl) cartTotalEl.textContent = `€${cartTotal().toFixed(2)}`;
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

  const lines = items.map(x => `- ${x.product.name} (Taglia: ${x.size}) (x${x.qty})`);
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
  overlay?.classList.remove("hidden");
  cartDrawer?.classList.remove("hidden");
  cartDrawer?.setAttribute("aria-hidden", "false");
}

function closeCart() {
  overlay?.classList.add("hidden");
  cartDrawer?.classList.add("hidden");
  cartDrawer?.setAttribute("aria-hidden", "true");
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





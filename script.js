/* ─────────────────────────────────────────────────────────
   Sora Icônes — script.js
   Expects: icons.json  (Option B structure)
   {
     "bold":    ["icon-name", ...],
     "bold-duotone": [...],
     "broken":  [...],
     "duotone": [...],
     "linear":  [...],
     "outline": [...]
   }
   SVGs live at:  icons/{style}/{name}.svg
───────────────────────────────────────────────────────── */

const PAGE_SIZE = 60;

/* ── State ─────────────────────────────────────────────── */
let allIcons = {}; // full data from icons.json
let style = "bold"; // active style tab
let query = "";
let filtered = []; // icons matching current search
let page = 1;

/* ── DOM refs ───────────────────────────────────────────── */
const grid = document.getElementById("grid");
const loadBtn = document.getElementById("load-more");
const searchEl = document.getElementById("search");
const clearBtn = document.getElementById("search-clear");
const countEl = document.getElementById("showing-count");
const totalEl = document.getElementById("icon-count");
const emptyEl = document.getElementById("empty");
const toastEl = document.getElementById("toast");
const tooltipEl = document.getElementById("tooltip");
const tabs = document.querySelectorAll(".tab");

/* ── Boot ───────────────────────────────────────────────── */
fetch("icons.json")
  .then((r) => r.json())
  .then((data) => {
    allIcons = data;
    applyFilter();
  })
  .catch(() => {
    // Dev fallback: generate dummy data so layout is testable
    const names = [
      "4k",
      "accessibility",
      "accumulator",
      "add-circle",
      "add-folder",
      "add-square",
      "adhesive-plaster",
      "airbuds",
      "airbuds-case",
      "alarm",
      "bag-heart",
      "bag-music",
      "bag-smile",
      "balloon",
      "balls",
      "banknote",
      "bar-chair",
      "basketball",
      "bath",
      "battery-charge",
      "battery-full",
      "battery-half",
      "battery-low",
      "bed",
      "bedside-table",
      "bell",
      "bill",
      "bill-check",
      "bill-cross",
      "bill-list",
      "black-hole",
      "bluetooth",
      "body",
      "body-shape",
      "bolt-circle",
      "bolt-new",
      "bomb",
      "bone",
      "bookmark",
      "camera",
      "calendar",
      "cloud",
      "credit-card",
      "file",
      "folder",
      "heart",
      "home",
      "image",
      "map-pin",
      "menu",
      "moon",
      "phone",
      "search",
      "settings",
      "star",
      "sun",
      "tag",
      "user",
      "wifi",
      "x",
    ];
    allIcons = {
      bold: [...names],
      "bold-duotone": [...names],
      broken: [...names],
      duotone: [...names],
      linear: [...names],
      outline: [...names],
    };
    applyFilter();
    console.warn("icons.json not found — using demo data");
  });

/* ── Filter + Render ────────────────────────────────────── */
function applyFilter() {
  const list = allIcons[style] || [];
  filtered = query ? list.filter((n) => n.includes(query)) : [...list];
  page = 1;
  renderGrid(true);
  updateCounts();
}

function renderGrid(reset = false) {
  if (reset) grid.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.style.display = "flex";
    loadBtn.style.display = "none";
    return;
  }
  emptyEl.style.display = "none";

  const start = reset ? 0 : (page - 1) * PAGE_SIZE;
  const end = page * PAGE_SIZE;
  const slice = reset ? filtered.slice(0, end) : filtered.slice(start, end);

  slice.forEach((name, i) => {
    const card = makeCard(name, i);
    grid.appendChild(card);
  });

  loadBtn.style.display = end < filtered.length ? "block" : "none";
  updateCounts();
}

function makeCard(name, animIndex) {
  const card = document.createElement("div");
  card.className = "icon-card";
  card.style.animationDelay = `${Math.min(animIndex, 30) * 12}ms`;

  const imgSrc = `icons/${style}/${name}.svg`;

  card.innerHTML = `
    <div class="icon-front">
      <img class="icon-img" src="${imgSrc}" alt="${name}" loading="lazy"
           onerror="this.style.opacity='0.2'" />
      <span class="icon-name">${name}</span>
    </div>
    <div class="icon-back">
      <button class="act-btn primary" data-action="copy-tag" data-name="${name}">Copy tag</button>
      <button class="act-btn" data-action="copy-svg" data-src="${imgSrc}">Copy SVG</button>
      <button class="act-btn" data-action="download" data-src="${imgSrc}" data-name="${name}">Download</button>
    </div>`;

  /* Tooltip on hover */
  card.addEventListener("mouseenter", (e) => showTooltip(name, e));
  card.addEventListener("mouseleave", hideTooltip);
  card.addEventListener("mousemove", (e) => moveTooltip(e));

  /* Action buttons */
  card.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.stopPropagation();
    handleAction(btn);
  });

  return card;
}

/* ── Actions ────────────────────────────────────────────── */
function handleAction(btn) {
  const action = btn.dataset.action;

  if (action === "copy-tag") {
    const tag = `<i class="sora sora-${btn.dataset.name} sora-${style}"></i>`;
    copyToClipboard(tag, "Tag copied!");
  }

  if (action === "copy-svg") {
    fetchSvgText(btn.dataset.src).then((text) => {
      copyToClipboard(text, "SVG copied!");
    });
  }

  if (action === "download") {
    fetchSvgText(btn.dataset.src).then((text) => {
      downloadFile(`${btn.dataset.name}.svg`, text, "image/svg+xml");
      showToast("Downloaded!");
    });
  }
}

function fetchSvgText(src) {
  return fetch(src)
    .then((r) => r.text())
    .catch(() => "<!-- SVG not found -->");
}

function copyToClipboard(text, msg) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(msg))
    .catch(() => {
      /* Fallback */
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast(msg);
    });
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Toast ──────────────────────────────────────────────── */
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2000);
}

/* ── Tooltip ────────────────────────────────────────────── */
function showTooltip(name, e) {
  tooltipEl.textContent = name;
  tooltipEl.classList.add("show");
  moveTooltip(e);
}
function hideTooltip() {
  tooltipEl.classList.remove("show");
}
function moveTooltip(e) {
  tooltipEl.style.left = `${e.clientX + 12}px`;
  tooltipEl.style.top = `${e.clientY - 28}px`;
}

/* ── Counts ─────────────────────────────────────────────── */
function updateCounts() {
  const shown = Math.min(page * PAGE_SIZE, filtered.length);
  const total = (allIcons[style] || []).length;
  countEl.textContent = `${shown} / ${filtered.length} icons`;
  totalEl.textContent = `${total} icons`;
}

/* ── Events ─────────────────────────────────────────────── */

/* Tabs */
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    style = tab.dataset.style;
    applyFilter();
  });
});

/* Search */
searchEl.addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  clearBtn.style.display = query ? "block" : "none";
  applyFilter();
});

clearBtn.addEventListener("click", () => {
  searchEl.value = "";
  query = "";
  clearBtn.style.display = "none";
  searchEl.focus();
  applyFilter();
});

/* Keyboard shortcut: / to focus search */
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchEl) {
    e.preventDefault();
    searchEl.focus();
  }
  if (e.key === "Escape") {
    searchEl.blur();
    if (query) {
      searchEl.value = "";
      query = "";
      clearBtn.style.display = "none";
      applyFilter();
    }
  }
});

/* Load more */
loadBtn.addEventListener("click", () => {
  page++;
  renderGrid(false);
});

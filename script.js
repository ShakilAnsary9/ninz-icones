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
function generateIconCSS(icons) {
  let css = "/* Auto-generated icon CSS */\n";

  const styles = {
    "bold": "bold",
    "bold-duotone": "bold-duotone",
    "broken": "broken",
    "duotone": "duotone",
    "linear": "linear",
    "outline": "outline"
  };

  for (const [styleKey, folder] of Object.entries(styles)) {
    const names = icons[styleKey] || [];
    names.forEach(name => {
      // Create clean class name: "4k-bold" -> "4k"
      const cleanName = name.replace(/-(bold|duotone|broken|linear|outline)(-duotone)?$/, "");
      const svgFile = `${name}.svg`;
      css += `.si-${styleKey}.si-${cleanName} {\n`;
      css += `  -webkit-mask-image: url("../../icons/${folder}/${svgFile}");\n`;
      css += `  mask-image: url("../../icons/${folder}/${svgFile}");\n`;
      css += `}\n`;
      css += `.si-${cleanName} { --si-name: ${cleanName}; }\n`;
    });
  }

  return css;
}

function injectIconCSS(icons) {
  const existing = document.getElementById("si-dynamic-css");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "si-dynamic-css";
  style.textContent = generateIconCSS(icons);
  document.head.appendChild(style);
}

fetch("icons.json")
  .then((r) => r.json())
  .then((data) => {
    allIcons = data;
    injectIconCSS(data);
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
    </div>`;

  /* Tooltip on hover */
  card.addEventListener("mouseenter", (e) => showTooltip(name, e));
  card.addEventListener("mouseleave", hideTooltip);
  card.addEventListener("mousemove", (e) => moveTooltip(e));

  /* Click to open modal */
  card.addEventListener("click", () => {
    openModal(name, imgSrc);
  });

  return card;
}

/* ── Modal ──────────────────────────────────────────────── */
const modalEl = document.getElementById("icon-modal");
const colorModalEl = document.getElementById("color-modal");
let currentIcon = null;
let pngColor = "#000000";
let pngSize = 512;

function openColorPickerModal() {
  if (!currentIcon) return;

  // Set default color based on theme (white for dark mode, black for light mode)
  const isDarkMode = !document.body.classList.contains("light");
  const defaultColor = isDarkMode ? "#ffffff" : "#000000";

  // Reset to default
  pngColor = defaultColor;
  pngSize = 512;
  document.getElementById("png-color-input").value = defaultColor;
  document.getElementById("png-color-hex").textContent = defaultColor;

  // Update size buttons
  document.querySelectorAll(".size-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.size === "512");
  });

  // Clear preset buttons active state
  document
    .querySelectorAll(".preset-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // Update preview
  updateColorPickerPreview(currentIcon.imgSrc, pngColor);

  // Close icon modal and open color picker modal
  modalEl.classList.remove("show");
  colorModalEl.classList.add("show");
}

function updateColorPickerPreview(imgSrc, color) {
  fetchSvgText(imgSrc).then((text) => {
    const coloredSvg = applySvgColor(text, color);
    const blob = new Blob([coloredSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const previewImg = document.getElementById("color-picker-preview");
    previewImg.src = url;
    previewImg.onload = () => URL.revokeObjectURL(url);
  });
}

function closeColorModal() {
  colorModalEl.classList.remove("show");
  document.body.style.overflow = "";
}

function openModal(name, imgSrc) {
  currentIcon = { name, style, imgSrc };
  const modalContent = modalEl.querySelector(".modal-content");

  // Update modal header with icon preview
  modalContent.querySelector(".modal-icon-preview").innerHTML = `
    <div class="modal-preview-img"><img src="${imgSrc}" alt="${name}" /></div>
    <span class="modal-icon-name">${name}</span>
  `;

  // Update data attributes for actions
  modalContent.dataset.name = name;
  modalContent.dataset.src = imgSrc;

  modalEl.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modalEl.classList.remove("show");
  document.body.style.overflow = "";
  currentIcon = null;
}

// Modal close on backdrop click
modalEl.addEventListener("click", (e) => {
  if (e.target === modalEl || e.target.closest(".modal-backdrop")) closeModal();
});

// Close button
document.getElementById("modal-close").addEventListener("click", closeModal);

// Close on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (colorModalEl.classList.contains("show")) {
      closeColorModal();
    } else if (modalEl.classList.contains("show")) {
      closeModal();
    }
  }
});

function toPascalCase(str) {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function downloadPng(name, svgText) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    canvas.width = 512;
    canvas.height = 512;
    ctx.drawImage(img, 0, 0, 512, 512);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("PNG downloaded!");
    }, "image/png");
  };

  img.onerror = function () {
    URL.revokeObjectURL(url);
    showToast("Failed to convert PNG");
  };

  img.src = url;
}

function fetchSvgText(src) {
  return fetch(src)
    .then((r) => r.text())
    .catch(() => "<!-- SVG not found -->");
}

function copyToClipboard(text, msg) {
  // Clean up any injected scripts, HTML comments, and extra whitespace/newlines
  let cleanedText = text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
    .replace(/\s+\n/g, "\n") // Remove whitespace before newlines
    .replace(/\n\s+/g, "\n") // Remove newlines with trailing whitespace
    .trim();

  // Always show toast first to ensure visibility
  showToast(msg);

  navigator.clipboard.writeText(cleanedText).catch(() => {
    /* Fallback */
    try {
      const ta = document.createElement("textarea");
      ta.value = cleanedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    } catch (e) {
      console.error("Copy failed:", e);
    }
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

/* ── Theme Toggle ─────────────────────────────────────── */
const themeToggle = document.getElementById("theme-toggle");

function setTheme(dark) {
  document.body.classList.toggle("light", !dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("light");
  setTheme(!isDark);
});

/* Init theme from localStorage */
const saved = localStorage.getItem("theme");
if (saved === "light") setTheme(false);
else if (saved === "dark") setTheme(true);

/* ── CDN Copy ─────────────────────────────────────────────── */
document.getElementById("cdn-copy-btn").addEventListener("click", () => {
  const cdnLink = document.getElementById("cdn-link").value;
  copyToClipboard(cdnLink, "CDN link copied!");
});

/* ── Modal Button Clicks ─────────────────────────────────── */
function handleModalAction(action, btn) {
  const modalContent = modalEl.querySelector(".modal-content");
  const name = modalContent.dataset.name;
  const src = modalContent.dataset.src;

  if (action === "copy-svg") {
    fetchSvgText(src).then((text) => {
      copyToClipboard(text, "SVG code copied!");
    });
  }

  if (action === "copy-cdn") {
    // Strip style suffix from name (e.g., "4k-bold" -> "4k")
    const baseName = name.replace(new RegExp(`-${style}$`), "");
    const tagCode = `<i class="si si-${style} si-${baseName}"></i>`;
    copyToClipboard(tagCode, "Tag copied!");
  }

  if (action === "copy-webcomponent") {
    fetchSvgText(src).then((text) => {
      const wcCode = `<script src="https://cdn.jsdelivr.net/npm/@ninzoc/sora-icons-shim@latest"><\/script>

<!-- SVG Code -->
${text}`;
      copyToClipboard(wcCode, "Web component code copied!");
    });
  }

  if (action === "copy-jsx") {
    fetchSvgText(src).then((text) => {
      const jsxCode = `// SVG Code
const iconSvg = \`${text.replace(/`/g, "\\`")}\`;

// Or use as component
import { Sora${toPascalCase(style)}Icon } from '@ninzoc/icons';

function MyComponent() {
  return <Sora${toPascalCase(style)}Icon name="${name}" />;
}`;
      copyToClipboard(jsxCode, "JSX code copied!");
    });
  }
}

/* ── Color Utility ─────────────────────────────────────── */
function applySvgColor(svgText, color) {
  return svgText
    .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    .replace(/fill="[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/fill="currentColor"/g, `fill="${color}"`);
}

/* ── Color Modal Events ─────────────────────────────────── */
colorModalEl.addEventListener("click", (e) => {
  if (e.target === colorModalEl || e.target.closest(".color-modal-backdrop")) {
    closeColorModal();
  }
});

document
  .getElementById("color-modal-close")
  .addEventListener("click", closeColorModal);

// Color input change - update preview
document.getElementById("png-color-input").addEventListener("input", (e) => {
  pngColor = e.target.value;
  document.getElementById("png-color-hex").textContent = pngColor.toUpperCase();
  document.getElementById("png-color-input").value = pngColor;
  // Remove active from preset buttons
  document
    .querySelectorAll(".preset-btn")
    .forEach((b) => b.classList.remove("active"));
  if (currentIcon) {
    updateColorPickerPreview(currentIcon.imgSrc, pngColor);
  }
});

// Preset color buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const color = btn.dataset.color;
    pngColor = color;
    document.getElementById("png-color-input").value = color;
    document.getElementById("png-color-hex").textContent = color.toUpperCase();
    document
      .querySelectorAll(".preset-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (currentIcon) {
      updateColorPickerPreview(currentIcon.imgSrc, color);
    }
  });
});

// Size buttons
document.querySelectorAll(".size-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".size-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    pngSize = parseInt(btn.dataset.size);
  });
});

// Download button
document
  .getElementById("download-colored-png")
  .addEventListener("click", () => {
    if (!currentIcon) return;

    fetchSvgText(currentIcon.imgSrc).then((text) => {
      const coloredSvg = applySvgColor(text, pngColor);
      downloadPngWithSize(currentIcon.name, coloredSvg, pngSize);
    });
  });

function downloadPngWithSize(name, svgText, size) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(img, 0, 0, size, size);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}-${size}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast(`PNG (${size}px) downloaded!`);
      closeColorModal();
    }, "image/png");
  };

  img.onerror = function () {
    URL.revokeObjectURL(url);
    showToast("Failed to convert PNG");
  };

  img.src = url;
}

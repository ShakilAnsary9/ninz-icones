/* ─────────────────────────────────────────────────────────
   Ninz Icônes — script.js
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
    bold: "bold",
    "bold-duotone": "bold-duotone",
    broken: "broken",
    duotone: "duotone",
    linear: "linear",
    outline: "outline",
  };

  for (const [styleKey, folder] of Object.entries(styles)) {
    const names = icons[styleKey] || [];
    names.forEach((name) => {
      // Create clean class name: "4k-bold" -> "4k"
      const cleanName = name.replace(
        /-(bold|duotone|broken|linear|outline)(-duotone)?$/,
        "",
      );
      const svgFile = `${name}.svg`;
      css += `.ni-${styleKey}.ni-${cleanName} {\n`;
      css += `  -webkit-mask-image: url("../../icons/${folder}/${svgFile}");\n`;
      css += `  mask-image: url("../../icons/${folder}/${svgFile}");\n`;
      css += `}\n`;
      css += `.ni-${cleanName} { --ni-name: ${cleanName}; }\n`;
    });
  }

  return css;
}

function injectIconCSS(icons) {
  const existing = document.getElementById("ni-dynamic-css");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "ni-dynamic-css";
  style.textContent = generateIconCSS(icons);
  document.head.appendChild(style);
}

fetch("icons.json")
  .then((r) => r.json())
  .then((data) => {
    allIcons = data;
    injectIconCSS(data);
    applyFilter();
    setTimeout(setupScrollLoader, 100);
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
    setTimeout(setupScrollLoader, 100);
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

  /* Click to open modal or select */
  card.addEventListener("click", () => {
    if (selectionMode) {
      toggleIconSelection(name, imgSrc);
    } else {
      openModal(name, imgSrc);
    }
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

function copyToClipboard(text, msg, preserveScripts = false) {
  // Clean up any injected scripts, HTML comments, and extra whitespace/newlines
  let cleanedText = text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\n\s*\n/g, "\n") // Remove multiple newlines
    .replace(/\s+\n/g, "\n") // Remove whitespace before newlines
    .replace(/\n\s+/g, "\n") // Remove newlines with trailing whitespace
    .trim();

  // Remove script tags unless preserveScripts is true
  if (!preserveScripts) {
    cleanedText = cleanedText.replace(/<script[\s\S]*?<\/script>/gi, "");
  }

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

  // Calculate total icons across all styles
  const allTotal = Object.values(allIcons).reduce(
    (sum, arr) => sum + (arr?.length || 0),
    0,
  );
  totalEl.textContent = `${allTotal} icons`;
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

/* Load more on scroll using IntersectionObserver */
function setupScrollLoader() {
  // Create a sentinel element at bottom of grid
  const sentinel = document.createElement("div");
  sentinel.id = "scroll-sentinel";
  sentinel.style.height = "1px";
  document.querySelector(".grid-wrap").appendChild(sentinel);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && page * PAGE_SIZE < filtered.length) {
          page++;
          renderGrid(false);
        }
      });
    },
    { rootMargin: "200px" },
  );

  observer.observe(sentinel);
}

// Call after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(setupScrollLoader, 100);
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

document.getElementById("wc-copy-btn").addEventListener("click", () => {
  const wcLink = document.getElementById("wc-link").value;
  copyToClipboard(wcLink, "Web Component script copied!");
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

  if (action === "download-svg") {
    fetchSvgText(src).then((text) => {
      downloadFile(`${name}.svg`, text, "image/svg+xml");
      showToast("SVG downloaded!");
    });
  }

  if (action === "copy-cdn") {
    const tagCode = `<i class="ni ni-${name}"></i>`;
    copyToClipboard(tagCode, "Tag copied!");
  }

  if (action === "copy-webcomponent") {
    openWcModal();
  }

  if (action === "copy-jsx") {
    fetchSvgText(src).then((text) => {
      const jsxCode = `// SVG Code
const iconSvg = \`${text.replace(/`/g, "\\`")}\`;

// Or use as component
import { Ni${toPascalCase(name)} } from '@ninzapp/ninz-icons';

function MyComponent() {
  return <Ni${toPascalCase(name)} />;
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

/* ── Web Component Modal ──────────────────────────────── */
const wcModalEl = document.getElementById("wc-modal");
let wcSvgText = "";

function openWcModal() {
  if (!currentIcon) return;
  wcModalEl.classList.add("show");
  document.body.style.overflow = "hidden";

  fetchSvgText(currentIcon.imgSrc).then((text) => {
    wcSvgText = text;
  });
}

function closeWcModal() {
  wcModalEl.classList.remove("show");
  document.body.style.overflow = "";
  wcSvgText = "";
}

wcModalEl.addEventListener("click", (e) => {
  if (e.target === wcModalEl || e.target.closest(".wc-modal-backdrop")) {
    closeWcModal();
  }
});

document
  .getElementById("wc-modal-close")
  .addEventListener("click", closeWcModal);

document.querySelectorAll(".wc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const framework = btn.dataset.framework;
    handleWcFramework(framework);
  });
});

function handleWcFramework(framework) {
  const name = currentIcon ? currentIcon.name : "Icon";
  const componentName = toPascalCase(name);

  switch (framework) {
    case "vue": {
      const vueCode = `<script setup>
defineOptions({ name: 'Ni${componentName}' })

defineProps({
  size: { type: [String, Number], default: '1em' },
  class: { type: String, default: '' }
})
<\/script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    :class="class"
    viewBox="0 0 24 24"
    fill="none"
  >
${extractSvgPath(wcSvgText)}
  </svg>
</template>`;
      copyToClipboard(vueCode, "Vue component copied!", true);
      break;
    }
    case "vue-ts": {
      // Extract and clean SVG content (remove any script tags inside SVG)
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const vueTsCode = `<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">${svgContent}</svg>
</template>

<script lang="ts">
export default {
  name: 'Ni${componentName}'
}
</script>`;
      copyToClipboard(vueTsCode, "Vue + TS component copied!", true);
      break;
    }
    case "react": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const reactCode = `import React from 'react'

export function Ni${componentName}(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>${svgContent}</svg>
  )
}
export default Ni${componentName}`;
      copyToClipboard(reactCode, "React component copied!");
      break;
    }
    case "react-ts": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const reactTsCode = `import React, { SVGProps } from 'react'

export function Ni${componentName}(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>${svgContent}</svg>
  )
}
export default Ni${componentName}`;
      copyToClipboard(reactTsCode, "React + TS component copied!");
      break;
    }
    case "svelte": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const svelteCode = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...$$props}>${svgContent}</svg>`;
      copyToClipboard(svelteCode, "Svelte code copied!");
      break;
    }
    case "qwik": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const qwikCode = `export function Ni${componentName}(props: QwikIntrinsicElements['svg'], key: string) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} key={key}>${svgContent}</svg>
  )
}`;
      copyToClipboard(qwikCode, "Qwik code copied!");
      break;
    }
    case "solid": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const solidCode = `export function Ni${componentName}(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>${svgContent}</svg>
  )
}`;
      copyToClipboard(solidCode, "Solid code copied!");
      break;
    }
    case "astro": {
      const svgContent = wcSvgText
        .replace(/<svg[^>]*>/i, "")
        .replace(/<\/svg>/i, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();
      const astroCode = `---
const props = Astro.props
---

<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>${svgContent}</svg>`;
      copyToClipboard(astroCode, "Astro code copied!");
      break;
    }
    case "react-native": {
      // Convert SVG to React Native Svg format
      let rnContent = wcSvgText
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();

      // Replace svg tag
      rnContent = rnContent.replace(/<svg[^>]*>/i, "").replace(/<\/svg>/i, "");

      // Replace <path> with <Path
      rnContent = rnContent.replace(/<path /gi, "<Path ");
      // Replace </path> with />
      rnContent = rnContent.replace(/<\/path>/gi, "/>");

      // Replace <g> with <G
      rnContent = rnContent.replace(/<g[^>]*>/gi, "<G>");
      // Replace </g> with </G>
      rnContent = rnContent.replace(/<\/g>/gi, "</G>");

      // Remove attributes not valid in RN (stroke, stroke-width, clip-rule, fill-rule, etc)
      rnContent = rnContent.replace(
        /\s*(stroke|stroke-width|stroke-linecap|stroke-linejoin|clip-rule|fill-rule)="[^"]*"/gi,
        "",
      );

      const rnCode = `import Svg, { Path, G } from 'react-native-svg';

export function Ni${componentName}(props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">${rnContent}</Svg>
  )
}`;
      copyToClipboard(rnCode, "React Native code copied!");
      break;
    }
    case "data-url": {
      // Clean SVG and create data URL
      let svgClean = wcSvgText
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .trim();

      // URL encode the SVG
      const encoded = encodeURIComponent(svgClean);
      const dataUrl = `data:image/svg+xml,${encoded}`;

      copyToClipboard(dataUrl, "Data URL copied!");
      break;
    }
  }
  closeWcModal();
}

function extractSvgPath(svgText) {
  if (!svgText) return "";

  // Extract the inner content (everything inside the svg tag)
  const match = svgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (match) {
    // Clean any script tags from the SVG content
    let content = match[1].trim();
    content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
    // Indent each line
    return content
      .split("\n")
      .map((line) => "    " + line)
      .join("\n");
  }
  return "";
}

/* ── Package Modal ──────────────────────────────── */
const pkgModalEl = document.getElementById("pkg-modal");
const pkgCodeEl = document.getElementById("pkg-code");
const pkgModalTitleEl = document.getElementById("pkg-modal-title");
const pkgCopyBtnEl = document.getElementById("pkg-copy-btn");

const pkgInstallCommands = {
  npm: "npm install @ninzapp/solar-icons",
  yarn: "yarn add @ninzapp/solar-icons",
  pnpm: "pnpm add @ninzapp/solar-icons",
};

function openPkgModal(pkgName) {
  pkgModalTitleEl.textContent = `Install via ${pkgName.toUpperCase()}`;
  pkgCodeEl.textContent = pkgInstallCommands[pkgName];
  pkgModalEl.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closePkgModal() {
  pkgModalEl.classList.remove("show");
  document.body.style.overflow = "";
}

pkgModalEl.addEventListener("click", (e) => {
  if (e.target === pkgModalEl || e.target.closest(".pkg-modal-backdrop")) {
    closePkgModal();
  }
});

document
  .getElementById("pkg-modal-close")
  .addEventListener("click", closePkgModal);

// Package buttons
document.querySelectorAll(".pkg-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    openPkgModal(btn.dataset.pkg);
  });
});

// Package copy button
pkgCopyBtnEl.addEventListener("click", () => {
  const code = pkgCodeEl.textContent;
  copyToClipboard(code, "Command copied!");
  closePkgModal();
});

// Close modal on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && pkgModalEl.classList.contains("show")) {
    closePkgModal();
  }
});

/* ── Bulk Download ─────────────────────────────────────── */
const selectToggle = document.getElementById("select-toggle");
const bulkBag = document.getElementById("bulk-bag");
const bulkCountEl = document.getElementById("bulk-count");
const bulkDrawer = document.getElementById("bulk-drawer");
const bulkDrawerGrid = document.getElementById("bulk-drawer-grid");
const bulkHeaderCount = document.getElementById("bulk-header-count");

let selectionMode = false;
let selectedIcons = [];

function toggleSelectionMode() {
  selectionMode = !selectionMode;
  selectToggle.classList.toggle("active", selectionMode);
  document.body.classList.toggle("selection-mode", selectionMode);

  if (!selectionMode) {
    selectedIcons = [];
    updateBulkUI();
  }
}

selectToggle.addEventListener("click", toggleSelectionMode);

function toggleIconSelection(name, imgSrc) {
  const index = selectedIcons.findIndex((i) => i.name === name);
  if (index > -1) {
    selectedIcons.splice(index, 1);
  } else {
    selectedIcons.push({ name, imgSrc, style });
  }
  updateBulkUI();
}

function updateBulkUI() {
  const count = selectedIcons.length;

  bulkCountEl.textContent = count;
  bulkBag.style.display = count > 0 ? "flex" : "none";

  document.querySelectorAll(".icon-card").forEach((card) => {
    const name = card.querySelector(".icon-name").textContent;
    const isSelected = selectedIcons.some((i) => i.name === name);
    card.classList.toggle("selected", isSelected);
  });

  renderBulkDrawer();
}

function renderBulkDrawer() {
  bulkHeaderCount.textContent = `(${selectedIcons.length})`;
  bulkDrawerGrid.innerHTML = "";

  selectedIcons.forEach((icon, index) => {
    const card = document.createElement("div");
    card.className = "bulk-icon-card";
    card.draggable = true;
    card.dataset.index = index;

    card.innerHTML = `
      <img src="${icon.imgSrc}" alt="${icon.name}" />
      <div class="remove-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>
    `;

    card.addEventListener("click", (e) => {
      if (e.target.closest(".remove-icon")) {
        selectedIcons.splice(index, 1);
        updateBulkUI();
      }
    });

    card.addEventListener("dragstart", handleDragStart);
    card.addEventListener("dragend", handleDragEnd);
    card.addEventListener("dragover", handleDragOver);
    card.addEventListener("dragleave", handleDragLeave);
    card.addEventListener("drop", handleDrop);

    bulkDrawerGrid.appendChild(card);
  });
}

let draggedIndex = null;

function handleDragStart(e) {
  draggedIndex = parseInt(e.target.dataset.index);
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedIndex);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const card = e.target.closest(".bulk-icon-card");
  if (card) {
    document.querySelectorAll(".bulk-icon-card").forEach((c) => c.classList.remove("drag-over"));
    card.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  const card = e.target.closest(".bulk-icon-card");
  if (card && !card.contains(e.relatedTarget)) {
    card.classList.remove("drag-over");
  }
}

function handleDrop(e) {
  e.preventDefault();
  const card = e.target.closest(".bulk-icon-card");
  if (!card) return;
  
  const dropIndex = parseInt(card.dataset.index);
  const currentDraggedIndex = parseInt(e.dataTransfer.getData("text/plain"));
  
  if (currentDraggedIndex !== null && !isNaN(dropIndex) && currentDraggedIndex !== dropIndex) {
    const item = selectedIcons.splice(currentDraggedIndex, 1)[0];
    selectedIcons.splice(dropIndex, 0, item);
    renderBulkDrawer();
  }
  document.querySelectorAll(".bulk-icon-card").forEach((c) => c.classList.remove("drag-over"));
}

bulkBag.addEventListener("click", () => {
  bulkDrawer.classList.add("show");
  document.body.style.overflow = "hidden";
});

function closeBulkDrawer() {
  bulkDrawer.classList.remove("show");
  document.body.style.overflow = "";
}

document.getElementById("bulk-drawer-close").addEventListener("click", closeBulkDrawer);
document.getElementById("bulk-drawer-backdrop").addEventListener("click", closeBulkDrawer);

document.getElementById("bulk-clear-btn").addEventListener("click", () => {
  selectedIcons = [];
  updateBulkUI();
});

document.getElementById("bulk-download-btn").addEventListener("click", async () => {
  if (selectedIcons.length === 0) return;

  showToast("Preparing ZIP...");

  const zip = new JSZip();

  const fetchPromises = selectedIcons.map(async (icon) => {
    try {
      const response = await fetch(icon.imgSrc);
      const svgText = await response.text();
      zip.file(`${icon.name}.svg`, svgText);
    } catch (e) {
      console.error(`Failed to fetch ${icon.name}`);
    }
  });

  await Promise.all(fetchPromises);

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ninz-icons.zip";
  a.click();
  URL.revokeObjectURL(url);

  showToast("ZIP downloaded!");
  closeBulkDrawer();
});

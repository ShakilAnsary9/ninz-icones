/*!
 * Sora Icônes — CSS Shim
 * Reads --si-name and --si-style from each <i class="si ...">
 * and sets the correct mask-image URL automatically.
 *
 * Include AFTER sora-icons.css (optional — only needed for
 * the CSS-class method when you don't want to write per-icon
 * per-style rules manually).
 *
 * CDN: https://cdn.jsdelivr.net/gh/YOUR_USERNAME/sora-icones@latest/cdn/sora-icons-shim.js
 */

(function () {
  'use strict';

  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/your-username/sora-icones@latest/icons';
  const DEFAULT_STYLE = 'outline';

  function applyMasks(root) {
    const els = root.querySelectorAll('[class*="si-"]');
    els.forEach(el => {
      const cs   = getComputedStyle(el);
      const name = cs.getPropertyValue('--si-name').trim();
      const styl = cs.getPropertyValue('--si-style').trim() || DEFAULT_STYLE;
      if (!name) return;
      const url = `${CDN_BASE}/${styl}/${name}.svg`;
      el.style.webkitMaskImage = `url("${url}")`;
      el.style.maskImage       = `url("${url}")`;
    });
  }

  /* Run on DOM ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyMasks(document));
  } else {
    applyMasks(document);
  }

  /* Watch for dynamically added icons */
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.classList && node.classList.contains('si')) applyMasks(node.parentElement);
        else if (node.querySelectorAll) applyMasks(node);
      });
    });
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
  });

  /* Expose for manual re-runs */
  window.SoraIcons = { apply: applyMasks };
})();

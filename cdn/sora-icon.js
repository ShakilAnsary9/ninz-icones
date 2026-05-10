/*!
 * Sora Icônes — Web Component
 * Usage:  <sora-icon name="alarm" icon-type="outline" size="32" color="#fff"></sora-icon>
 * CDN:    https://cdn.jsdelivr.net/gh/ShakilAnsary9/ninz-icones@latest/cdn/sora-icon.js
 */

(function () {
  "use strict";

  const ICONS_BASE =
    "https://cdn.jsdelivr.net/gh/ShakilAnsary9/ninz-icones@latest/icons";
  const VALID_TYPES = [
    "bold",
    "bold-duotone",
    "broken",
    "duotone",
    "linear",
    "outline",
  ];
  const cache = new Map(); // SVG text cache

  /* ── Fetch with cache ──────────────────────────────────── */
  function fetchSVG(iconType, name) {
    // Build icon filename: "alarm" + "-" + "outline" = "alarm-outline"
    const iconFile = name + "-" + iconType;
    const key = iconFile;
    if (cache.has(key)) return Promise.resolve(cache.get(key));
    const url = `${ICONS_BASE}/${iconType}/${iconFile}.svg`;
    return fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Sora Icônes: icon not found — ${iconFile}`);
        return r.text();
      })
      .then((svg) => {
        cache.set(key, svg);
        return svg;
      });
  }

  /* ── Web Component ─────────────────────────────────────── */
  class SoraIcon extends HTMLElement {
    static get observedAttributes() {
      return ["name", "icon-type", "size", "color", "stroke-width"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this._render();
    }
    attributeChangedCallback() {
      this._render();
    }

    get _iconName() {
      return this.getAttribute("name") || "";
    }
    get _iconType() {
      const t = this.getAttribute("icon-type") || "outline";
      return VALID_TYPES.includes(t) ? t : "outline";
    }
    get _size() {
      return this.getAttribute("size") || "1em";
    }
    get _color() {
      return this.getAttribute("color") || "currentColor";
    }
    get _strokeW() {
      return this.getAttribute("stroke-width") || null;
    }

    _render() {
      const name = this._iconName;
      const iconType = this._iconType;
      const size = this._size;
      const color = this._color;

      if (!name) {
        this.shadowRoot.innerHTML = this._shell("", size);
        return;
      }

      /* Loading state */
      this.shadowRoot.innerHTML = this._shell(
        `<span style="display:inline-block;width:${size};height:${size};opacity:.2;
          background:currentColor;border-radius:3px;"></span>`,
        size,
      );

      fetchSVG(iconType, name)
        .then((svg) => {
          /* Patch SVG attributes for color + size control */
          let patched = svg.replace(/<svg([^>]*)>/, (_, attrs) => {
            /* Remove hardcoded width/height, add our own */
            attrs = attrs
              .replace(/\bwidth="[^"]*"/, "")
              .replace(/\bheight="[^"]*"/, "");
            return `<svg${attrs} width="${size}" height="${size}" aria-hidden="true">`;
          });

          /* If color override provided, swap fill/stroke */
          if (color !== "currentColor") {
            patched = patched
              .replace(/\bstroke="(?!none)[^"]*"/g, `stroke="${color}"`)
              .replace(/\bfill="(?!none)[^"]*"/g, `fill="${color}"`);
          }

          /* stroke-width override */
          if (this._strokeW) {
            patched = patched.replace(
              /\bstroke-width="[^"]*"/g,
              `stroke-width="${this._strokeW}"`,
            );
          }

          this.shadowRoot.innerHTML = this._shell(patched, size, color);
        })
        .catch(() => {
          this.shadowRoot.innerHTML = this._shell(
            `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
              stroke="${color}" stroke-width="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v4m0 4h.01"/>
            </svg>`,
            size,
          );
        });
    }

    _shell(content, size, color = "currentColor") {
      return `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${size};
            height: ${size};
            color: ${color};
            vertical-align: middle;
            line-height: 1;
            flex-shrink: 0;
          }
          svg {
            display: block;
            overflow: visible;
          }
        </style>
        ${content}`;
    }
  }

  /* Register only once */
  if (!customElements.get("sora-icon")) {
    customElements.define("sora-icon", SoraIcon);
  }
})();

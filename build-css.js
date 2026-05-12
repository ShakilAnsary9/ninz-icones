const fs = require("fs");
const path = require("path");

const icons = JSON.parse(fs.readFileSync("icons.json", "utf-8"));

const folderMap = {
  "bold": "bold",
  "bold-duotone": "bold-duotone",
  "broken": "broken",
  "duotone": "duotone",
  "linear": "linear",
  "outline": "outline"
};

const CDN_BASE = "https://cdn.jsdelivr.net/gh/ShakilAnsary9/ninz-icones@latest/icons";

let css = `/*!
 * Ninz Icônes — Auto-generated CSS
 * Generated from icons.json
 */

[class^="ni-"],
[class*=" ni-"] {
  display: inline-block;
  width: 3em;
  height: 3em;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
  vertical-align: -0.125em;
  line-height: 1;
}

/* ── Size helpers ────────────────────────────────────────── */
.ni-xs { font-size: 0.75rem; }
.ni-sm { font-size: 0.875rem; }
.ni-md { font-size: 1rem; }
.ni-lg { font-size: 1.5rem; }
.ni-xl { font-size: 2rem; }
.ni-2xl { font-size: 3rem; }

/* ── Icons ───────────────────────────────────────────────── */
`;

for (const [styleKey, folder] of Object.entries(folderMap)) {
  const names = icons[styleKey] || [];
  names.forEach(name => {
    css += `.ni-${name} {\n`;
    css += `  -webkit-mask-image: url("../../icons/${folder}/${name}.svg");\n`;
    css += `  mask-image: url("../../icons/${folder}/${name}.svg");\n`;
    css += `}\n`;
  });
}

// Write to CDN CSS file
const outPath = path.join(__dirname, "cdn", "CSS", "ninz-icons.css");
fs.writeFileSync(outPath, css);

const totalIcons = Object.values(icons).reduce((sum, arr) => sum + arr.length, 0);
console.log(`Generated ${outPath} with ${totalIcons} icon rules`);
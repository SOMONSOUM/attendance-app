const fs = require("node:fs");
const path = require("node:path");

const files = [
  path.join(__dirname, "..", "node_modules", "next-themes", "dist", "index.js"),
  path.join(__dirname, "..", "node_modules", "next-themes", "dist", "index.mjs"),
];

const replacements = [
  [
    "t.createElement(Y,{forcedTheme:e,storageKey:o,attribute:h,enableSystem:n,enableColorScheme:l,defaultTheme:u,value:m,themes:d,nonce:p,scriptProps:C}),w",
    "w",
  ],
  [
    "t.createElement(_,{forcedTheme:e,storageKey:m,attribute:h,enableSystem:s,enableColorScheme:u,defaultTheme:l,value:d,themes:a,nonce:p,scriptProps:R}),w",
    "w",
  ],
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let source = fs.readFileSync(file, "utf8");
  for (const [from, to] of replacements) {
    source = source.replace(from, to);
  }
  fs.writeFileSync(file, source);
}

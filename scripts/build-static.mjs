// Dependency-light production build (esbuild only). `npm run build` (Vite) is the main path;
// this produces the same static site in dist/ and is what generated the committed dist/.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });
await build({
  entryPoints: { app: "src/main.tsx" },
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  outdir: "dist",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".json": "json" },
  logLevel: "warning",
});
const html = readFileSync("index.html", "utf8").replace(
  '<script type="module" src="/src/main.tsx"></script>',
  '<link rel="stylesheet" href="app.css" />\n    <script type="module" src="app.js"></script>',
);
writeFileSync("dist/index.html", html);
console.log("dist/ built");

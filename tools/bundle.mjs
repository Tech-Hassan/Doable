// Bundle a Doable service entry into a single ESM file (used at image build
// time so Railway containers boot with plain `node` instead of tsx
// transpiling thousands of TS modules at container start).
//
// - Workspace TS sources are bundled in (esbuild compiles TS natively).
// - Native / lazy / CJS-ambiguous packages stay external and load from
//   node_modules at runtime.
// - Template-literal dynamic imports (e.g. `./${provider}.js`) are marked
//   external so they resolve at runtime relative to the output file, which
//   is written next to the sources (services/api/src/bundle.mjs).
import { build } from "esbuild";

const [, , entry, outfile] = process.argv;
if (!entry || !outfile) {
  console.error("usage: bundle.mjs <entry.ts> <outfile.mjs>");
  process.exit(2);
}

const dynamicImportExternal = {
  name: "dynamic-import-external",
  setup(b) {
    b.onResolve({ filter: /\$\{/ }, () => ({ external: true }));
  },
};

await build({
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile,
  logLevel: "warning",
  banner: {
    js: "import { createRequire as __dbr } from 'node:module'; const require = __dbr(import.meta.url);",
  },
  external: [
    "better-sqlite3",
    "puppeteer",
    "puppeteer-core",
    "playwright",
    "playwright-core",
    "sharp",
    "canvas",
    "bufferutil",
    "utf-8-validate",
    "ioredis",
    "typescript",
    "argon2",
    "bcrypt",
    "node-pty",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "@ts-morph/*",
    "ts-morph",
    "@prisma/*",
    "*.node",
  ],
  plugins: [dynamicImportExternal],
});
console.log("bundled", entry, "->", outfile);

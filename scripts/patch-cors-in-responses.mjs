#!/usr/bin/env node
// scripts/patch-cors-in-responses.mjs
// Add CORS headers to Response.json(...) / new Response(...) in api/functions/*.{ts,tsx}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// scripts/  → repo root
const ROOT = path.resolve(__dirname, '..');
// repo root → api/functions
const API_FUN_DIR = path.resolve(ROOT, 'api/functions');

function assertDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.error(
      `\n❌ Directory not found: ${dir}\n` +
      `Make sure you're running this from the project root and that "api/functions" exists.\n` +
      `Current ROOT resolved to: ${ROOT}\n`
    );
    process.exit(1);
  }
}

function listFunctionFiles() {
  assertDirExists(API_FUN_DIR);
  const entries = fs.readdirSync(API_FUN_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.(ts|tsx)$/.test(e.name))
    .map((e) => path.join(API_FUN_DIR, e.name));
}

function ensureCorsImport(src) {
  if (src.includes('CORS_HEADERS')) return src;
  const lines = src.split(/\r?\n/);
  let inserted = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\b/.test(lines[i])) {
      lines.splice(i + 1, 0, `import { CORS_HEADERS } from '../utils/cors';`);
      inserted = true;
      break;
    }
  }
  if (!inserted) lines.unshift(`import { CORS_HEADERS } from '../utils/cors';`);
  return lines.join('\n');
}

function patchResponses(src) {
  let changed = false;

  // Response.json(body)
  src = src.replace(
    /Response\.json\(\s*([^) ,\n]+)\s*\)/g,
    (m, body) => {
      changed = true;
      return `Response.json(${body}, { headers: CORS_HEADERS })`;
    }
  );

  // Response.json(body, { ... })
  src = src.replace(
    /Response\.json\(\s*([^,]+)\s*,\s*\{\s*([^}]*)\}\s*\)/g,
    (m, body, obj) => {
      if (/headers\s*:/.test(obj)) return m;
      changed = true;
      const insert = obj.trim().length ? `${obj}, headers: CORS_HEADERS` : `headers: CORS_HEADERS`;
      return `Response.json(${body}, { ${insert} })`;
    }
  );

  // new Response(body, { ... })
  src = src.replace(
    /new\s+Response\(\s*([^,]+)\s*,\s*\{\s*([^}]*)\}\s*\)/g,
    (m, body, obj) => {
      if (/headers\s*:/.test(obj)) return m;
      changed = true;
      const insert = obj.trim().length ? `${obj}, headers: CORS_HEADERS` : `headers: CORS_HEADERS`;
      return `new Response(${body}, { ${insert} })`;
    }
  );

  // new Response(body)
  src = src.replace(
    /new\s+Response\(\s*([^) ,\n]+)\s*\)/g,
    (m, body) => {
      changed = true;
      return `new Response(${body}, { headers: CORS_HEADERS })`;
    }
  );

  return { src, changed };
}

function main() {
  const files = listFunctionFiles();
  let patched = 0;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    const { src: patchedSrc, changed } = patchResponses(src);
    if (!changed) continue;

    const withImport = ensureCorsImport(patchedSrc);
    fs.writeFileSync(file, withImport, 'utf8');
    patched++;
    console.log(`✓ Patched CORS headers in ${path.relative(ROOT, file)}`);
  }

  console.log(`\n✅ Patched ${patched} file(s).`);
}

main();

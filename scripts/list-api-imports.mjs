#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p);
    else if (/\.(t|j)sx?$/.test(name)) files.push(p);
  }
})(SRC);

const rx = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@api\/([^'"]+)['"]/g;

const found = {};
for (const file of files) {
  const txt = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = rx.exec(txt))) {
    const names = m[1].split(',').map(s => s.trim());
    const mod = m[2];
    found[mod] ||= {};
    for (const n of names) {
      found[mod][n] ||= [];
      found[mod][n].push(path.relative(ROOT, file));
    }
  }
}

if (!Object.keys(found).length) {
  console.log('✅ No @api/* imports found.');
  process.exit(0);
}

console.log('🔍 @api/* imports:\n');
for (const mod of Object.keys(found)) {
  console.log(`- @api/${mod}`);
  const names = Object.keys(found[mod]).sort();
  for (const n of names) {
    const where = found[mod][n].map(f => path.relative(ROOT, f));
    console.log(`   • ${n}  ←  ${where.join(', ')}`);
  }
  console.log();
}

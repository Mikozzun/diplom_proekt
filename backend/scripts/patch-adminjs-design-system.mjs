import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const nm = (...segs) => resolve(__dirname, '..', 'node_modules', ...segs);

const targets = [
  nm('@adminjs', 'express', 'package.json'),
  nm('@adminjs', 'sql', 'package.json'),
  nm('adminjs', 'node_modules', '@adminjs', 'design-system', 'package.json'),
];

for (const pkgPath of targets) {
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    let patched = false;

    for (const [subpath, conditions] of Object.entries(pkg.exports ?? {})) {
      if (conditions.import && !conditions.require) {
        conditions.require = conditions.import;
        patched = true;
      }
    }

    if (patched) {
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`[patch] Added CJS require to ${pkg.name}`);
    }
  } catch {
    // Package not installed — skip
  }
}

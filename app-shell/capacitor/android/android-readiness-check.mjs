import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const checks = [
  ['package.json', 'package.json'],
  ['capacitor.config.ts', 'capacitor.config.ts'],
  ['Android CSS layer', 'assets/css/android-app-shell.css'],
  ['Android JS adapter', 'assets/js/android-app-shell-adapter.js'],
  ['Android README', 'app-shell/capacitor/android/README-ANDROID-BUILD.md'],
  ['Android checklist', 'app-shell/capacitor/android/ANDROID-APP-READINESS-CHECKLIST.md'],
];

let ok = true;
console.log('SAND Android readiness check');
for (const [label, rel] of checks) {
  const exists = fs.existsSync(path.join(root, rel));
  console.log(`${exists ? '✓' : '✗'} ${label}: ${rel}`);
  if (!exists) ok = false;
}
process.exit(ok ? 0 : 1);

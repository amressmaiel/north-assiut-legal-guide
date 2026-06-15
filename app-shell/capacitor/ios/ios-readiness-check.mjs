#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'index.html',
  'package.json',
  'capacitor.config.ts',
  'assets/css/ios-app-shell.css',
  'assets/css/iphone-first-ui-pass.css',
  'assets/js/ios-app-shell-adapter.js',
  'assets/js/iphone-first-ui-pass.js',
  'manifest.webmanifest',
  'platform.manifest.json'
];

const optionalFiles = [
  'assets/images/logo.png',
  'assets/images/avatar-3d.png',
  'app-shell/capacitor/ios/templates/PrivacyInfo.xcprivacy',
  'app-shell/capacitor/ios/templates/ExportOptions-AppStore.plist'
];

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function size(file) {
  try { return fs.statSync(path.join(root, file)).size; } catch { return 0; }
}

let ok = true;
console.log('\nSAND iOS Readiness Check');
console.log('========================\n');

console.log('Required files:');
for (const file of requiredFiles) {
  const pass = exists(file);
  if (!pass) ok = false;
  console.log(`${pass ? '✓' : '✗'} ${file}${pass ? ` (${size(file)} bytes)` : ''}`);
}

console.log('\nOptional / recommended files:');
for (const file of optionalFiles) {
  const pass = exists(file);
  console.log(`${pass ? '✓' : '!'} ${file}${pass ? ` (${size(file)} bytes)` : ' — recommended'}`);
}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  console.log('\nPackage:');
  console.log(`- name: ${pkg.name}`);
  console.log(`- version: ${pkg.version}`);
  console.log(`- iOS scripts: ${['ios:add','ios:sync','ios:open','ios:doctor'].filter(s => pkg.scripts?.[s]).join(', ') || 'missing'}`);
  if (!pkg.dependencies?.['@capacitor/core'] || !pkg.dependencies?.['@capacitor/ios']) {
    ok = false;
    console.log('✗ Capacitor dependencies are incomplete.');
  } else {
    console.log('✓ Capacitor dependencies found.');
  }
} catch (err) {
  ok = false;
  console.log('✗ package.json could not be read.');
}

try {
  const cfg = fs.readFileSync(path.join(root, 'capacitor.config.ts'), 'utf8');
  console.log('\nCapacitor config:');
  console.log(cfg.includes('eg.prosecution.northassiut.sand') ? '✓ Bundle ID found.' : '✗ Bundle ID not found.');
  console.log(cfg.includes('webDir') ? '✓ webDir configured.' : '✗ webDir missing.');
} catch {
  ok = false;
}

console.log('\nResult:');
if (ok) {
  console.log('✓ iOS shell files look ready. Continue on Mac with: npm install → npm run ios:add → npm run ios:sync → npm run ios:open');
  process.exit(0);
} else {
  console.log('✗ Some required files are missing. Fix the items above before opening Xcode.');
  process.exit(1);
}

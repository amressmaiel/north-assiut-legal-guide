#!/usr/bin/env node
// Sign a Bootstrap or License payload with RSA-PSS-SHA256.
// Usage:
//   node sign-auth-envelope.mjs private-auth-key.jwk bootstrap-payload.example.json bootstrap-owner.sandlicense
import { readFileSync, writeFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const [,, keyPath, payloadPath, outPath='signed-envelope.sandlicense'] = process.argv;
if (!keyPath || !payloadPath) {
  console.error('Usage: node sign-auth-envelope.mjs private-auth-key.jwk payload.json out.sandlicense');
  process.exit(1);
}
function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(obj).sort().map(k => JSON.stringify(k)+':'+stableStringify(obj[k])).join(',') + '}';
}
function b64url(buf) { return Buffer.from(buf).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
const privateJwk = JSON.parse(readFileSync(keyPath, 'utf8'));
const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
const key = createPrivateKey({ key: privateJwk, format: 'jwk' });
const data = Buffer.from(stableStringify(payload));
const signature = sign('sha256', data, { key, padding: require('node:crypto').constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 });
const envelope = { alg:'RSA-PSS-SHA256', payload, signature:b64url(signature) };
writeFileSync(outPath, JSON.stringify(envelope, null, 2));
console.log(`Signed envelope written to ${outPath}`);

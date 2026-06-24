#!/usr/bin/env node
// Generates RSA-PSS keypair for signing Bootstrap/License envelopes.
// Keep private-auth-key.jwk OFF GitHub. Put public-auth-key.jwk into Cloudflare env AUTH_PUBLIC_JWK.
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 3072,
  publicExponent: 0x10001,
});
const publicJwk = publicKey.export({ format: 'jwk' });
const privateJwk = privateKey.export({ format: 'jwk' });
writeFileSync('public-auth-key.jwk', JSON.stringify(publicJwk, null, 2));
writeFileSync('private-auth-key.jwk', JSON.stringify(privateJwk, null, 2));
console.log('Generated public-auth-key.jwk and private-auth-key.jwk');
console.log('IMPORTANT: Never upload private-auth-key.jwk to GitHub.');

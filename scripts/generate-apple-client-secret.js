/*
  Usage: node scripts/generate-apple-client-secret.js
  Requires: npm i jose --no-save

  Inputs are hardcoded from the user's provided values.
*/

const fs = require('fs');
const path = require('path');

async function run() {
  const { importPKCS8, SignJWT } = await import('jose');

  // Provided by user
  const TEAM_ID = 'U8FPZXV6X6';
  const CLIENT_ID = 'com.sidequest.app.service'; // Services ID
  const KEY_ID = 'KSAR7MH96Y';
  const P8_PATH = path.resolve(process.cwd(), 'AuthKey_KSAR7MH96Y.p8');

  if (!fs.existsSync(P8_PATH)) {
    console.error('Private key file not found at:', P8_PATH);
    process.exit(1);
  }

  const privateKey = fs.readFileSync(P8_PATH, 'utf8');

  const alg = 'ES256';
  const pk = await importPKCS8(privateKey, alg);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 180 * 24 * 60 * 60; // up to 6 months

  const token = await new SignJWT({})
    .setProtectedHeader({ alg, kid: KEY_ID })
    .setIssuer(TEAM_ID)
    .setAudience('https://appleid.apple.com')
    .setSubject(CLIENT_ID)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(pk);

  console.log('\nApple Client Secret (JWT):');
  console.log(token);
  console.log('\nMetadata:');
  console.log(JSON.stringify({ teamId: TEAM_ID, clientId: CLIENT_ID, keyId: KEY_ID, issuedAt: now, expiresAt: exp }, null, 2));
}

run().catch((err) => {
  console.error('Failed to generate Apple client secret:', err);
  process.exit(1);
});



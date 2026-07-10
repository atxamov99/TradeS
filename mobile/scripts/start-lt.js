#!/usr/bin/env node
/**
 * Localtunnel-based Expo dev server.
 * Usage: node scripts/start-lt.js
 *
 * 1. Starts localtunnel on port 8081 → gets a public HTTPS URL
 * 2. Sets REACT_NATIVE_PACKAGER_HOSTNAME so Expo uses that hostname
 * 3. Launches expo start --clear
 * 4. Prints the tunnel URL + QR for Expo Go
 */

const lt   = require('localtunnel');
const { spawn } = require('child_process');
const qrcode    = require('qrcode-terminal');

const PORT = 8081;

(async () => {
  console.log('\n🌐  Localtunnel yoqilmoqda...\n');

  let tunnel;
  try {
    tunnel = await lt({ port: PORT });
  } catch (e) {
    console.error('Tunnel xatoligi:', e.message);
    process.exit(1);
  }

  const tunnelUrl  = tunnel.url;                        // https://abc.loca.lt
  const tunnelHost = new URL(tunnelUrl).hostname;        // abc.loca.lt

  console.log(`✅  Tunnel tayyor: ${tunnelUrl}`);
  console.log(`    Hostname     : ${tunnelHost}`);
  console.log('\n📱  Expo Go da "Enter URL manually" ni bosib quyidagini kiriting:');
  console.log(`    ${tunnelUrl}\n`);

  // QR code — Expo Go'da scan qilish uchun
  qrcode.generate(tunnelUrl, { small: true });

  tunnel.on('error', (err) => console.error('\n⚠️  Tunnel xatoligi:', err.message));
  tunnel.on('close', () => console.log('\n🔴  Tunnel yopildi.'));

  const expoEnv = {
    ...process.env,
    REACT_NATIVE_PACKAGER_HOSTNAME: tunnelHost,
  };

  const expo = spawn(
    'npx',
    ['expo', 'start', '--clear', '--port', String(PORT)],
    { env: expoEnv, stdio: 'inherit', shell: true }
  );

  expo.on('close', (code) => {
    tunnel.close();
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    console.log('\nTo\'xtatilmoqda...');
    tunnel.close();
    expo.kill();
    process.exit(0);
  });
})();

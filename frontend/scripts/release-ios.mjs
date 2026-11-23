// Local iOS build + TestFlight upload. No EAS. Usage: pnpm release:ios [--no-upload]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appJsonPath = join(root, 'app.json');
const upload = !process.argv.includes('--no-upload');

function fail(msg) {
  console.error(`release:ios: ${msg}`);
  process.exit(1);
}

// 1. Validate before anything slow
const { ASC_KEY_ID, ASC_ISSUER_ID, APPLE_TEAM_ID } = process.env;
if (!ASC_KEY_ID) fail('ASC_KEY_ID is not set');
if (!ASC_ISSUER_ID) fail('ASC_ISSUER_ID is not set');
if (!APPLE_TEAM_ID) fail('APPLE_TEAM_ID is not set');
const keyPath = join(homedir(), '.appstoreconnect', 'private_keys', `AuthKey_${ASC_KEY_ID}.p8`);
if (!existsSync(keyPath)) fail(`API key not found at ${keyPath}`);
const original = readFileSync(appJsonPath, 'utf8');
const appJson = JSON.parse(original);
const expo = appJson.expo;
if (!expo?.ios?.bundleIdentifier) fail('expo.ios.bundleIdentifier missing in app.json');

// 2. Bump patch; timestamp build number (YYMMDDHHmm) only lives in the build
const parts = String(expo.version).split('.');
if (parts.length !== 3 || parts.some((p) => !/^\d+$/.test(p))) {
  throw new Error(`expo.version must be MAJOR.MINOR.PATCH, got "${expo.version}"`);
}
const version = `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`;
const d = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const buildNumber = `${p2(d.getFullYear() % 100)}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}`;

const run = (cmd, args, cwd = root) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  try {
    execFileSync(cmd, args, { cwd, stdio: 'inherit' });
  } catch {
    fail(`step failed: ${cmd} ${args.slice(0, 2).join(' ')}`);
  }
};

expo.version = version;
expo.ios.buildNumber = buildNumber;
writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

// 3. Generate native project (prebuild is clean by default), then pods
try {
  run('pnpm', ['exec', 'expo', 'prebuild', '--platform', 'ios', '--no-install']);
} finally {
  // keep the version bump, drop the build number
  delete expo.ios.buildNumber;
  writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
}
const iosDir = join(root, 'ios');
run('pod', ['install'], iosDir);

const app = readdirSync(iosDir).find((f) => f.endsWith('.xcworkspace'))?.replace('.xcworkspace', '');
if (!app) fail('no .xcworkspace found in ios/');

// 4. Archive
const auth = ['-allowProvisioningUpdates', '-authenticationKeyPath', keyPath, '-authenticationKeyID', ASC_KEY_ID, '-authenticationKeyIssuerID', ASC_ISSUER_ID];
const archive = join(root, 'build', `${app}.xcarchive`);
mkdirSync(join(root, 'build'), { recursive: true });
run('xcodebuild', ['-workspace', join(iosDir, `${app}.xcworkspace`), '-scheme', app, '-configuration', 'Release', '-destination', 'generic/platform=iOS', '-archivePath', archive, ...auth, `DEVELOPMENT_TEAM=${APPLE_TEAM_ID}`, 'archive']);

// 5. Export IPA
const plist = join(root, 'build', 'ExportOptions.plist');
writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>teamID</key><string>${APPLE_TEAM_ID}</string>
<key>signingStyle</key><string>automatic</string>
<key>destination</key><string>export</string>
</dict></plist>
`);
const exportDir = join(root, 'build', 'export');
run('xcodebuild', ['-exportArchive', '-archivePath', archive, '-exportPath', exportDir, '-exportOptionsPlist', plist, ...auth]);
const exported = readdirSync(exportDir).find((f) => f.endsWith('.ipa'));
if (!exported) fail('export produced no .ipa');
const ipa = join(root, 'build', `${app}-${version}.ipa`);
run('mv', [join(exportDir, exported), ipa]);

// 6. Upload
if (upload) {
  run('xcrun', ['altool', '--upload-app', '--type', 'ios', '--file', ipa, '--apiKey', ASC_KEY_ID, '--apiIssuer', ASC_ISSUER_ID]);
}

// 7. Report
console.log(`\n${upload ? 'Uploaded' : 'Built (not uploaded)'}: version ${version} build ${buildNumber}\n${ipa}`);

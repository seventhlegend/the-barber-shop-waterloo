import { lstat, readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';

const secretNames = ['SQUARE_ACCESS_TOKEN', 'SQUARE_SANDBOX_ACCESS_TOKEN', 'CHECKOUT_RECOVERY_SECRET', 'SQUARE_WEBHOOK_SIGNATURE_KEY'];
async function localSecrets() {
  const values = secretNames.map(name => process.env[name]).filter(Boolean);
  for (const name of (await readdir('.')).filter(name => /^\.env(?:\.|$)/.test(name))) {
    try {
      const parsed = parseEnv(await readFile(name, 'utf8'));
      for (const name of secretNames) if (parsed[name]) values.push(parsed[name]);
    } catch { /* An unreadable optional env file cannot be packaged either. */ }
  }
  try { values.push((await readFile('.booking-data/recovery-secret', 'utf8')).trim()); } catch { /* Local ledger is optional. */ }
  return [...new Set(values.filter(value => value.length >= 12))];
}

export async function auditBuild(directory, { secrets, requireWorker = true } = {}) {
  const root = resolve(directory);
  const privateValues = secrets || await localSecrets();
  const files = [];
  async function walk(folder) {
    for (const name of await readdir(folder)) {
      const absolute = resolve(folder, name);
      const path = relative(root, absolute).split('\\').join('/');
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw new Error(`Build audit rejected a symlink: ${path}`);
      if (path.split('/').some(part => /^(?:\.env.*|\.dev\.vars.*|\.git|\.booking-data|node_modules|server|functions|_functions)$/.test(part)) || /\.(?:map|pem|key|sqlite|db)(?:$|-)/i.test(name)) throw new Error(`Build audit rejected a private artifact: ${path}`);
      if (info.isDirectory()) { await walk(absolute); continue; }
      const content = await readFile(absolute);
      if (privateValues.some(value => content.includes(Buffer.from(value))) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content.toString('utf8'))) throw new Error(`Build audit detected a private value in ${path}; value withheld.`);
      if (path !== '_worker.js' && secretNames.some(name => content.includes(Buffer.from(name)))) throw new Error(`Server-only configuration was found in a public asset: ${path}`);
      if (/web\.squarecdn\.com|pci-connect\.squareup|pay\.google\.com|applePay\(|googlePay\(|\/v2\/payments/.test(content.toString('utf8'))) throw new Error(`Build contains a removed online-payment integration: ${path}`);
      files.push(path);
    }
  }
  await walk(root);
  if (!files.includes('index.html')) throw new Error('The build is missing index.html.');
  if (requireWorker && (!files.includes('_worker.js') || !files.includes('_routes.json'))) throw new Error('The Cloudflare server bundle or routing manifest is missing.');
  return { files: files.length, privateFiles: 0, secretOccurrences: 0, serverBundle: files.includes('_worker.js'), onlinePayments: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await auditBuild(process.argv[2] || 'out'))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

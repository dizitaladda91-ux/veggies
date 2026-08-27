const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const candidates = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'secret-scan.js') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (/\.(js|jsx|ts|tsx|json|env|md|yml|yaml)$/.test(entry.name)) candidates.push(fullPath);
  }
};
walk(root);

const risky = [];
for (const file of candidates) {
  const text = fs.readFileSync(file, 'utf8');
  if (/(sk_live|ghp_|AIza|AKIA|xox[baprs]-|BEGIN PRIVATE KEY)(?![\w\s]*example)/.test(text)) risky.push(file);
}

if (risky.length) {
  console.error('Potential secrets found:', risky);
  process.exit(1);
}

console.log('No obvious secrets detected.');

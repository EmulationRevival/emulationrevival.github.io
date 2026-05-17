const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT_DIR, 'json', 'version.json');
const VERSION_INPUTS = [
  path.join(ROOT_DIR, 'json', 'app-links.json'),
  path.join(ROOT_DIR, 'json', 'search-index.json'),
];

function readFileOrEmpty(filePath) {
  if (!fs.existsSync(filePath)) {
    return '';
  }

  return fs.readFileSync(filePath, 'utf8');
}

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeFileAtomic(filePath, content) {
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, filePath);
}

function buildContentVersion() {
  const hash = crypto.createHash('sha256');

  for (const filePath of VERSION_INPUTS) {
    hash.update(path.relative(ROOT_DIR, filePath));
    hash.update('\0');
    hash.update(readFileOrEmpty(filePath));
    hash.update('\0');
  }

  return hash.digest('hex').slice(0, 16);
}

function main() {
  const nextVersion = buildContentVersion();
  const previousVersion = String(readJsonFile(VERSION_FILE, {}).version ?? '').trim();

  if (previousVersion === nextVersion) {
    console.log(`Data version unchanged: ${nextVersion}`);
    return;
  }

  writeFileAtomic(VERSION_FILE, `${JSON.stringify({ version: nextVersion })}\n`);
  console.log(`Updated data version: ${nextVersion}`);
}

main();

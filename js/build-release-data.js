const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_PATH = path.join(ROOT_DIR, 'json', 'app-links.json');
const OUTPUT_PATH = path.join(ROOT_DIR, '_data', 'release_data.json');

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAsset(asset) {
  if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
    return null;
  }

  const id = normalizeString(asset.id);
  const url = normalizeString(asset.url);

  if (!id || !url) {
    return null;
  }

  return { id, url };
}

function normalizeReleaseEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }

  const assets = Array.isArray(entry.assets)
    ? entry.assets.map(normalizeAsset).filter(Boolean)
    : [];

  const assetMap = {};

  for (const asset of assets) {
    assetMap[asset.id] = asset.url;
  }

  return {
    name: normalizeString(entry.name),
    version: normalizeString(entry.version),
    releaseDate: normalizeString(entry.releaseDate),
    firstReleaseDate: normalizeString(entry.firstReleaseDate),
    releaseNotesUrl: normalizeString(entry.releaseNotesUrl),
    releaseTag: normalizeString(entry.releaseTag),
    assets,
    assetMap,
  };
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback;
    }

    throw error;
  }
}

async function writeIfChanged(filePath, content) {
  let previous = '';

  try {
    previous = await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (previous === content) {
    return false;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  return true;
}

async function main() {
  console.log('Building Jekyll release data from app-links.json...');

  const source = await readJson(SOURCE_PATH, null);

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('json/app-links.json must be an object keyed by app_id.');
  }

  const output = {};

  for (const appId of Object.keys(source).sort()) {
    const normalizedAppId = normalizeString(appId);

    if (!normalizedAppId) {
      continue;
    }

    const normalizedEntry = normalizeReleaseEntry(source[appId]);

    if (!normalizedEntry) {
      continue;
    }

    output[normalizedAppId] = normalizedEntry;
  }

  const outputContent = `${stableStringify(output)}\n`;
  const changed = await writeIfChanged(OUTPUT_PATH, outputContent);

  console.log('-------------------------------------------');

  if (changed) {
    console.log(`Success! Release data updated with ${Object.keys(output).length} entries.`);
  } else {
    console.log(`Release data unchanged with ${Object.keys(output).length} entries.`);
  }

  console.log(`Saved to: ${OUTPUT_PATH}`);
  console.log('-------------------------------------------');
}

main().catch(error => {
  console.error('Error building release data:', error);
  process.exitCode = 1;
});

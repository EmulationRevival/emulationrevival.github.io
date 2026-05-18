const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

const DATA_FILES = [
  {
    file: '_data/emulators.yml',
    category: 'Emulators'
  },
  {
    file: '_data/ports.yml',
    category: 'Ports'
  },
  {
    file: '_data/utilities.yml',
    category: 'Utilities'
  },
  {
    file: '_data/apps.yml',
    category: 'Apps'
  },
  {
    file: '_data/frontends.yml',
    category: 'Frontends'
  },
  {
    file: '_data/media-apps.yml',
    category: 'Media Apps'
  },
  {
    file: '_data/experimental-apps.yml',
    category: 'Experimental Apps'
  },
  {
    file: '_data/gzdoom-mods.yml',
    category: 'GZDoom Mods'
  }
];

const ROOT_DIR = path.join(__dirname, '../');
const JSON_DIR = path.join(ROOT_DIR, 'json');
const OUTPUT_PATH = path.join(JSON_DIR, 'search-index.json');

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function ensureLeadingSlash(value = '') {
  if (!value) return '';
  return value.startsWith('/') ? value : `/${value}`;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function buildEntry(item, fallbackCategory) {
  const name = normalizeText(item.title || '');
  const description = normalizeText(item.description || '');
  const img = ensureLeadingSlash(normalizeText(item.image || ''));
  const url = ensureLeadingSlash(normalizeText(item.page_url || ''));
  const category = normalizeText(item.category || fallbackCategory || '');

  if (!name || !img || !url) {
    return null;
  }

  return {
    name,
    description,
    img,
    url,
    category
  };
}

async function extractDataIndex({ file, category }) {
  const fullPath = path.join(ROOT_DIR, file);

  if (!(await fileExists(fullPath))) {
    console.warn(`Skipping missing data file: ${fullPath}`);
    return [];
  }

  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = yaml.load(raw);

  if (!Array.isArray(parsed)) {
    console.warn(`Skipping invalid YAML array: ${fullPath}`);
    return [];
  }

  const entries = [];
  const seenUrls = new Set();

  for (let i = 0; i < parsed.length; i += 1) {
    const entry = buildEntry(parsed[i], category);

    if (!entry) {
      continue;
    }

    if (seenUrls.has(entry.url)) {
      continue;
    }

    seenUrls.add(entry.url);
    entries.push(entry);
  }

  return entries;
}

async function main() {
  console.log('Starting search index build from _data YAML files...');

  const pageResults = await Promise.all(DATA_FILES.map(extractDataIndex));
  const masterIndex = pageResults.flat();

  await fs.mkdir(JSON_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(masterIndex, null, 2), 'utf8');

  console.log('-------------------------------------------');
  console.log(`Success! Index built with ${masterIndex.length} items.`);
  console.log(`Saved to: ${OUTPUT_PATH}`);
  console.log('-------------------------------------------');
}

main().catch(err => {
  console.error('Error building search index:', err);
  process.exitCode = 1;
});
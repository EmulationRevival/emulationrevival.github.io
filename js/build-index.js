const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');

const PAGES_TO_INDEX = [
  'xbox-dev-mode/emulators.html',
  'xbox-dev-mode/ports.html',
  'xbox-dev-mode/utilities.html',
  'xbox-dev-mode/apps.html',
  'xbox-dev-mode/frontends.html',
  'xbox-dev-mode/media-apps.html',
  'xbox-dev-mode/experimental-apps.html',
];

const ROOT_DIR = path.join(__dirname, '../');
const JSON_DIR = path.join(ROOT_DIR, 'json');
const OUTPUT_PATH = path.join(JSON_DIR, 'search-index.json');

function normalizeText(str = '') {
  return str.replace(/\s+/g, ' ').trim();
}

function makeCategory(filePath) {
  const base = path.basename(filePath, '.html');
  const spaced = base.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function buildUrl(filePath, id) {
  return `/${filePath}${id ? `#${id}` : ''}`;
}

function getStableId($, cardEl) {
  const directId = $(cardEl).attr('id');
  if (directId) return directId;

  const closestId = $(cardEl).closest('[id]').attr('id');
  return closestId || '';
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function extractPageIndex(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);

  if (!(await fileExists(fullPath))) {
    console.warn(`Skipping missing file: ${fullPath}`);
    return [];
  }

  const html = await fs.readFile(fullPath, 'utf8');
  const $ = cheerio.load(html);
  const category = makeCategory(filePath);
  const entries = [];
  const seenUrls = new Set();

  $('.card').each((_, el) => {
    const title = normalizeText($(el).find('.card-title').first().text());
    if (!title) return;

    const description = normalizeText($(el).find('.card-description').first().text());
    const img = normalizeText($(el).find('.card-image').first().attr('src') || '');
    const id = getStableId($, el);

    // If search should always jump to a specific card, enforce id presence:
    if (!id) return;

    const url = buildUrl(filePath, id);
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    entries.push({
      name: title,
      description,
      img,
      url,
      category,
    });
  });

  return entries;
}

async function main() {
  console.log('Starting search index build...');

  const pageResults = await Promise.all(PAGES_TO_INDEX.map(extractPageIndex));
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
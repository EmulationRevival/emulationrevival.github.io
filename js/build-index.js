const fs = require('fs/promises');
const path = require('path');
const cheerio = require('cheerio');

const GRID_FILES = [
  {
    include: '_includes/cards/emulators-grid.html',
    page: 'xbox-dev-mode/emulators.html',
    category: 'Emulators'
  },
  {
    include: '_includes/cards/ports-grid.html',
    page: 'xbox-dev-mode/ports.html',
    category: 'Ports'
  },
  {
    include: '_includes/cards/utilities-grid.html',
    page: 'xbox-dev-mode/utilities.html',
    category: 'Utilities'
  },
  {
    include: '_includes/cards/apps-grid.html',
    page: 'xbox-dev-mode/apps.html',
    category: 'Apps'
  },
  {
    include: '_includes/cards/frontends-grid.html',
    page: 'xbox-dev-mode/frontends.html',
    category: 'Frontends'
  },
  {
    include: '_includes/cards/media-apps-grid.html',
    page: 'xbox-dev-mode/media-apps.html',
    category: 'Media Apps'
  },
  {
    include: '_includes/cards/experimental-apps-grid.html',
    page: 'xbox-dev-mode/experimental-apps.html',
    category: 'Experimental Apps'
  }
];

const ROOT_DIR = path.join(__dirname, '../');
const JSON_DIR = path.join(ROOT_DIR, 'json');
const OUTPUT_PATH = path.join(JSON_DIR, 'search-index.json');

function normalizeText(str = '') {
  return str.replace(/\s+/g, ' ').trim();
}

function buildUrl(filePath, id) {
  return `/${filePath}${id ? `#${id}` : ''}`;
}

function getStableId($, cardEl) {
  const directId = $(cardEl).attr('id');
  if (directId) return directId;

  const triggerId = $(cardEl).find('[data-modal-trigger]').first().attr('data-modal-trigger');
  if (triggerId) return triggerId;

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

async function extractGridIndex({ include, page, category }) {
  const fullPath = path.join(ROOT_DIR, include);

  if (!(await fileExists(fullPath))) {
    console.warn(`Skipping missing include file: ${fullPath}`);
    return [];
  }

  const html = await fs.readFile(fullPath, 'utf8');
  const $ = cheerio.load(html);
  const entries = [];
  const seenUrls = new Set();

  $('.card').each((_, el) => {
    const $card = $(el);
    const title = normalizeText($card.find('.card-title').first().text());
    if (!title) return;

    const description = normalizeText($card.find('.card-description').first().text());
    const img = normalizeText($card.find('.card-image').first().attr('src') || '');
    const id = getStableId($, el);

    if (!id) return;

    const url = buildUrl(page, id);
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    entries.push({
      name: title,
      description,
      img,
      url,
      category
    });
  });

  return entries;
}

async function main() {
  console.log('Starting search index build from _includes/cards...');

  const pageResults = await Promise.all(GRID_FILES.map(extractGridIndex));
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
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '..');

const DATA_FILES = [
  '_data/apps.yml',
  '_data/emulators.yml',
  '_data/ports.yml',
  '_data/utilities.yml',
  '_data/frontends.yml',
  '_data/media-apps.yml',
  '_data/experimental-apps.yml',
  '_data/gzdoom-mods.yml',
];

const GENERATED_HTML_FILES = [
  '_site/xbox-dev-mode/apps.html',
  '_site/xbox-dev-mode/emulators.html',
  '_site/xbox-dev-mode/frontends.html',
  '_site/xbox-dev-mode/experimental-apps.html',
  '_site/xbox-dev-mode/ports.html',
  '_site/xbox-dev-mode/media-apps.html',
  '_site/xbox-dev-mode/utilities.html',
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  const raw = await fs.readFile(absolutePath, 'utf8');
  return JSON.parse(raw);
}

async function readYamlFile(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);

  if (!(await pathExists(absolutePath))) {
    return [];
  }

  const raw = await fs.readFile(absolutePath, 'utf8');
  const parsed = yaml.load(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`${relativePath} must contain a YAML array`);
  }

  return parsed;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function collectDownloads(card) {
  if (!card || typeof card !== 'object') {
    return [];
  }

  if (Array.isArray(card.downloads)) {
    return card.downloads;
  }

  if (card.download && typeof card.download === 'object') {
    return [card.download];
  }

  return [];
}

function validateReleaseEntry(appId, release, errors) {
  if (!release || typeof release !== 'object') {
    errors.push(`release_data entry for "${appId}" must be an object`);
    return;
  }

  if (!release.assetMap || typeof release.assetMap !== 'object' || Array.isArray(release.assetMap)) {
    errors.push(`release_data entry for "${appId}" is missing assetMap`);
  }

  if (!Array.isArray(release.assets)) {
    errors.push(`release_data entry for "${appId}" is missing assets array`);
    return;
  }

  for (const asset of release.assets) {
    const assetId = normalizeString(asset && asset.id);
    const assetUrl = normalizeString(asset && asset.url);

    if (!assetId) {
      errors.push(`release_data entry for "${appId}" contains an asset without an id`);
      continue;
    }

    if (!assetUrl) {
      errors.push(`release_data entry for "${appId}" contains asset "${assetId}" without a URL`);
      continue;
    }

    if (!release.assetMap || release.assetMap[assetId] !== assetUrl) {
      errors.push(`release_data entry for "${appId}" assetMap mismatch for asset "${assetId}"`);
    }
  }
}

async function validateSourceData() {
  const releaseData = await readJson('_data/release_data.json');
  const errors = [];
  const warnings = [];
  let cardCount = 0;
  let downloadCount = 0;

  if (!releaseData || typeof releaseData !== 'object' || Array.isArray(releaseData)) {
    throw new Error('_data/release_data.json must be an object keyed by app_id');
  }

  for (const [appId, release] of Object.entries(releaseData)) {
    validateReleaseEntry(appId, release, errors);
  }

  for (const dataFile of DATA_FILES) {
    const cards = await readYamlFile(dataFile);

    for (const card of cards) {
      cardCount += 1;

      const title = normalizeString(card.title || card.name || card.id || 'Unknown card');
      const appId = normalizeString(card.app_id);

      if (!appId) {
        warnings.push(`${dataFile}: "${title}" has no app_id, skipping release_data validation`);
        continue;
      }

      const release = releaseData[appId];

      if (!release) {
        errors.push(`${dataFile}: "${title}" uses app_id "${appId}" but _data/release_data.json has no matching entry`);
        continue;
      }

      const downloads = collectDownloads(card);

      for (const download of downloads) {
        const assetId = normalizeString(download && download.asset_id);

        if (!assetId) {
          continue;
        }

        downloadCount += 1;

        if (!release.assetMap || !release.assetMap[assetId]) {
          errors.push(`${dataFile}: "${title}" uses asset_id "${assetId}" but release_data["${appId}"].assetMap has no matching URL`);
        }
      }
    }
  }

  return { errors, warnings, cardCount, downloadCount };
}

async function validateGeneratedHtml() {
  const errors = [];
  const warnings = [];
  let checkedFiles = 0;

  for (const htmlFile of GENERATED_HTML_FILES) {
    const absolutePath = path.join(ROOT_DIR, htmlFile);

    if (!(await pathExists(absolutePath))) {
      warnings.push(`${htmlFile} not found, skipping generated HTML validation`);
      continue;
    }

    checkedFiles += 1;

    const html = await fs.readFile(absolutePath, 'utf8');

    if (html.includes('Version: Checking')) {
      errors.push(`${htmlFile} still contains "Version: Checking"`);
    }

    if (html.includes('Release date: Checking')) {
      errors.push(`${htmlFile} still contains "Release date: Checking"`);
    }

    const hrefPlaceholderPattern = /href=["']#["'][\s\S]{0,300}?class=["'][^"']*\bdownload-link\b|class=["'][^"']*\bdownload-link\b[\s\S]{0,300}?href=["']#["']/g;

    if (hrefPlaceholderPattern.test(html)) {
      errors.push(`${htmlFile} contains a download-link with href="#"`);
    }
  }

  return { errors, warnings, checkedFiles };
}

async function main() {
  console.log('Validating site data...');

  const sourceResult = await validateSourceData();
  const htmlResult = await validateGeneratedHtml();

  const warnings = [...sourceResult.warnings, ...htmlResult.warnings];
  const errors = [...sourceResult.errors, ...htmlResult.errors];

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }

  if (errors.length > 0) {
    console.error('-------------------------------------------');
    console.error(`Validation failed with ${errors.length} error(s):`);

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    console.error('-------------------------------------------');
    process.exitCode = 1;
    return;
  }

  console.log('-------------------------------------------');
  console.log('Validation passed.');
  console.log(`Cards checked: ${sourceResult.cardCount}`);
  console.log(`Download asset references checked: ${sourceResult.downloadCount}`);
  console.log(`Generated HTML files checked: ${htmlResult.checkedFiles}`);
  console.log('-------------------------------------------');
}

main().catch(error => {
  console.error('Validation crashed:', error);
  process.exitCode = 1;
});

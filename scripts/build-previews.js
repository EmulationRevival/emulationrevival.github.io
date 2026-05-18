const fs = require('fs/promises');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../');
const JSON_PATH = path.join(ROOT_DIR, 'json', 'search-index.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'previews');

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizePathname(url = '') {
  try {
    return new URL(url, 'https://emulationrevival.github.io').pathname;
  } catch {
    return '/';
  }
}

function ensureLeadingSlash(value = '') {
  return value.startsWith('/') ? value : `/${value}`;
}

function buildPreviewPath(entry, usedSlugs) {
  const urlPath = normalizePathname(entry.url);
  const hash = entry.url.includes('#') ? entry.url.split('#')[1] : '';
  const pageBase = path.basename(urlPath, path.extname(urlPath)) || 'item';

  const parts = [
    pageBase,
    hash || entry.name || '',
  ]
    .map(slugify)
    .filter(Boolean);

  let baseSlug = parts.join('-') || 'item';
  let slug = baseSlug;
  let counter = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  usedSlugs.add(slug);
  return `${slug}.html`;
}

function escapeYamlString(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function buildPreviewFileContent(entry) {
  const title = escapeYamlString(entry.name || 'Untitled');
  const description = escapeYamlString(entry.description || '');
  const image = escapeYamlString(ensureLeadingSlash(entry.img || '/images/fallback.png'));
  const targetUrl = escapeYamlString(ensureLeadingSlash(entry.url || '/'));
  const category = escapeYamlString(entry.category || '');

  return `---
layout: preview
title: "${title}"
description: "${description}"
image: "${image}"
target_url: "${targetUrl}"
robots: "noindex, follow"
category: "${category}"
---
`;
}

async function cleanOutputDirectory(directoryPath) {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await fs.mkdir(directoryPath, { recursive: true });
}

async function loadSearchIndex() {
  const raw = await fs.readFile(JSON_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('search-index.json is not an array');
  }

  return parsed.filter(entry => {
    return (
      entry &&
      typeof entry === 'object' &&
      typeof entry.name === 'string' &&
      entry.name.trim() &&
      typeof entry.url === 'string' &&
      entry.url.trim() &&
      typeof entry.img === 'string' &&
      entry.img.trim()
    );
  });
}

async function writePreviewFiles(entries) {
  const usedSlugs = new Set();
  const writes = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const fileName = buildPreviewPath(entry, usedSlugs);
    const filePath = path.join(OUTPUT_DIR, fileName);
    const content = buildPreviewFileContent(entry);
    writes.push(fs.writeFile(filePath, content, 'utf8'));
  }

  await Promise.all(writes);
  return writes.length;
}

async function main() {
  console.log('Generating preview pages from search-index.json...');

  const entries = await loadSearchIndex();

  if (entries.length === 0) {
    throw new Error('No valid entries found in search-index.json');
  }

  await cleanOutputDirectory(OUTPUT_DIR);
  const writtenCount = await writePreviewFiles(entries);

  console.log('-------------------------------------------');
  console.log(`Success! Generated ${writtenCount} preview pages.`);
  console.log(`Saved to: ${OUTPUT_DIR}`);
  console.log('-------------------------------------------');
}

main().catch(error => {
  console.error('Error generating preview pages:', error);
  process.exitCode = 1;
});
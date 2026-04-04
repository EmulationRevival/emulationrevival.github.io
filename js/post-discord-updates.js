const fs = require('fs/promises');
const path = require('path');
const { setTimeout: delay } = require('timers/promises');

const SITE_ORIGIN = 'https://emulationrevival.github.io';
const POST_DELAY_MS = 1000;

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
    return new URL(url, SITE_ORIGIN).pathname;
  } catch {
    return '/';
  }
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

  const baseSlug = parts.join('-') || 'item';
  let slug = baseSlug;
  let counter = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  usedSlugs.add(slug);
  return `${slug}.html`;
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function buildPreviewLookup(searchIndex) {
  const usedSlugs = new Set();
  const lookup = new Map();

  for (let i = 0; i < searchIndex.length; i += 1) {
    const entry = searchIndex[i];

    if (
      !entry ||
      typeof entry !== 'object' ||
      typeof entry.name !== 'string' ||
      !entry.name.trim() ||
      typeof entry.url !== 'string' ||
      !entry.url.trim() ||
      typeof entry.img !== 'string' ||
      !entry.img.trim()
    ) {
      continue;
    }

    const fileName = buildPreviewPath(entry, usedSlugs);
    lookup.set(entry.url, `${SITE_ORIGIN}/previews/${fileName}`);
  }

  return lookup;
}

function getChangedApps(previousData, currentData) {
  const changes = [];

  for (const [appId, currentEntry] of Object.entries(currentData)) {
    const previousEntry = previousData[appId];

    if (!currentEntry || typeof currentEntry !== 'object') {
      continue;
    }

    if (!previousEntry) {
      changes.push({
        appId,
        type: 'new',
        currentEntry,
      });
      continue;
    }

    const previousVersion = previousEntry.version || '';
    const currentVersion = currentEntry.version || '';
    const previousReleaseDate = previousEntry.releaseDate || '';
    const currentReleaseDate = currentEntry.releaseDate || '';

    if (previousVersion !== currentVersion || previousReleaseDate !== currentReleaseDate) {
      changes.push({
        appId,
        type: 'updated',
        previousEntry,
        currentEntry,
      });
    }
  }

  return changes;
}

function findSearchIndexEntryForApp(appId, appEntry, searchIndex) {
  const appName = String(appEntry?.name || '').trim().toLowerCase();

  for (let i = 0; i < searchIndex.length; i += 1) {
    const entry = searchIndex[i];
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const entryName = String(entry.name || '').trim().toLowerCase();
    if (entryName === appName) {
      return entry;
    }
  }

  for (let i = 0; i < searchIndex.length; i += 1) {
    const entry = searchIndex[i];
    if (!entry || typeof entry !== 'object' || typeof entry.url !== 'string') {
      continue;
    }

    const hash = entry.url.includes('#') ? entry.url.split('#')[1] : '';
    if (hash === appId) {
      return entry;
    }
  }

  return null;
}

function buildRolePrefix() {
  const roleId = String(process.env.DISCORD_ROLE_ID || '').trim();
  return roleId ? `<@&${roleId}> ` : '';
}

function buildDiscordMessageForChange(change, searchIndex, previewLookup) {
  const appEntry = change.currentEntry;
  const searchEntry = findSearchIndexEntryForApp(change.appId, appEntry, searchIndex);
  const previewUrl = searchEntry ? previewLookup.get(searchEntry.url) : '';

  if (!previewUrl) {
    return '';
  }

  const rolePrefix = buildRolePrefix();
  const heading = change.type === 'new'
    ? `${rolePrefix}**${appEntry.name || change.appId}** is now available`
    : `${rolePrefix}**${appEntry.name || change.appId}** has been updated`;

  return [
    heading,
    '',
    `Version: ${appEntry.version || 'Unknown'}`,
    `Released: ${appEntry.releaseDate || 'Unknown'}`,
    '',
    previewUrl,
  ].join('\n');
}

async function postToDiscord(webhookUrl, content) {
  const roleId = String(process.env.DISCORD_ROLE_ID || '').trim();

  const allowedMentions = roleId
    ? {
        parse: [],
        roles: [roleId],
      }
    : {
        parse: [],
      };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      allowed_mentions: allowedMentions,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${responseText}`);
  }
}

async function main() {
  const previousPath = process.argv[2];
  const currentPath = process.argv[3];
  const searchIndexPath = process.argv[4];
  const webhookUrl = String(process.env.DISCORD_WEBHOOK_URL || '').trim();

  if (!previousPath || !currentPath || !searchIndexPath) {
    throw new Error('Usage: node js/post-discord-updates.js <previous-app-links.json> <current-app-links.json> <search-index.json>');
  }

  if (!webhookUrl) {
    throw new Error('Missing DISCORD_WEBHOOK_URL environment variable');
  }

  const previousData = await readJsonFile(previousPath, {});
  const currentData = await readJsonFile(currentPath, {});
  const searchIndex = await readJsonFile(searchIndexPath, []);

  const changes = getChangedApps(previousData, currentData);

  if (!changes.length) {
    console.log('No app version/release changes detected. Skipping Discord post.');
    return;
  }

  const previewLookup = buildPreviewLookup(searchIndex);
  let postedCount = 0;

  for (let i = 0; i < changes.length; i += 1) {
    const message = buildDiscordMessageForChange(changes[i], searchIndex, previewLookup);

    if (!message) {
      console.log(`Skipped ${changes[i].appId}: no preview URL resolved.`);
      continue;
    }

    await postToDiscord(webhookUrl, message);
    postedCount += 1;

    if (i < changes.length - 1) {
      await delay(POST_DELAY_MS);
    }
  }

  console.log(`Posted ${postedCount} update message(s) to Discord.`);
}

main().catch(error => {
  console.error('Error posting Discord updates:', error);
  process.exitCode = 1;
});
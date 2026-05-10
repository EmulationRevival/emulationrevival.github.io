const fs = require('fs/promises');
const path = require('path');
const { setTimeout: delay } = require('timers/promises');

const SITE_ORIGIN = 'https://emulationrevival.github.io';
const POST_DELAY_MS = 1000;
const MIRROR_REPO = 'EmulationRevival/emulationrevival-downloads';

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

function normalizeRepoPath(repoPath = '') {
  const value = String(repoPath || '').trim();

  if (!value) {
    return '';
  }

  const githubUrlMatch = value.match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)(?:[/?#].*)?$/i);
  if (githubUrlMatch) {
    return githubUrlMatch[1];
  }

  const repoMatch = value.match(/^([^/\s]+\/[^/\s]+)$/);
  if (repoMatch) {
    return repoMatch[1];
  }

  return '';
}

function isMirrorRepo(repoPath = '') {
  return normalizeRepoPath(repoPath).toLowerCase() === MIRROR_REPO.toLowerCase();
}

function extractGitHubRepoFromUrl(url = '') {
  const match = String(url || '').trim().match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+)(?:[/?#].*)?$/i);
  return match ? match[1] : '';
}

function isGitHubReleaseUrl(url = '') {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/releases\/(?:tag\/[^/?#]+|latest)(?:[?#].*)?$/i.test(String(url || '').trim());
}

function getOrdinalSuffix(day) {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return '';
  }

  const lastTwoDigits = day % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

function formatDisplayDate(value = '') {
  const rawValue = String(value || '').trim();

  if (!rawValue || rawValue === 'Unknown') {
    return 'Unknown';
  }

  const isoMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!isoMatch) {
    return rawValue;
  }

  const year = Number.parseInt(isoMatch[1], 10);
  const month = Number.parseInt(isoMatch[2], 10);
  const day = Number.parseInt(isoMatch[3], 10);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return rawValue;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return rawValue;
  }

  const monthName = date.toLocaleString('en-GB', {
    month: 'long',
    timeZone: 'UTC',
  });

  return `${monthName} ${day}${getOrdinalSuffix(day)}, ${year}`;
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
  return roleId ? `<@&${roleId}>` : '';
}

function getExplicitReleaseNotesUrl(appEntry) {
  const candidateUrls = [
    appEntry?.releaseNotesUrl,
    appEntry?.release_notes_url,
    appEntry?.changelogUrl,
    appEntry?.changelog_url,
    appEntry?.releaseUrl,
    appEntry?.release_url,
    appEntry?.html_url,
    appEntry?.githubReleaseUrl,
    appEntry?.github_release_url,
    appEntry?.latestReleaseUrl,
    appEntry?.latest_release_url,
    appEntry?.release?.html_url,
    appEntry?.latestRelease?.html_url,
  ];

  for (let i = 0; i < candidateUrls.length; i += 1) {
    const url = String(candidateUrls[i] || '').trim();

    if (isGitHubReleaseUrl(url)) {
      return url;
    }
  }

  return '';
}

function getReleaseTag(appEntry) {
  const candidateTags = [
    appEntry?.releaseTag,
    appEntry?.release_tag,
    appEntry?.tagName,
    appEntry?.tag_name,
    appEntry?.tag,
    appEntry?.latestRelease?.tag_name,
    appEntry?.release?.tag_name,
  ];

  for (let i = 0; i < candidateTags.length; i += 1) {
    const tag = String(candidateTags[i] || '').trim();

    if (tag) {
      return tag;
    }
  }

  return '';
}

function getGitHubRepoPath(appEntry) {
  const candidateRepos = [
    appEntry?.repo,
    appEntry?.repository,
    appEntry?.githubRepo,
    appEntry?.github_repo,
    appEntry?.sourceRepo,
    appEntry?.source_repo,
    appEntry?.sourceCodeRepo,
    appEntry?.source_code_repo,
  ];

  for (let i = 0; i < candidateRepos.length; i += 1) {
    const repoPath = normalizeRepoPath(candidateRepos[i]);

    if (repoPath) {
      return repoPath;
    }
  }

  const candidateUrls = [
    appEntry?.sourceCodeUrl,
    appEntry?.source_code_url,
    appEntry?.github,
    appEntry?.homepage,
    appEntry?.projectUrl,
    appEntry?.project_url,
  ];

  for (let i = 0; i < candidateUrls.length; i += 1) {
    const repoPath = extractGitHubRepoFromUrl(candidateUrls[i]);

    if (repoPath) {
      return repoPath;
    }
  }

  return '';
}

function buildReleaseNotesUrl(appEntry) {
  const explicitUrl = getExplicitReleaseNotesUrl(appEntry);

  if (explicitUrl) {
    return explicitUrl;
  }

  const repoPath = getGitHubRepoPath(appEntry);

  if (!repoPath || isMirrorRepo(repoPath)) {
    return '';
  }

  const releaseTag = getReleaseTag(appEntry);

  if (releaseTag) {
    return `https://github.com/${repoPath}/releases/tag/${encodeURIComponent(releaseTag)}`;
  }

  return `https://github.com/${repoPath}/releases/latest`;
}

function buildDiscordMessageForChange(change, searchIndex, previewLookup) {
  const appEntry = change.currentEntry;
  const searchEntry = findSearchIndexEntryForApp(change.appId, appEntry, searchIndex);
  const previewUrl = searchEntry ? previewLookup.get(searchEntry.url) : '';
  const releaseNotesUrl = buildReleaseNotesUrl(appEntry);

  if (!previewUrl) {
    return '';
  }

  const rolePrefix = buildRolePrefix();
  const heading = change.type === 'new'
    ? `**${appEntry.name || change.appId}** is now available`
    : `**${appEntry.name || change.appId}** has been updated`;

  const lines = [];

  if (rolePrefix) {
    lines.push(rolePrefix, '');
  }

  lines.push(
    heading,
    '',
    `Version: ${appEntry.version || 'Unknown'}`,
    `Released: ${formatDisplayDate(appEntry.releaseDate)}`,
    '',
    `[**DOWNLOAD**](${previewUrl})`,
  );

  if (releaseNotesUrl) {
    lines.push(`[**RELEASE NOTES**](<${releaseNotesUrl}>)`);
  }

  return lines.join('\n');
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
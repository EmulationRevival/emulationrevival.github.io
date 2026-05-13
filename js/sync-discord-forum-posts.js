try {
  require('dotenv').config();
} catch (error) {
  if (!error || error.code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { execFileSync } = require('child_process');
const { setTimeout: delay } = require('timers/promises');

const SITE_ORIGIN = 'https://emulationrevival.github.io';
const DISCORD_API_ORIGIN = 'https://discord.com/api/v10';
const DEFAULT_STATE_FILE = path.join('json', 'discord-forum-posts.json');
const DEFAULT_MANIFEST_FILE = path.join('json', 'devmode.manifest.json');
const DISCORD_CONTENT_LIMIT = 2000;
const DISCORD_FORUM_TITLE_LIMIT = 100;
const DEFAULT_AUTO_ARCHIVE_DURATION = 10080;
const MAX_DISCORD_ATTEMPTS = 5;
const MIRROR_REPO = 'EmulationRevival/emulationrevival-downloads';

const DATA_FILES = [
  {
    key: 'emulators',
    label: 'Emulators',
    filePath: path.join('_data', 'emulators.yml'),
    channelId: '1504200314964672634',
  },
  {
    key: 'media-apps',
    label: 'Media Apps',
    filePath: path.join('_data', 'media-apps.yml'),
    channelId: '1504200343498653978',
  },
  {
    key: 'ports',
    label: 'Game Ports',
    filePath: path.join('_data', 'ports.yml'),
    channelId: '1504200374716989551',
  },
  {
    key: 'apps',
    label: 'Apps',
    filePath: path.join('_data', 'apps.yml'),
    channelId: '1504200422720798750',
  },
  {
    key: 'frontends',
    label: 'Frontends',
    filePath: path.join('_data', 'frontends.yml'),
    channelId: '1504200450084438097',
  },
  {
    key: 'experimental-apps',
    label: 'Experimental Apps',
    filePath: path.join('_data', 'experimental-apps.yml'),
    channelId: '1504200641151762686',
  },
  {
    key: 'utilities',
    label: 'Utilities',
    filePath: path.join('_data', 'utilities.yml'),
    channelId: '1504200696248143923',
  },
];

function getEnvString(name, fallbackValue = '') {
  const value = process.env[name];

  if (typeof value !== 'string') {
    return fallbackValue;
  }

  const trimmed = value.trim();
  return trimmed || fallbackValue;
}

function getEnvBoolean(name) {
  const value = getEnvString(name).toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function getEnvPositiveInteger(name, fallbackValue) {
  const parsed = Number.parseInt(getEnvString(name), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function normalizeText(value, fallbackValue = '') {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || typeof value === 'undefined') {
    return fallbackValue;
  }

  return String(value).trim();
}

function stripUnsafeDiscordFormatting(value) {
  return normalizeText(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function uniqueNonEmpty(values) {
  const seen = new Set();
  const output = [];

  for (let i = 0; i < values.length; i += 1) {
    const value = normalizeText(values[i]);

    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    output.push(value);
  }

  return output;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function hashValue(value) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(value))
    .digest('hex');
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function absoluteUrl(value) {
  const rawValue = normalizeText(value);

  if (!rawValue) {
    return '';
  }

  try {
    return new URL(rawValue, SITE_ORIGIN).toString();
  } catch {
    return '';
  }
}

function markdownLink(label, url) {
  const cleanLabel = stripUnsafeDiscordFormatting(label);
  const cleanUrl = absoluteUrl(url);

  if (!cleanLabel || !cleanUrl) {
    return '';
  }

  return `[${cleanLabel}](<${cleanUrl}>)`;
}

function formatContributor(contributor) {
  if (!contributor || typeof contributor !== 'object') {
    return '';
  }

  const name = stripUnsafeDiscordFormatting(contributor.name);
  const github = normalizeText(contributor.github);

  if (!name) {
    return '';
  }

  if (isHttpUrl(github)) {
    return `[${name}](<${github}>)`;
  }

  return name;
}

function getFormattedContributors(contributors) {
  return toArray(contributors)
    .map(formatContributor)
    .filter(Boolean);
}

function formatContributorLine(label, contributors) {
  const formatted = getFormattedContributors(contributors);

  if (!formatted.length) {
    return '';
  }

  return `⭐ **${label}:** ${formatted.join(', ')}`;
}

function formatDeveloperLine(contributors) {
  const formatted = getFormattedContributors(contributors);

  if (!formatted.length) {
    return '';
  }

  const label = formatted.length === 1 ? 'Developer' : 'Developers';
  return `⭐ **${label}:** ${formatted.join(', ')}`;
}

function getBulletItems(values) {
  return uniqueNonEmpty(toArray(values).map(stripUnsafeDiscordFormatting));
}

function formatOptionalBulletSection(title, values) {
  const items = getBulletItems(values);

  if (!items.length) {
    return [];
  }

  return [
    `**${title}:**`,
    items.map(item => `- ${item}`).join('\n'),
    '',
  ];
}

function getNestedUrl(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && typeof value.url === 'string') {
    return value.url;
  }

  return '';
}

function getSourceCodeUrl(product, manifestEntry) {
  const directValues = [
    product?.source_code_url,
    product?.sourceCodeUrl,
    product?.source_code,
    product?.sourceCode,
  ];

  for (let i = 0; i < directValues.length; i += 1) {
    const value = normalizeText(directValues[i]);

    if (isHttpUrl(value)) {
      return value;
    }
  }

  const repo = normalizeText(manifestEntry?.repo);

  if (!repo || repo === MIRROR_REPO || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    return '';
  }

  return `https://github.com/${repo}`;
}

function buildLinksSection(product, manifestEntry) {
  const rows = [];
  const previewUrl = absoluteUrl(product.preview_url);
  const sourceCodeUrl = getSourceCodeUrl(product, manifestEntry);
  const setupGuideUrl = getNestedUrl(product.setup_guide);
  const tutorialUrl = normalizeText(product.tutorial_url);

  rows.push(`- ⬇️ [**Download**](<${previewUrl || SITE_ORIGIN}>)`);

  if (sourceCodeUrl) {
    rows.push(`- 🔗 [**Source Code**](<${sourceCodeUrl}>)`);
  }

  if (setupGuideUrl) {
    const setupGuideLink = markdownLink('**Setup Guide**', setupGuideUrl);
    if (setupGuideLink) {
      rows.push(`- 📖 ${setupGuideLink}`);
    }
  }

  if (isHttpUrl(tutorialUrl)) {
    rows.push(`- 🎥 [**YouTube Tutorial**](<${tutorialUrl}>)`);
  }

  rows.push('- ❓ [**Support**](<https://discord.com/channels/1024833470020722760/1104148545688326195>)');

  return rows.join('\n');
}

function buildProductContent(product, manifestEntry) {
  const contributors = product.contributors && typeof product.contributors === 'object'
    ? product.contributors
    : {};

  const title = stripUnsafeDiscordFormatting(product.title || product.name || product.id || product.app_id || 'Untitled');
  const description = stripUnsafeDiscordFormatting(product.description);
  const compatibility = stripUnsafeDiscordFormatting(product.compatibility);
  const creditLines = [
    formatDeveloperLine(contributors.developers),
    formatContributorLine('UWP Port by', contributors.porters),
    formatContributorLine('Maintained by', contributors.maintainers),
  ].filter(Boolean);
  const creditsSection = creditLines.length
    ? [
      '**Credits:**',
      ...creditLines,
      '',
    ]
    : [];
  const descriptionSection = description
    ? [
      description,
      '',
    ]
    : [];
  const compatibilitySection = compatibility
    ? [
      `**Compatibility:** ${compatibility}`,
      '',
    ]
    : [];
  const requirementsSection = formatOptionalBulletSection('Requirements', product.requirements);
  const featureSection = formatOptionalBulletSection('Features', product.features);
  const links = buildLinksSection(product, manifestEntry);

  return [
    `## ${title}`,
    '',
    ...creditsSection,
    ...descriptionSection,
    ...compatibilitySection,
    ...requirementsSection,
    ...featureSection,
    '🔗 **Links**',
    links,
  ].join('\n');
}

function truncateDiscordContent(content, product) {
  if (content.length <= DISCORD_CONTENT_LIMIT) {
    return content;
  }

  const title = stripUnsafeDiscordFormatting(product.title || product.name || product.id || product.app_id || 'Untitled');
  const previewUrl = absoluteUrl(product.preview_url);
  const description = stripUnsafeDiscordFormatting(product.description);
  const fallbackContent = [
    `## ${title}`,
    '',
    ...(description ? [description, ''] : []),
    '**Full details exceeded Discord’s 2000 character message limit.**',
    '',
    '🔗 **Links**',
    `- ⬇️ [**Download**](<${previewUrl || SITE_ORIGIN}>)`,
    '- ❓ [**Support**](<https://discord.com/channels/1024833470020722760/1104148545688326195>)',
  ].join('\n');

  if (fallbackContent.length <= DISCORD_CONTENT_LIMIT) {
    return fallbackContent;
  }

  return `${fallbackContent.slice(0, DISCORD_CONTENT_LIMIT - 1)}…`;
}

function buildForumTitle(product) {
  const title = stripUnsafeDiscordFormatting(product.title || product.name || product.id || product.app_id || 'Untitled');

  if (title.length <= DISCORD_FORUM_TITLE_LIMIT) {
    return title;
  }

  return title.slice(0, DISCORD_FORUM_TITLE_LIMIT - 1).trimEnd();
}

function getProductKey(source, product) {
  const id = normalizeText(product.id || product.app_id || product.title || product.name);

  if (!id) {
    return '';
  }

  return `${source.key}:${id}`;
}

function normalizeRegistryEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const threadId = normalizeText(entry.threadId);
  const messageId = normalizeText(entry.messageId);
  const channelId = normalizeText(entry.channelId);
  const contentHash = normalizeText(entry.contentHash);

  if (!threadId || !messageId || !channelId) {
    return null;
  }

  return {
    ...entry,
    threadId,
    messageId,
    channelId,
    contentHash,
  };
}

async function readJsonFile(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return fallbackValue;
    }

    throw error;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const tempPath = `${filePath}.tmp`;
  const content = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

function loadYamlWithJsYaml(raw) {
  try {
    const yaml = require('js-yaml');
    return yaml.load(raw);
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && String(error.message || '').includes('js-yaml')) {
      return null;
    }

    throw error;
  }
}

function loadYamlWithRuby(filePath) {
  const script = [
    'data = YAML.safe_load_file(ARGV.fetch(0), permitted_classes: [Date, Time, Symbol], aliases: true)',
    'puts JSON.generate(data)',
  ].join('; ');

  const output = execFileSync('ruby', ['-ryaml', '-rjson', '-rdate', '-e', script, filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(output);
}

async function readYamlFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const jsYamlResult = loadYamlWithJsYaml(raw);

  if (jsYamlResult !== null) {
    return jsYamlResult;
  }

  return loadYamlWithRuby(filePath);
}

async function loadProducts() {
  const products = [];

  for (let i = 0; i < DATA_FILES.length; i += 1) {
    const source = DATA_FILES[i];
    const data = await readYamlFile(source.filePath);

    if (!Array.isArray(data)) {
      throw new Error(`${source.filePath} must contain a YAML array.`);
    }

    for (let itemIndex = 0; itemIndex < data.length; itemIndex += 1) {
      const product = data[itemIndex];

      if (!product || typeof product !== 'object') {
        continue;
      }

      const key = getProductKey(source, product);

      if (!key) {
        console.log(`Skipped item ${itemIndex + 1} in ${source.filePath}: missing id/app_id/title.`);
        continue;
      }

      products.push({
        key,
        source,
        product,
      });
    }
  }

  return products;
}

async function discordApiRequest(method, endpoint, body, token) {
  const url = `${DISCORD_API_ORIGIN}${endpoint}`;
  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'EmulationRevivalForumSync/1.0',
  };

  for (let attempt = 1; attempt <= MAX_DISCORD_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let responseJson = null;

    if (responseText) {
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        responseJson = null;
      }
    }

    if (response.status === 429 && attempt < MAX_DISCORD_ATTEMPTS) {
      const retryAfterBody = Number(responseJson?.retry_after);
      const retryAfterHeader = Number(response.headers.get('retry-after'));
      const retryAfterSeconds = Number.isFinite(retryAfterBody) && retryAfterBody > 0
        ? retryAfterBody
        : retryAfterHeader;
      const retryDelayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? Math.ceil(retryAfterSeconds * 1000) + 250
        : 1500;

      await delay(retryDelayMs);
      continue;
    }

    if (!response.ok) {
      const details = responseText || response.statusText || 'No response body.';
      throw new Error(`${method} ${endpoint} failed with ${response.status}: ${details}`);
    }

    return responseJson;
  }

  throw new Error(`${method} ${endpoint} failed after ${MAX_DISCORD_ATTEMPTS} attempts.`);
}

async function createForumPost(token, channelId, title, content, autoArchiveDuration) {
  const response = await discordApiRequest('POST', `/channels/${channelId}/threads`, {
    name: title,
    auto_archive_duration: autoArchiveDuration,
    message: {
      content,
      allowed_mentions: {
        parse: [],
      },
    },
  }, token);

  const threadId = normalizeText(response?.id);
  const messageId = normalizeText(response?.message?.id);

  if (!threadId || !messageId) {
    throw new Error(`Discord did not return a usable thread/message id for '${title}'.`);
  }

  return {
    threadId,
    messageId,
  };
}

async function unarchiveThread(token, threadId) {
  try {
    await discordApiRequest('PATCH', `/channels/${threadId}`, {
      archived: false,
    }, token);
  } catch (error) {
    console.log(`Could not unarchive thread ${threadId}: ${error.message}`);
  }
}

async function editForumPost(token, threadId, messageId, content) {
  await unarchiveThread(token, threadId);

  await discordApiRequest('PATCH', `/channels/${threadId}/messages/${messageId}`, {
    content,
    allowed_mentions: {
      parse: [],
    },
  }, token);
}

async function syncProduct({ token, registry, manifest, item, autoArchiveDuration, dryRun }) {
  const { key, source, product } = item;
  const manifestEntry = manifest[normalizeText(product.app_id)] || manifest[normalizeText(product.id)] || null;
  const rawContent = buildProductContent(product, manifestEntry);
  const content = truncateDiscordContent(rawContent, product);
  const contentHash = hashValue({
    channelId: source.channelId,
    title: buildForumTitle(product),
    content,
  });
  const existing = normalizeRegistryEntry(registry.posts[key]);

  if (existing && existing.contentHash === contentHash && existing.channelId === source.channelId) {
    console.log(`Unchanged: ${key}`);
    return false;
  }

  if (existing && existing.channelId !== source.channelId) {
    console.log(`Channel changed for ${key}. Creating a new forum post in ${source.label}; old thread remains ${existing.threadId}.`);
  }

  if (!existing || existing.channelId !== source.channelId) {
    if (dryRun) {
      console.log(`Would create: ${key} -> ${source.label}`);
      return false;
    }

    const created = await createForumPost(
      token,
      source.channelId,
      buildForumTitle(product),
      content,
      autoArchiveDuration
    );

    registry.posts[key] = {
      key,
      productId: normalizeText(product.id),
      appId: normalizeText(product.app_id),
      title: normalizeText(product.title || product.name),
      source: source.key,
      sourceLabel: source.label,
      channelId: source.channelId,
      threadId: created.threadId,
      messageId: created.messageId,
      contentHash,
      updatedAt: new Date().toISOString(),
    };

    console.log(`Created: ${key} -> thread ${created.threadId}`);
    return true;
  }

  if (dryRun) {
    console.log(`Would edit: ${key} -> thread ${existing.threadId}`);
    return false;
  }

  await editForumPost(token, existing.threadId, existing.messageId, content);

  registry.posts[key] = {
    ...existing,
    key,
    productId: normalizeText(product.id),
    appId: normalizeText(product.app_id),
    title: normalizeText(product.title || product.name),
    source: source.key,
    sourceLabel: source.label,
    channelId: source.channelId,
    contentHash,
    updatedAt: new Date().toISOString(),
  };

  console.log(`Edited: ${key} -> thread ${existing.threadId}`);
  return true;
}

function createInitialRegistry(existingRegistry) {
  const posts = existingRegistry && typeof existingRegistry.posts === 'object' && existingRegistry.posts
    ? existingRegistry.posts
    : {};

  return {
    schemaVersion: 1,
    updatedAt: normalizeText(existingRegistry?.updatedAt) || new Date().toISOString(),
    posts,
  };
}

async function main() {
  const token = getEnvString('DISCORD_BOT_TOKEN');
  const stateFile = getEnvString('DISCORD_FORUM_POSTS_STATE_PATH', DEFAULT_STATE_FILE);
  const manifestFile = getEnvString('DISCORD_MANIFEST_PATH', DEFAULT_MANIFEST_FILE);
  const autoArchiveDuration = getEnvPositiveInteger('DISCORD_FORUM_AUTO_ARCHIVE_DURATION', DEFAULT_AUTO_ARCHIVE_DURATION);
  const dryRun = getEnvBoolean('DRY_RUN');

  if (!token && !dryRun) {
    throw new Error('Missing DISCORD_BOT_TOKEN environment variable.');
  }

  const [existingRegistry, manifest, products] = await Promise.all([
    readJsonFile(stateFile, {}),
    readJsonFile(manifestFile, {}),
    loadProducts(),
  ]);

  const registry = createInitialRegistry(existingRegistry);
  const currentKeys = new Set(products.map(item => item.key));
  let changedCount = 0;

  for (let i = 0; i < products.length; i += 1) {
    const changed = await syncProduct({
      token,
      registry,
      manifest,
      item: products[i],
      autoArchiveDuration,
      dryRun,
    });

    if (changed) {
      changedCount += 1;
    }
  }

  for (const key of Object.keys(registry.posts)) {
    if (!currentKeys.has(key)) {
      registry.posts[key] = {
        ...registry.posts[key],
        missingFromYaml: true,
        missingCheckedAt: new Date().toISOString(),
      };
      console.log(`Missing from current YAML, registry retained: ${key}`);
    }
  }

  if (!dryRun && changedCount > 0) {
    registry.updatedAt = new Date().toISOString();
    await writeJsonFile(stateFile, registry);
  }

  if (dryRun) {
    console.log('Dry run complete. No Discord posts were created or edited and no registry was written.');
    return;
  }

  console.log(`Discord forum sync complete. Changed posts: ${changedCount}. Registry: ${stateFile}`);
}

main().catch(error => {
  console.error('Error syncing Discord forum posts:', error);
  process.exitCode = 1;
});

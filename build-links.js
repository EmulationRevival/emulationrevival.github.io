require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { setTimeout: delay } = require('timers/promises');

const GITHUB_PAT = process.env.GITHUB_PAT;
const MANIFEST_FILE = path.join('json', 'devmode.manifest.json');
const OUTPUT_DIR = 'json';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'app-links.json');
const VERSION_FILE = path.join(OUTPUT_DIR, 'version.json');

const FETCH_TIMEOUT_MS = 15000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;
const RELEASES_PER_PAGE = 100;
const MIRROR_REPO = 'EmulationRevival/emulationrevival-downloads';

const FAILURE_TYPES = {
    FETCH: 'fetch-failure',
    NO_RELEASES: 'no-releases',
    RELEASE_FILTER: 'release-filter-miss',
    ASSET_MISS: 'asset-miss',
    PARTIAL_ASSET_MISS: 'partial-asset-miss',
    VERSION_URL_CHECK: 'versioned-url-check-failure',
    STATIC_URL_CHECK: 'static-url-check-failure',
    VALIDATION: 'validation-failure',
    WRITE: 'write-failure'
};

function nameMatchesPattern(assetName, pattern) {
    if (typeof assetName !== 'string' || !assetName || typeof pattern !== 'string' || !pattern) {
        return false;
    }

    const regex = new RegExp(
        `^${pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*')}$`,
        'i'
    );

    return regex.test(assetName);
}

function normalizeVersion(version) {
    if (typeof version !== 'string') {
        return 'Unknown';
    }

    return version.trim().replace(/^v/i, '') || 'Unknown';
}

function isSemanticVersion(value) {
    return /^\d+(?:\.\d+)+$/.test(normalizeVersion(value));
}

function getReleaseDate(release) {
    if (release && typeof release.published_at === 'string') {
        return release.published_at.split('T')[0];
    }

    if (release && typeof release.created_at === 'string') {
        return release.created_at.split('T')[0];
    }

    return 'Unknown';
}

function buildVersionedStaticUrl(assetConfig, releaseVersion) {
    const normalizedVersion = normalizeVersion(releaseVersion);

    if (!assetConfig || typeof assetConfig.urlTemplate !== 'string' || !assetConfig.urlTemplate) {
        return null;
    }

    const versionUnderscored = normalizedVersion.replace(/\./g, '_');
    const versionDashed = normalizedVersion.replace(/\./g, '-');

    return assetConfig.urlTemplate
        .replace(/\{version\}/g, normalizedVersion)
        .replace(/\{version_underscored\}/g, versionUnderscored)
        .replace(/\{version_dashed\}/g, versionDashed);
}

function cloneAssets(assets) {
    if (!Array.isArray(assets)) {
        return [];
    }

    return assets.map(asset => ({ ...asset }));
}

function stableStringify(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function readJsonFile(filePath, fallbackValue) {
    if (!fs.existsSync(filePath)) {
        return fallbackValue;
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeFileAtomic(filePath, content) {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, content);
    fs.renameSync(tempPath, filePath);
}

function isRetryableStatus(status) {
    return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

function isRetryableError(error) {
    if (!error || typeof error !== 'object') {
        return false;
    }

    if (error.name === 'AbortError') {
        return true;
    }

    const retryableCodes = new Set([
        'ECONNRESET',
        'ECONNREFUSED',
        'EAI_AGAIN',
        'ENOTFOUND',
        'ETIMEDOUT',
        'ECONNABORTED',
        'EHOSTUNREACH',
        'UND_ERR_CONNECT_TIMEOUT',
        'UND_ERR_HEADERS_TIMEOUT',
        'UND_ERR_BODY_TIMEOUT'
    ]);

    return retryableCodes.has(error.code);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }
}

async function fetchWithRetry(url, options = {}, retryAttempts = RETRY_ATTEMPTS) {
    let lastError = null;

    for (let attempt = 0; attempt <= retryAttempts; attempt += 1) {
        try {
            const response = await fetchWithTimeout(url, options);

            if (attempt < retryAttempts && isRetryableStatus(response.status)) {
                await delay(RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            return response;
        } catch (error) {
            lastError = error;

            if (attempt >= retryAttempts || !isRetryableError(error)) {
                throw error;
            }

            await delay(RETRY_DELAY_MS * (attempt + 1));
        }
    }

    throw lastError || new Error('Request failed after retries.');
}

async function urlExists(url) {
    try {
        let response = await fetchWithRetry(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        if (response.ok) {
            return true;
        }

        if (response.status === 405 || response.status === 403) {
            response = await fetchWithRetry(url, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    Range: 'bytes=0-0'
                }
            });

            return response.ok;
        }

        return false;
    } catch (error) {
        return false;
    }
}

function getReleaseTextSources(release) {
    return [
        { source: 'tag', value: typeof release?.tag_name === 'string' ? release.tag_name : '' },
        { source: 'name', value: typeof release?.name === 'string' ? release.name : '' }
    ].filter(item => item.value);
}

function extractRegexVersionCandidate(text, regexString) {
    if (typeof text !== 'string' || !text || typeof regexString !== 'string' || !regexString) {
        return null;
    }

    const regex = new RegExp(regexString);
    const match = text.match(regex);

    if (!match) {
        return null;
    }

    if (match[1]) {
        return match[1];
    }

    return match[0] || null;
}

function getDefaultVersionCandidates(text) {
    if (typeof text !== 'string' || !text) {
        return [];
    }

    const patterns = [
        /(?<![\d.])v?(\d+\.\d+\.\d+\.\d+)(?!\d)/gi,
        /(?<![\d.])v?(\d+\.\d+\.\d+)(?!\d)/gi,
        /(?<![\d.])v?(\d+\.\d+)(?!\d)/gi
    ];

    const seen = new Set();
    const results = [];

    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);

        for (const match of matches) {
            const candidate = match[1] || match[0];
            const normalized = normalizeVersion(candidate);

            if (!normalized || normalized === 'Unknown' || seen.has(normalized)) {
                continue;
            }

            seen.add(normalized);
            results.push(normalized);
        }
    }

    return results;
}

function scoreVersionCandidate(candidate, source, text) {
    if (typeof candidate !== 'string' || !candidate) {
        return -Infinity;
    }

    let score = 0;
    const normalized = normalizeVersion(candidate);
    const segments = normalized.split('.').filter(Boolean).length;

    if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) {
        score += 140;
    } else if (/^\d+\.\d+\.\d+$/.test(normalized)) {
        score += 120;
    } else if (/^\d+\.\d+$/.test(normalized)) {
        score += 90;
    }

    score += segments * 10;

    if (source === 'primary-asset') {
        score += 90;
    } else if (source === 'asset') {
        score += 60;
    } else if (source === 'name') {
        score += 25;
    } else if (source === 'tag') {
        score += 10;
    }

    if (typeof text === 'string') {
        if (new RegExp(`(?<![\\d.])v?${normalized.replace(/\./g, '\\.')}(?!\\d)`, 'i').test(text)) {
            score += 10;
        }

        if (/version|release|build|uwp|xbox/i.test(text)) {
            score += 5;
        }

        if (/alpha|beta|rc|preview|nightly/i.test(text)) {
            score -= 3;
        }
    }

    return score;
}

function compareSemanticVersions(a, b) {
    const aNormalized = normalizeVersion(a);
    const bNormalized = normalizeVersion(b);

    const aIsVersion = /^\d+(?:\.\d+)+$/.test(aNormalized);
    const bIsVersion = /^\d+(?:\.\d+)+$/.test(bNormalized);

    if (aIsVersion && bIsVersion) {
        const aParts = aNormalized.split('.').map(Number);
        const bParts = bNormalized.split('.').map(Number);
        const maxLength = Math.max(aParts.length, bParts.length);

        for (let i = 0; i < maxLength; i += 1) {
            const aValue = Number.isFinite(aParts[i]) ? aParts[i] : 0;
            const bValue = Number.isFinite(bParts[i]) ? bParts[i] : 0;

            if (aValue !== bValue) {
                return aValue - bValue;
            }
        }

        return 0;
    }

    return aNormalized.localeCompare(bNormalized, undefined, { numeric: true, sensitivity: 'base' });
}

function getSmartAutoVersion(release) {
    const sources = getReleaseTextSources(release);
    const candidates = [];

    for (const sourceEntry of sources) {
        const sourceCandidates = getDefaultVersionCandidates(sourceEntry.value);

        for (const candidate of sourceCandidates) {
            candidates.push({
                value: candidate,
                source: sourceEntry.source,
                score: scoreVersionCandidate(candidate, sourceEntry.source, sourceEntry.value)
            });
        }
    }

    if (!candidates.length) {
        return null;
    }

    candidates.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        const versionCompare = compareSemanticVersions(b.value, a.value);
        if (versionCompare !== 0) {
            return versionCompare;
        }

        return b.value.length - a.value.length;
    });

    return candidates[0].value || null;
}

function getReleaseAssets(release) {
    return Array.isArray(release?.assets) ? release.assets : [];
}

function getGithubManifestAssets(config) {
    if (!Array.isArray(config?.assets)) {
        return [];
    }

    return config.assets.filter(assetConfig =>
        assetConfig
        && typeof assetConfig === 'object'
        && assetConfig.sourceType === 'github'
        && typeof assetConfig.assetPattern === 'string'
        && assetConfig.assetPattern.trim()
    );
}

function getStaticManifestAssets(config) {
    if (!Array.isArray(config?.assets)) {
        return [];
    }

    return config.assets.filter(assetConfig =>
        assetConfig
        && typeof assetConfig === 'object'
        && assetConfig.sourceType === 'static'
        && typeof assetConfig.url === 'string'
        && assetConfig.url.trim()
    );
}

function getMatchedAssetsForRelease(release, config) {
    const releaseAssets = getReleaseAssets(release);
    const manifestAssets = getGithubManifestAssets(config);

    return manifestAssets.map((assetConfig, index) => {
        const matchedAsset = releaseAssets.find(asset =>
            nameMatchesPattern(asset?.name, assetConfig?.assetPattern)
        );

        return {
            index,
            assetConfig,
            matchedAsset: matchedAsset || null,
            isPrimary: index === 0
        };
    });
}

function extractVersionCandidatesFromAssetName(assetName, config, sourceLabel) {
    if (typeof assetName !== 'string' || !assetName) {
        return [];
    }

    const candidates = [];

    if (typeof config?.versionRegex === 'string' && config.versionRegex.trim()) {
        const regexCandidate = extractRegexVersionCandidate(assetName, config.versionRegex);
        if (regexCandidate) {
            const normalized = normalizeVersion(regexCandidate);
            candidates.push({
                value: normalized,
                source: sourceLabel,
                score: scoreVersionCandidate(normalized, sourceLabel, assetName) + 50
            });
        }
    }

    const defaultCandidates = getDefaultVersionCandidates(assetName);
    for (const candidate of defaultCandidates) {
        candidates.push({
            value: candidate,
            source: sourceLabel,
            score: scoreVersionCandidate(candidate, sourceLabel, assetName)
        });
    }

    return candidates;
}

function extractVersionFromMatchedAssets(release, config) {
    const matchedEntries = getMatchedAssetsForRelease(release, config);
    if (!matchedEntries.length) {
        return null;
    }

    const candidates = [];

    const primaryMatch = matchedEntries.find(entry => entry.isPrimary && entry.matchedAsset);
    if (primaryMatch && typeof primaryMatch.matchedAsset.name === 'string') {
        candidates.push(
            ...extractVersionCandidatesFromAssetName(
                primaryMatch.matchedAsset.name,
                config,
                'primary-asset'
            )
        );
    }

    for (const entry of matchedEntries) {
        if (!entry.matchedAsset || entry.isPrimary || typeof entry.matchedAsset.name !== 'string') {
            continue;
        }

        candidates.push(
            ...extractVersionCandidatesFromAssetName(
                entry.matchedAsset.name,
                config,
                'asset'
            )
        );
    }

    if (!candidates.length) {
        return null;
    }

    candidates.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        const versionCompare = compareSemanticVersions(b.value, a.value);
        if (versionCompare !== 0) {
            return versionCompare;
        }

        return b.value.length - a.value.length;
    });

    return candidates[0].value || null;
}

function extractDisplayVersion(release, config) {
    const versionSource = config.versionSource || 'auto';
    const sources = getReleaseTextSources(release);

    if (versionSource === 'auto') {
        const assetCandidate = extractVersionFromMatchedAssets(release, config);
        if (assetCandidate) {
            return assetCandidate;
        }
    }

    if (typeof config.versionRegex === 'string' && config.versionRegex.trim()) {
        if (versionSource === 'tag') {
            const candidate = extractRegexVersionCandidate(release.tag_name || '', config.versionRegex);
            return normalizeVersion(candidate || release.tag_name || release.name || 'Unknown');
        }

        if (versionSource === 'name') {
            const candidate = extractRegexVersionCandidate(release.name || '', config.versionRegex);
            return normalizeVersion(candidate || release.name || release.tag_name || 'Unknown');
        }

        const regexCandidates = [];

        for (const sourceEntry of sources) {
            const candidate = extractRegexVersionCandidate(sourceEntry.value, config.versionRegex);

            if (candidate) {
                const normalized = normalizeVersion(candidate);
                regexCandidates.push({
                    value: normalized,
                    source: sourceEntry.source,
                    score: scoreVersionCandidate(normalized, sourceEntry.source, sourceEntry.value) + 50
                });
            }
        }

        if (regexCandidates.length) {
            regexCandidates.sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }

                const versionCompare = compareSemanticVersions(b.value, a.value);
                if (versionCompare !== 0) {
                    return versionCompare;
                }

                return b.value.length - a.value.length;
            });

            return regexCandidates[0].value;
        }
    }

    if (versionSource === 'tag') {
        return normalizeVersion(release.tag_name || release.name || 'Unknown');
    }

    if (versionSource === 'name') {
        return normalizeVersion(release.name || release.tag_name || 'Unknown');
    }

    const smartCandidate = getSmartAutoVersion(release);
    if (smartCandidate) {
        return smartCandidate;
    }

    return normalizeVersion(release.tag_name || release.name || 'Unknown');
}

function resolveReleaseDate(config, resolvedVersion, release) {
    const overrideDate = config.releaseDateOverrides?.[resolvedVersion];
    if (typeof overrideDate === 'string' && overrideDate.trim()) {
        return overrideDate;
    }

    return getReleaseDate(release);
}

function resolveFirstReleaseDate(config, resolvedVersion, release) {
    const overrideDate = config.firstReleaseDateOverrides?.[resolvedVersion];
    if (typeof overrideDate === 'string' && overrideDate.trim()) {
        return overrideDate;
    }

    return getReleaseDate(release);
}

function shouldApplyReleaseTagRegex(config) {
    return config?.repo === MIRROR_REPO
        && typeof config.releaseTagRegex === 'string'
        && config.releaseTagRegex.trim().length > 0;
}

function filterReleases(allReleases, config) {
    const allowPrerelease = config.allowPrerelease === true;
    const releaseTagRegex = shouldApplyReleaseTagRegex(config)
        ? new RegExp(config.releaseTagRegex)
        : null;

    let filtered = Array.isArray(allReleases) ? [...allReleases] : [];

    if (!allowPrerelease) {
        filtered = filtered.filter(release => !release.prerelease);
    }

    if (releaseTagRegex) {
        filtered = filtered.filter(release => {
            const tag = release.tag_name || '';
            const name = release.name || '';
            return releaseTagRegex.test(tag) || releaseTagRegex.test(name);
        });
    }

    return filtered;
}

function decorateFilteredReleases(filteredReleases, config) {
    return filteredReleases.map(release => {
        const matchedAssets = getMatchedAssetsForRelease(release, config);
        const matchedAssetsCount = matchedAssets.filter(entry => entry.matchedAsset).length;
        const matchedPrimaryAsset = matchedAssets.find(entry => entry.isPrimary && entry.matchedAsset) || null;
        const hasPrimaryAsset = Boolean(matchedPrimaryAsset);
        const publishedAt = typeof release?.published_at === 'string'
            ? Date.parse(release.published_at)
            : NaN;
        const createdAt = typeof release?.created_at === 'string'
            ? Date.parse(release.created_at)
            : NaN;
        const dateValue = Number.isFinite(publishedAt)
            ? publishedAt
            : (Number.isFinite(createdAt) ? createdAt : 0);

        const resolvedVersion = extractDisplayVersion(release, config) || 'Unknown';

        return {
            release,
            resolvedVersion,
            dateValue,
            isSemanticVersion: isSemanticVersion(resolvedVersion),
            matchedAssets,
            matchedAssetsCount,
            hasPrimaryAsset,
            matchedAllAssets: matchedAssets.length > 0 && matchedAssetsCount === matchedAssets.length
        };
    });
}

function chooseBestDecoratedRelease(decoratedReleases, config) {
    if (!Array.isArray(decoratedReleases) || !decoratedReleases.length) {
        return null;
    }

    const candidatesWithPrimary = decoratedReleases.filter(entry => entry.hasPrimaryAsset);
    const candidates = candidatesWithPrimary.length ? candidatesWithPrimary : decoratedReleases;
    const useMirrorSorting = config?.repo === MIRROR_REPO;

    const sorted = [...candidates].sort((a, b) => {
        if (b.matchedAssetsCount !== a.matchedAssetsCount) {
            return b.matchedAssetsCount - a.matchedAssetsCount;
        }

        if (a.hasPrimaryAsset !== b.hasPrimaryAsset) {
            return a.hasPrimaryAsset ? -1 : 1;
        }

        if (a.matchedAllAssets !== b.matchedAllAssets) {
            return a.matchedAllAssets ? -1 : 1;
        }

        if (useMirrorSorting && a.isSemanticVersion && b.isSemanticVersion) {
            const semanticCompare = compareSemanticVersions(b.resolvedVersion, a.resolvedVersion);
            if (semanticCompare !== 0) {
                return semanticCompare;
            }

            return b.dateValue - a.dateValue;
        }

        if (b.dateValue !== a.dateValue) {
            return b.dateValue - a.dateValue;
        }

        if (a.isSemanticVersion && b.isSemanticVersion) {
            return compareSemanticVersions(b.resolvedVersion, a.resolvedVersion);
        }

        if (a.isSemanticVersion !== b.isSemanticVersion) {
            return a.isSemanticVersion ? -1 : 1;
        }

        return String(b.resolvedVersion).localeCompare(String(a.resolvedVersion), undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    });

    return sorted[0];
}

function chooseFirstDecoratedRelease(decoratedReleases) {
    if (!Array.isArray(decoratedReleases) || !decoratedReleases.length) {
        return null;
    }

    const sorted = [...decoratedReleases].sort((a, b) => {
        if (a.dateValue !== b.dateValue) {
            return a.dateValue - b.dateValue;
        }

        if (a.isSemanticVersion && b.isSemanticVersion) {
            return compareSemanticVersions(a.resolvedVersion, b.resolvedVersion);
        }

        if (a.isSemanticVersion !== b.isSemanticVersion) {
            return a.isSemanticVersion ? -1 : 1;
        }

        return String(a.resolvedVersion).localeCompare(String(b.resolvedVersion), undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    });

    return sorted[0];
}

async function fetchAllReleases(repo, headers) {
    let page = 1;
    const allReleases = [];

    while (true) {
        const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=${RELEASES_PER_PAGE}&page=${page}`;

        let response;

        try {
            response = await fetchWithRetry(apiUrl, { headers });
        } catch (error) {
            error.failureType = FAILURE_TYPES.FETCH;
            throw error;
        }

        if (!response.ok) {
            const error = new Error(`API request failed: ${response.status}`);
            error.failureType = FAILURE_TYPES.FETCH;
            error.status = response.status;
            throw error;
        }

        const pageReleases = await response.json();

        if (!Array.isArray(pageReleases)) {
            const error = new Error('Invalid releases response.');
            error.failureType = FAILURE_TYPES.FETCH;
            throw error;
        }

        allReleases.push(...pageReleases);

        if (pageReleases.length < RELEASES_PER_PAGE) {
            break;
        }

        page += 1;
    }

    return allReleases;
}

async function fetchMatchingReleaseData(repo, config, headers, releaseCache, summary) {
    const cacheKey = JSON.stringify({
        repo,
        allowPrerelease: config.allowPrerelease === true,
        applyReleaseTagRegex: shouldApplyReleaseTagRegex(config),
        releaseTagRegex: shouldApplyReleaseTagRegex(config) ? config.releaseTagRegex : '',
        versionSource: config.versionSource || 'auto',
        versionRegex: config.versionRegex || '',
        githubAssetPatterns: getGithubManifestAssets(config).map(asset => asset.assetPattern || '')
    });

    if (releaseCache.has(cacheKey)) {
        const cachedReleaseData = releaseCache.get(cacheKey);

        if (cachedReleaseData) {
            console.log(`  - Using cached release data for '${repo}'`);
            summary.cachedRepoHits += 1;
        }

        return cachedReleaseData;
    }

    const allReleases = await fetchAllReleases(repo, headers);

    if (!allReleases.length) {
        const error = new Error('No releases found.');
        error.failureType = FAILURE_TYPES.NO_RELEASES;
        throw error;
    }

    const filteredReleases = filterReleases(allReleases, config);

    if (!filteredReleases.length) {
        const error = new Error('No releases matched configured filters.');
        error.failureType = FAILURE_TYPES.RELEASE_FILTER;
        throw error;
    }

    const decoratedReleases = decorateFilteredReleases(filteredReleases, config);
    const bestReleaseData = chooseBestDecoratedRelease(decoratedReleases, config);
    const firstReleaseData = chooseFirstDecoratedRelease(decoratedReleases);

    if (!bestReleaseData || !firstReleaseData) {
        const error = new Error('Could not determine matching release history.');
        error.failureType = FAILURE_TYPES.RELEASE_FILTER;
        throw error;
    }

    const releaseData = {
        bestRelease: bestReleaseData.release,
        bestVersion: bestReleaseData.resolvedVersion,
        firstRelease: firstReleaseData.release,
        firstVersion: firstReleaseData.resolvedVersion
    };

    releaseCache.set(cacheKey, releaseData);

    return releaseData;
}

function getFallbackEntry(appId, config, previousOutput) {
    const previousEntry = previousOutput[appId];

    if (previousEntry) {
        return {
            name: previousEntry.name || config.name,
            version: previousEntry.version || config.version || 'Unknown',
            releaseDate: previousEntry.releaseDate || config.releaseDate || 'Unknown',
            firstReleaseDate: previousEntry.firstReleaseDate || previousEntry.releaseDate || config.firstReleaseDate || config.releaseDate || 'Unknown',
            assets: cloneAssets(previousEntry.assets)
        };
    }

    return {
        name: config.name,
        version: config.version || 'Unknown',
        releaseDate: config.releaseDate || 'Unknown',
        firstReleaseDate: config.firstReleaseDate || config.releaseDate || 'Unknown',
        assets: []
    };
}

function applyFallbackEntry(appId, config, finalJsonOutput, previousOutput, message) {
    const fallback = getFallbackEntry(appId, config, previousOutput);

    finalJsonOutput[appId] = {
        name: fallback.name,
        version: fallback.version,
        releaseDate: fallback.releaseDate,
        firstReleaseDate: fallback.firstReleaseDate,
        assets: fallback.assets
    };

    console.warn(message);
}

function validateAssetConfig(appId, assetConfig, assetIds) {
    if (!assetConfig || typeof assetConfig !== 'object' || Array.isArray(assetConfig)) {
        throwValidationError(`App '${appId}' has an invalid asset entry.`);
    }

    if (typeof assetConfig.id !== 'string' || !assetConfig.id.trim()) {
        throwValidationError(`App '${appId}' has an asset missing a valid id.`);
    }

    if (assetIds.has(assetConfig.id)) {
        throwValidationError(`App '${appId}' has duplicate asset id '${assetConfig.id}'.`);
    }

    assetIds.add(assetConfig.id);
}

function throwValidationError(message) {
    const error = new Error(message);
    error.failureType = FAILURE_TYPES.VALIDATION;
    throw error;
}

function validateDateOverrideMap(appId, fieldName, overrideMap) {
    if (overrideMap === undefined) {
        return;
    }

    if (!overrideMap || typeof overrideMap !== 'object' || Array.isArray(overrideMap)) {
        throwValidationError(`App '${appId}' has invalid ${fieldName}.`);
    }

    for (const [version, date] of Object.entries(overrideMap)) {
        if (typeof version !== 'string' || !version.trim()) {
            throwValidationError(`App '${appId}' has an invalid ${fieldName} key.`);
        }

        if (typeof date !== 'string' || !date.trim()) {
            throwValidationError(`App '${appId}' has an invalid ${fieldName} date for version '${version}'.`);
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throwValidationError(`App '${appId}' has a non-ISO ${fieldName} date for version '${version}'.`);
        }
    }
}

function validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        throwValidationError('Manifest root must be an object.');
    }

    for (const [appId, config] of Object.entries(manifest)) {
        if (!config || typeof config !== 'object' || Array.isArray(config)) {
            throwValidationError(`App '${appId}' must be an object.`);
        }

        if (typeof config.name !== 'string' || !config.name.trim()) {
            throwValidationError(`App '${appId}' is missing a valid name.`);
        }

        if (!Array.isArray(config.assets)) {
            throwValidationError(`App '${appId}' is missing a valid assets array.`);
        }

        const assetIds = new Set();

        for (const assetConfig of config.assets) {
            validateAssetConfig(appId, assetConfig, assetIds);

            if (config.type === 'githubVersionedStatic') {
                if (typeof config.repo !== 'string' || !config.repo.trim()) {
                    throwValidationError(`Versioned static app '${appId}' is missing a valid repo.`);
                }

                if (typeof assetConfig.urlTemplate !== 'string' || !assetConfig.urlTemplate.trim()) {
                    throwValidationError(`Versioned static app '${appId}' asset '${assetConfig.id}' is missing a valid urlTemplate.`);
                }

                continue;
            }

            if (typeof config.repo !== 'string' || !config.repo.trim()) {
                throwValidationError(`App '${appId}' is missing a valid repo.`);
            }

            if (!['github', 'static'].includes(assetConfig.sourceType)) {
                throwValidationError(`App '${appId}' asset '${assetConfig.id}' has invalid sourceType '${assetConfig.sourceType}'.`);
            }

            if (assetConfig.sourceType === 'github') {
                if (typeof assetConfig.assetPattern !== 'string' || !assetConfig.assetPattern.trim()) {
                    throwValidationError(`App '${appId}' GitHub asset '${assetConfig.id}' is missing a valid assetPattern.`);
                }
            }

            if (assetConfig.sourceType === 'static') {
                if (typeof assetConfig.url !== 'string' || !assetConfig.url.trim()) {
                    throwValidationError(`App '${appId}' static asset '${assetConfig.id}' is missing a valid url.`);
                }
            }
        }

        if (
            config.versionSource !== undefined &&
            !['auto', 'tag', 'name'].includes(config.versionSource)
        ) {
            throwValidationError(`App '${appId}' has invalid versionSource '${config.versionSource}'.`);
        }

        if (
            config.requireAllAssets !== undefined &&
            typeof config.requireAllAssets !== 'boolean'
        ) {
            throwValidationError(`App '${appId}' has invalid requireAllAssets value.`);
        }

        if (
            config.allowPrerelease !== undefined &&
            typeof config.allowPrerelease !== 'boolean'
        ) {
            throwValidationError(`App '${appId}' has invalid allowPrerelease value.`);
        }

        if (config.releaseTagRegex !== undefined) {
            try {
                new RegExp(config.releaseTagRegex);
            } catch (error) {
                throwValidationError(`App '${appId}' has invalid releaseTagRegex.`);
            }
        }

        if (config.versionRegex !== undefined) {
            try {
                new RegExp(config.versionRegex);
            } catch (error) {
                throwValidationError(`App '${appId}' has invalid versionRegex.`);
            }
        }

        validateDateOverrideMap(appId, 'releaseDateOverrides', config.releaseDateOverrides);
        validateDateOverrideMap(appId, 'firstReleaseDateOverrides', config.firstReleaseDateOverrides);
    }
}

function validateOutputSchema(output) {
    if (!output || typeof output !== 'object' || Array.isArray(output)) {
        throwValidationError('Generated output root must be an object.');
    }

    for (const [appId, entry] of Object.entries(output)) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throwValidationError(`Output entry '${appId}' must be an object.`);
        }

        if (typeof entry.name !== 'string') {
            throwValidationError(`Output entry '${appId}' has invalid name.`);
        }

        if (typeof entry.version !== 'string') {
            throwValidationError(`Output entry '${appId}' has invalid version.`);
        }

        if (typeof entry.releaseDate !== 'string') {
            throwValidationError(`Output entry '${appId}' has invalid releaseDate.`);
        }

        if (typeof entry.firstReleaseDate !== 'string') {
            throwValidationError(`Output entry '${appId}' has invalid firstReleaseDate.`);
        }

        if (!Array.isArray(entry.assets)) {
            throwValidationError(`Output entry '${appId}' has invalid assets array.`);
        }

        const assetIds = new Set();

        for (const asset of entry.assets) {
            if (!asset || typeof asset !== 'object' || Array.isArray(asset)) {
                throwValidationError(`Output entry '${appId}' contains an invalid asset.`);
            }

            if (typeof asset.id !== 'string' || !asset.id.trim()) {
                throwValidationError(`Output entry '${appId}' contains an asset with invalid id.`);
            }

            if (assetIds.has(asset.id)) {
                throwValidationError(`Output entry '${appId}' has duplicate asset id '${asset.id}'.`);
            }

            assetIds.add(asset.id);

            if (typeof asset.url !== 'string' || !asset.url.trim()) {
                throwValidationError(`Output entry '${appId}' asset '${asset.id}' has invalid url.`);
            }
        }
    }
}

function getRequireAllAssets(config) {
    return config.requireAllAssets !== false;
}

function classifyError(error) {
    return error && error.failureType ? error.failureType : 'unknown-failure';
}

function incrementFailure(summary, failureType) {
    if (!summary.failuresByType[failureType]) {
        summary.failuresByType[failureType] = 0;
    }

    summary.failuresByType[failureType] += 1;
}

function createSummary() {
    return {
        totalApps: 0,
        githubEntries: 0,
        versionedStaticEntries: 0,
        cachedRepoHits: 0,
        unchangedEntries: 0,
        changedEntries: 0,
        fallbackEntries: 0,
        failureEntries: 0,
        filesWritten: false,
        failuresByType: {}
    };
}

function entryString(entry) {
    return JSON.stringify(entry);
}

async function resolveGithubAssetsForRelease(config, bestRelease) {
    const releaseAssets = getReleaseAssets(bestRelease);
    const githubAssets = getGithubManifestAssets(config);
    const resolvedAssets = [];

    for (const assetConfig of githubAssets) {
        const foundAsset = releaseAssets.find(asset =>
            nameMatchesPattern(asset.name, assetConfig.assetPattern)
        );

        if (foundAsset) {
            resolvedAssets.push({
                id: assetConfig.id,
                url: foundAsset.browser_download_url
            });

            console.log(`    - Found GitHub asset for '${assetConfig.id}': ${foundAsset.name}`);
        } else {
            console.warn(`    - ⚠️ Missing GitHub asset for '${assetConfig.id}' with pattern '${assetConfig.assetPattern}'`);
        }
    }

    return resolvedAssets;
}

async function resolveStaticAssetsForConfig(config) {
    const staticAssets = getStaticManifestAssets(config);
    const resolvedAssets = [];

    for (const assetConfig of staticAssets) {
        const resolvedUrl = typeof assetConfig.url === 'string' ? assetConfig.url.trim() : '';

        if (!resolvedUrl) {
            console.warn(`    - ⚠️ Missing static URL for '${assetConfig.id}'`);
            continue;
        }

        resolvedAssets.push({
            id: assetConfig.id,
            url: resolvedUrl
        });

        console.log(`    - Using static asset for '${assetConfig.id}': ${resolvedUrl}`);
    }

    return resolvedAssets;
}

function validateResolvedAssetCounts(config, resolvedGithubAssets, resolvedStaticAssets) {
    const githubAssets = getGithubManifestAssets(config);
    const staticAssets = getStaticManifestAssets(config);
    const requireAllAssets = getRequireAllAssets(config);

    if (githubAssets.length > 0 && resolvedGithubAssets.length === 0) {
        const error = new Error('No expected GitHub assets were found in best matching release.');
        error.failureType = FAILURE_TYPES.ASSET_MISS;
        throw error;
    }

    if (requireAllAssets && githubAssets.length > 0 && resolvedGithubAssets.length !== githubAssets.length) {
        const error = new Error('One or more expected GitHub assets were not found in best matching release.');
        error.failureType = FAILURE_TYPES.PARTIAL_ASSET_MISS;
        throw error;
    }

    if (staticAssets.length > 0 && resolvedStaticAssets.length === 0) {
        const error = new Error('No static assets were defined.');
        error.failureType = FAILURE_TYPES.STATIC_URL_CHECK;
        throw error;
    }

    if (requireAllAssets && staticAssets.length > 0 && resolvedStaticAssets.length !== staticAssets.length) {
        const error = new Error('One or more static assets are missing URLs.');
        error.failureType = FAILURE_TYPES.STATIC_URL_CHECK;
        throw error;
    }

    if (resolvedGithubAssets.length === 0 && resolvedStaticAssets.length === 0) {
        const error = new Error('No assets could be resolved.');
        error.failureType = FAILURE_TYPES.ASSET_MISS;
        throw error;
    }
}

async function processGithubReleaseAssetsApp(appId, config, finalJsonOutput, headers, releaseCache, summary) {
    const githubAssets = getGithubManifestAssets(config);
    const staticAssets = getStaticManifestAssets(config);

    if (!githubAssets.length && staticAssets.length) {
        finalJsonOutput[appId].version = normalizeVersion(config.version || 'Unknown');
        finalJsonOutput[appId].releaseDate = config.releaseDate || 'Unknown';
        finalJsonOutput[appId].firstReleaseDate = config.firstReleaseDate || config.releaseDate || 'Unknown';

        const resolvedStaticAssets = await resolveStaticAssetsForConfig(config);
        validateResolvedAssetCounts(config, [], resolvedStaticAssets);
        finalJsonOutput[appId].assets = resolvedStaticAssets;
        console.log('  - Static-only assets processed inside standard manifest entry.');
        return;
    }

    const releaseData = await fetchMatchingReleaseData(config.repo, config, headers, releaseCache, summary);
    const bestRelease = releaseData.bestRelease;
    const firstRelease = releaseData.firstRelease;

    if (!bestRelease || !firstRelease) {
        const error = new Error('Could not determine release history.');
        error.failureType = FAILURE_TYPES.NO_RELEASES;
        throw error;
    }

    console.log(`  - Found release: '${bestRelease.name || bestRelease.tag_name}'`);

    const resolvedVersion = releaseData.bestVersion || extractDisplayVersion(bestRelease, config) || 'Unknown';
    const firstResolvedVersion = releaseData.firstVersion || extractDisplayVersion(firstRelease, config) || 'Unknown';
    const releaseDate = resolveReleaseDate(config, resolvedVersion, bestRelease);
    const firstReleaseDate = resolveFirstReleaseDate(config, firstResolvedVersion, firstRelease);

    finalJsonOutput[appId].version = resolvedVersion;
    finalJsonOutput[appId].releaseDate = releaseDate;
    finalJsonOutput[appId].firstReleaseDate = firstReleaseDate;

    const resolvedGithubAssets = await resolveGithubAssetsForRelease(config, bestRelease);
    const resolvedStaticAssets = await resolveStaticAssetsForConfig(config);

    validateResolvedAssetCounts(config, resolvedGithubAssets, resolvedStaticAssets);

    finalJsonOutput[appId].assets = [
        ...resolvedGithubAssets,
        ...resolvedStaticAssets
    ];
}

async function processGithubVersionedStaticApp(appId, config, finalJsonOutput, headers, releaseCache, summary) {
    const releaseData = await fetchMatchingReleaseData(config.repo, config, headers, releaseCache, summary);
    const bestRelease = releaseData.bestRelease;
    const firstRelease = releaseData.firstRelease;

    if (!bestRelease || !firstRelease) {
        const error = new Error('Could not determine release history.');
        error.failureType = FAILURE_TYPES.NO_RELEASES;
        throw error;
    }

    console.log(`  - Found release: '${bestRelease.name || bestRelease.tag_name}'`);

    const rawReleaseVersion = releaseData.bestVersion || extractDisplayVersion(bestRelease, config) || config.version || 'Unknown';
    const normalizedReleaseVersion = normalizeVersion(rawReleaseVersion);
    const firstRawReleaseVersion = releaseData.firstVersion || extractDisplayVersion(firstRelease, config) || rawReleaseVersion;
    const normalizedFirstReleaseVersion = normalizeVersion(firstRawReleaseVersion);

    const releaseDate = resolveReleaseDate(config, normalizedReleaseVersion, bestRelease);
    const firstReleaseDate = resolveFirstReleaseDate(config, normalizedFirstReleaseVersion, firstRelease);

    const resolvedAssets = [];

    for (const assetConfig of config.assets) {
        const resolvedUrl = buildVersionedStaticUrl(assetConfig, normalizedReleaseVersion);

        if (!resolvedUrl) {
            console.warn(`    - ⚠️ Could not build URL for '${assetConfig.id}'`);
            continue;
        }

        const exists = await urlExists(resolvedUrl);

        if (exists) {
            resolvedAssets.push({
                id: assetConfig.id,
                url: resolvedUrl
            });

            console.log(`    - Verified versioned static asset for '${assetConfig.id}': ${resolvedUrl}`);
        } else {
            console.warn(`    - ⚠️ URL check failed for '${assetConfig.id}': ${resolvedUrl}`);
        }
    }

    const requireAllAssets = getRequireAllAssets(config);

    if (resolvedAssets.length === 0) {
        const error = new Error('No versioned static assets could be verified.');
        error.failureType = FAILURE_TYPES.VERSION_URL_CHECK;
        throw error;
    }

    if (requireAllAssets && resolvedAssets.length !== config.assets.length) {
        const error = new Error('One or more versioned static assets could not be verified.');
        error.failureType = FAILURE_TYPES.VERSION_URL_CHECK;
        throw error;
    }

    finalJsonOutput[appId].version = normalizedReleaseVersion;
    finalJsonOutput[appId].releaseDate = releaseDate;
    finalJsonOutput[appId].firstReleaseDate = firstReleaseDate;
    finalJsonOutput[appId].assets = resolvedAssets;

    console.log('  - Versioned static links processed.');
}

function printSummary(summary) {
    console.log('\n--- Run Summary ---');
    console.log(`Total apps processed: ${summary.totalApps}`);
    console.log(`GitHub release / mixed entries: ${summary.githubEntries}`);
    console.log(`GitHub versioned static entries: ${summary.versionedStaticEntries}`);
    console.log(`Cached repo hits: ${summary.cachedRepoHits}`);
    console.log(`Changed entries: ${summary.changedEntries}`);
    console.log(`Unchanged entries: ${summary.unchangedEntries}`);
    console.log(`Fallback entries: ${summary.fallbackEntries}`);
    console.log(`Failure entries: ${summary.failureEntries}`);
    console.log(`Files written: ${summary.filesWritten ? 'yes' : 'no'}`);

    const failureTypes = Object.entries(summary.failuresByType);

    if (failureTypes.length) {
        console.log('Failures by type:');
        for (const [failureType, count] of failureTypes) {
            console.log(`  - ${failureType}: ${count}`);
        }
    } else {
        console.log('Failures by type: none');
    }
}

async function main() {
    console.log(`Reading manifest file: ${MANIFEST_FILE}...`);

    if (!fs.existsSync(MANIFEST_FILE)) {
        console.error(`\n❌ FATAL ERROR: Manifest file not found at '${MANIFEST_FILE}'.`);
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    validateManifest(manifest);

    let previousOutput = {};

    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            previousOutput = readJsonFile(OUTPUT_FILE, {});
            console.log(`Loaded previous output from: ${OUTPUT_FILE}`);
        } catch (error) {
            console.warn(`⚠️ Could not read previous output file: ${error.message}`);
        }
    }

    const finalJsonOutput = {};
    const releaseCache = new Map();
    const summary = createSummary();

    const headers = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'emulationrevival-build-links'
    };

    if (GITHUB_PAT) {
        headers.Authorization = `token ${GITHUB_PAT}`;
    } else {
        console.warn('\n⚠️ WARNING: No GitHub PAT found. You may encounter API rate limits.\n');
    }

    for (const [appId, config] of Object.entries(manifest)) {
        summary.totalApps += 1;

        if (config.type === 'githubVersionedStatic') {
            summary.versionedStaticEntries += 1;
        } else {
            summary.githubEntries += 1;
        }

        console.log(`\n--- Processing App: ${config.name} ---`);

        finalJsonOutput[appId] = {
            name: config.name,
            version: 'Unknown',
            releaseDate: 'Unknown',
            firstReleaseDate: 'Unknown',
            assets: []
        };

        try {
            if (config.type === 'githubVersionedStatic') {
                await processGithubVersionedStaticApp(
                    appId,
                    config,
                    finalJsonOutput,
                    headers,
                    releaseCache,
                    summary
                );
            } else {
                await processGithubReleaseAssetsApp(
                    appId,
                    config,
                    finalJsonOutput,
                    headers,
                    releaseCache,
                    summary
                );
            }
        } catch (error) {
            const failureType = classifyError(error);
            incrementFailure(summary, failureType);
            summary.failureEntries += 1;

            console.error(`  - ❌ ${failureType} for '${config.repo || config.name}': ${error.message}`);

            applyFallbackEntry(
                appId,
                config,
                finalJsonOutput,
                previousOutput,
                '  - ⚠️ Preserved previous working values.'
            );

            summary.fallbackEntries += 1;
        }

        const previousEntry = previousOutput[appId];

        if (previousEntry && entryString(previousEntry) === entryString(finalJsonOutput[appId])) {
            summary.unchangedEntries += 1;
        } else {
            summary.changedEntries += 1;
        }
    }

    try {
        validateOutputSchema(finalJsonOutput);

        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const previousCanonicalString = stableStringify(previousOutput);
        const nextCanonicalString = stableStringify(finalJsonOutput);

        if (previousCanonicalString === nextCanonicalString) {
            console.log(`\n\nℹ️ No data changes detected. Skipping writes to: ${OUTPUT_FILE} and ${VERSION_FILE}`);
            summary.filesWritten = false;
            printSummary(summary);
            return;
        }

        writeFileAtomic(OUTPUT_FILE, nextCanonicalString);

        const versionData = {
            version: Date.now()
        };

        writeFileAtomic(
            VERSION_FILE,
            `${JSON.stringify(versionData)}\n`
        );

        summary.filesWritten = true;

        console.log(`\n\n🚀 Updated data file: ${OUTPUT_FILE}`);
        console.log(`🚀 Updated cache-busting version file: ${VERSION_FILE}`);

        printSummary(summary);
    } catch (error) {
        const failureType = classifyError(error) === 'unknown-failure'
            ? FAILURE_TYPES.WRITE
            : classifyError(error);

        console.error(`\n\n❌ ${failureType}: ${error.message}`);
    }
}

main();
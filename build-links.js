require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const GITHUB_PAT = process.env.GITHUB_PAT;
const MANIFEST_FILE = path.join('json', 'devmode.manifest.json');
const OUTPUT_DIR = 'json';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'app-links.json');
const VERSION_FILE = path.join(OUTPUT_DIR, 'version.json');

function nameMatchesPattern(assetName, pattern) {
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

    if (!assetConfig || !assetConfig.urlTemplate) {
        return null;
    }

    const versionUnderscored = normalizedVersion.replace(/\./g, '_');
    const versionDashed = normalizedVersion.replace(/\./g, '-');

    return assetConfig.urlTemplate
        .replace(/\{version\}/g, normalizedVersion)
        .replace(/\{version_underscored\}/g, versionUnderscored)
        .replace(/\{version_dashed\}/g, versionDashed);
}

async function urlExists(url) {
    try {
        let response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        if (response.ok) {
            return true;
        }

        if (response.status === 405 || response.status === 403) {
            response = await fetch(url, {
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

async function fetchLatestStableRelease(repo, headers, releaseCache) {
    if (releaseCache.has(repo)) {
        const cachedRelease = releaseCache.get(repo);

        if (cachedRelease) {
            console.log(`  - Using cached release for '${repo}'`);
        }

        return cachedRelease;
    }

    const apiUrl = `https://api.github.com/repos/${repo}/releases`;
    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    const allReleases = await response.json();

    if (!Array.isArray(allReleases) || !allReleases.length) {
        throw new Error('No releases found.');
    }

    const latestStableRelease =
        allReleases.find(release => !release.prerelease) || allReleases[0];

    releaseCache.set(repo, latestStableRelease);

    return latestStableRelease;
}

function getExistingStaticFallback(config) {
    return {
        version: config.version || 'Unknown',
        releaseDate: config.releaseDate || 'Unknown',
        assets: Array.isArray(config.assets) ? config.assets : []
    };
}

async function processStaticApp(appId, config, finalJsonOutput) {
    finalJsonOutput[appId].version = config.version || 'Unknown';
    finalJsonOutput[appId].releaseDate = config.releaseDate || 'Unknown';
    finalJsonOutput[appId].assets = Array.isArray(config.assets) ? config.assets : [];
    console.log('  - Static links processed.');
}

async function processGithubReleaseAssetsApp(appId, config, finalJsonOutput, headers, releaseCache) {
    const latestStableRelease = await fetchLatestStableRelease(config.repo, headers, releaseCache);

    if (!latestStableRelease) {
        throw new Error('Could not determine a stable release.');
    }

    console.log(
        `  - Found release: '${latestStableRelease.name || latestStableRelease.tag_name}'`
    );

    const releaseVersion = latestStableRelease.tag_name || latestStableRelease.name || 'Unknown';
    const releaseDate = getReleaseDate(latestStableRelease);

    finalJsonOutput[appId].version = releaseVersion;
    finalJsonOutput[appId].releaseDate = releaseDate;

    const releaseAssets = Array.isArray(latestStableRelease.assets)
        ? latestStableRelease.assets
        : [];

    for (const assetConfig of config.assets) {
        const foundAsset = releaseAssets.find(asset =>
            nameMatchesPattern(asset.name, assetConfig.assetPattern)
        );

        if (foundAsset) {
            finalJsonOutput[appId].assets.push({
                id: assetConfig.id,
                url: foundAsset.browser_download_url
            });

            console.log(
                `    - Found asset for '${assetConfig.id}': ${foundAsset.name}`
            );
        } else {
            console.warn(
                `    - ⚠️ Could not find asset for '${assetConfig.id}' with pattern '${assetConfig.assetPattern}'`
            );
        }
    }
}

async function processGithubVersionedStaticApp(appId, config, finalJsonOutput, headers, releaseCache) {
    const fallback = getExistingStaticFallback(config);
    const latestStableRelease = await fetchLatestStableRelease(config.repo, headers, releaseCache);

    if (!latestStableRelease) {
        throw new Error('Could not determine a stable release.');
    }

    console.log(
        `  - Found release: '${latestStableRelease.name || latestStableRelease.tag_name}'`
    );

    const rawReleaseVersion = latestStableRelease.tag_name || latestStableRelease.name || 'Unknown';
    const normalizedReleaseVersion = normalizeVersion(rawReleaseVersion);
    const releaseDate = getReleaseDate(latestStableRelease);

    const resolvedAssets = [];

    for (const assetConfig of config.assets) {
        const resolvedUrl = buildVersionedStaticUrl(assetConfig, normalizedReleaseVersion);

        if (!resolvedUrl) {
            console.warn(
                `    - ⚠️ Could not build URL for '${assetConfig.id}'`
            );
            continue;
        }

        const exists = await urlExists(resolvedUrl);

        if (exists) {
            resolvedAssets.push({
                id: assetConfig.id,
                url: resolvedUrl
            });

            console.log(
                `    - Verified versioned static asset for '${assetConfig.id}': ${resolvedUrl}`
            );
        } else {
            console.warn(
                `    - ⚠️ URL check failed for '${assetConfig.id}': ${resolvedUrl}`
            );
        }
    }

    if (resolvedAssets.length === config.assets.length && resolvedAssets.length > 0) {
        finalJsonOutput[appId].version = normalizedReleaseVersion;
        finalJsonOutput[appId].releaseDate = releaseDate;
        finalJsonOutput[appId].assets = resolvedAssets;
        console.log('  - Versioned static links processed.');
        return;
    }

    finalJsonOutput[appId].version = fallback.version;
    finalJsonOutput[appId].releaseDate = fallback.releaseDate;
    finalJsonOutput[appId].assets = fallback.assets;
    console.warn('  - ⚠️ Falling back to existing manifest values.');
}

async function main() {
    console.log(`Reading manifest file: ${MANIFEST_FILE}...`);

    if (!fs.existsSync(MANIFEST_FILE)) {
        console.error(`\n❌ FATAL ERROR: Manifest file not found at '${MANIFEST_FILE}'.`);
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
    const finalJsonOutput = {};
    const releaseCache = new Map();

    const headers = { Accept: 'application/vnd.github.v3+json' };

    if (GITHUB_PAT) {
        headers.Authorization = `token ${GITHUB_PAT}`;
    } else {
        console.warn('\n⚠️ WARNING: No GitHub PAT found. You may encounter API rate limits.\n');
    }

    for (const [appId, config] of Object.entries(manifest)) {
        console.log(`\n--- Processing App: ${config.name} ---`);

        finalJsonOutput[appId] = {
            name: config.name,
            version: 'Unknown',
            releaseDate: 'Unknown',
            assets: []
        };

        try {
            if (config.type === 'static') {
                await processStaticApp(appId, config, finalJsonOutput);
                continue;
            }

            if (config.type === 'githubVersionedStatic') {
                await processGithubVersionedStaticApp(
                    appId,
                    config,
                    finalJsonOutput,
                    headers,
                    releaseCache
                );
                continue;
            }

            await processGithubReleaseAssetsApp(
                appId,
                config,
                finalJsonOutput,
                headers,
                releaseCache
            );
        } catch (error) {
            console.error(
                `  - ❌ ERROR processing repo '${config.repo || config.name}': ${error.message}`
            );

            if (config.type === 'static' || config.type === 'githubVersionedStatic') {
                const fallback = getExistingStaticFallback(config);
                finalJsonOutput[appId].version = fallback.version;
                finalJsonOutput[appId].releaseDate = fallback.releaseDate;
                finalJsonOutput[appId].assets = fallback.assets;
                console.warn('  - ⚠️ Preserved existing manifest values.');
            }
        }
    }

    try {
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR);
        }

        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify(finalJsonOutput, null, 2)
        );

        console.log(`\n\n🚀 Success! Main data file generated at: ${OUTPUT_FILE}`);

        const versionData = {
            version: Date.now()
        };

        fs.writeFileSync(
            VERSION_FILE,
            JSON.stringify(versionData)
        );

        console.log(
            `🚀 Success! Version file for cache busting generated at: ${VERSION_FILE}`
        );
    } catch (error) {
        console.error(
            `\n\n❌ Fatal Error writing output file(s):`,
            error.message
        );
    }
}

main();
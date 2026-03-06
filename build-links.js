// build-links.js

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// --- Configuration ---
const GITHUB_PAT = process.env.GITHUB_PAT;
const MANIFEST_FILE = path.join('json', 'devmode.manifest.json');
const OUTPUT_DIR = 'json';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'app-links.json');
const VERSION_FILE = path.join(OUTPUT_DIR, 'version.json');

// Pattern matcher (case-insensitive)
function nameMatchesPattern(assetName, pattern) {
    const regex = new RegExp(
        `^${pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*')}$`,
        'i'
    );
    return regex.test(assetName);
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

    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (GITHUB_PAT) {
        headers['Authorization'] = `token ${GITHUB_PAT}`;
    } else {
        console.warn('\n⚠️ WARNING: No GitHub PAT found. You may encounter API rate limits.\n');
    }

    for (const [appId, config] of Object.entries(manifest)) {

        console.log(`\n--- Processing App: ${config.name} ---`);

        finalJsonOutput[appId] = {
            name: config.name,
            assets: []
        };

        if (config.type === 'static') {
            finalJsonOutput[appId].assets = config.assets;
            console.log('  - Static links processed.');
            continue;
        }

        try {

            let latestStableRelease;

            if (releaseCache.has(config.repo)) {
                latestStableRelease = releaseCache.get(config.repo);

                if (latestStableRelease) {
                    console.log(`  - Using cached release for '${config.repo}'`);
                }

            } else {

                const apiUrl = `https://api.github.com/repos/${config.repo}/releases`;

                const response = await fetch(apiUrl, { headers });

                if (!response.ok) {
                    throw new Error(`API request failed: ${response.status}`);
                }

                const allReleases = await response.json();

                if (!allReleases.length) {
                    throw new Error('No releases found.');
                }

                latestStableRelease =
                    allReleases.find(r => !r.prerelease) || allReleases[0];

                releaseCache.set(config.repo, latestStableRelease);
            }

            if (!latestStableRelease) {
                throw new Error("Could not determine a stable release.");
            }

            console.log(
                `  - Found release: '${latestStableRelease.name || latestStableRelease.tag_name}'`
            );

            const releaseAssets = latestStableRelease.assets;

            for (const assetConfig of config.assets) {

                const foundAsset = releaseAssets.find(a =>
                    nameMatchesPattern(a.name, assetConfig.assetPattern)
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

        } catch (error) {

            console.error(
                `  - ❌ ERROR processing repo '${config.repo}': ${error.message}`
            );
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
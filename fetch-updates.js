// fetch-updates.js

require('dotenv').config();

const GITHUB_PAT = process.env.GITHUB_PAT;

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const outputDir = 'json';
const outputFile = path.join(outputDir, 'updates.json');
// NEW: Define the path for our new cache-busting version file.
const versionFile = path.join(outputDir, 'updates-version.json');

// --- DATA PROCESSORS (No changes here) ---
function processLatestRelease(data) {
  if (!data || !data.published_at) return null;
  return { version: data.name || data.tag_name, date: data.published_at };
}

function processLatestCommit(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return { date: data[0].commit.committer.date };
}

function processTags(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  return data;
}

function processWorkflowRuns(data) {
  if (!data || !Array.isArray(data.workflow_runs) || data.workflow_runs.length === 0) {
    return null;
  }
  const lastSuccess = data.workflow_runs.find(run => run.conclusion === 'success');
  if (!lastSuccess) return null;
  
  return { date: lastSuccess.updated_at };
}

// --- CONFIGURATION (No changes here) ---
const FETCH_GROUPS = {
  releases: {
    processor: processLatestRelease,
    emulators: {
      duckstation: 'https://api.github.com/repos/stenzek/duckstation/releases/latest',
      pcsx2: 'https://api.github.com/repos/PCSX2/pcsx2/releases/latest',
      netherSX2: 'https://api.github.com/repos/Trixarian/NetherSX2-patch/releases/latest',
      rpcsxAndroid: 'https://api.github.com/repos/RPCSX/rpcsx-ui-android/releases/latest',
      shadPS4: 'https://api.github.com/repos/shadps4-emu/shadPS4/releases/latest'
    }
  },
  commits: {
    processor: processLatestCommit,
    emulators: {
      rpcs3: 'https://api.github.com/repos/RPCS3/rpcs3/commits?sha=master',
      beetlePsx: 'https://api.github.com/repos/libretro/beetle-psx-libretro/commits?sha=master',
      pcsxRearmed: 'https://api.github.com/repos/libretro/pcsx_rearmed/commits?sha=master',
      lrps2: 'https://api.github.com/repos/libretro/ps2/commits?sha=libretroization'
    }
  },
  tags: {
    processor: processTags,
    emulators: {
      play: 'https://api.github.com/repos/jpd002/Play-/tags'
    }
  },
  workflows: {
    processor: processWorkflowRuns,
    emulators: {
      fpPS4: 'https://api.github.com/repos/red-prig/fpPS4/actions/runs'
    }
  }
};


async function fetchAllData() {
  console.log('Starting to fetch data for all emulators...');
  if (!GITHUB_PAT || GITHUB_PAT === 'ghp_YourPersonalAccessTokenGoesHere') {
    console.error('\nERROR: Please add your GitHub Personal Access Token (PAT).\n');
    return;
  }
  const headers = { 'Authorization': `token ${GITHUB_PAT}`, 'Accept': 'application/vnd.github.v3+json' };

  let promises = [];

  for (const groupName in FETCH_GROUPS) {
    const group = FETCH_GROUPS[groupName];
    for (const key in group.emulators) {
      const url = group.emulators[key];
      const processor = group.processor;

      promises.push(
        (async () => {
          try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`Failed on ${url}. Status: ${response.status}`);
            const rawData = await response.json();
            
            let processedData = processor(rawData);

            if (processor === processTags && processedData) {
              console.log(`- Detected a /tags endpoint for '${key}'. Performing second fetch...`);
              const commitUrl = rawData[0].commit.url;
              const commitResponse = await fetch(commitUrl, { headers });
              if (!commitResponse.ok) throw new Error(`Failed second fetch for ${key}!`);
              const commitData = await commitResponse.json();
              processedData = { date: commitData.commit.committer.date };
            }
            
            if (processedData) {
              console.log(`✅ Successfully processed data for: ${key}`);
            } else {
              console.warn(`⚠️  No valid data processed for: ${key}`);
            }
            
            return { key, data: processedData };
          } catch (error) {
            console.error(`❌ Error fetching data for ${key}:`, error.message);
            return { key, data: null };
          }
        })()
      );
    }
  }

  const results = await Promise.all(promises);
  const finalDataObject = {};
  for (const result of results) {
    if (result.data) {
      finalDataObject[result.key] = result.data;
    }
  }

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  
  // Write the main updates file
  fs.writeFileSync(outputFile, JSON.stringify(finalDataObject, null, 2));
  console.log(`\nAll data has been fetched and saved to ${outputFile}!`);

  // NEW: Create a unique timestamp and write the version file for cache busting.
  const versionData = { version: Date.now() };
  fs.writeFileSync(versionFile, JSON.stringify(versionData));
  console.log(`Version file for cache busting saved to ${versionFile}!`);
}

fetchAllData();

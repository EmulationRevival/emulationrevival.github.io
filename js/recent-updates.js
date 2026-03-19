const IDS = {
  GRID: 'recent-updates-grid',
  SECTION: 'recent-updates-section',
};

const CONFIG = {
  SEARCH_INDEX_PATH: '/json/search-index.json',
  VERSION_PATH: '/json/version.json',
  APP_LINKS_PATH: '/json/app-links.json',
  IMAGE_FALLBACK: '/images/fallback.png',
  RECENT_WINDOW_MS: 30 * 24 * 60 * 60 * 1000,
};

const state = {
  inFlightPromise: null,
  renderToken: 0,
};

function normalizeName(str) {
  return (str || '').toLowerCase().trim();
}

function buildFetchUrls() {
  const cacheBust = Date.now();
  return {
    searchIndexUrl: `${CONFIG.SEARCH_INDEX_PATH}?cb=${cacheBust}`,
    versionUrl: `${CONFIG.VERSION_PATH}?cb=${cacheBust}`,
  };
}

function createRecentCard(app) {
  const card = document.createElement('div');
  card.className = 'card';

  const link = document.createElement('a');
  link.href = app.url;
  link.className = 'card-link';

  const imageContainer = document.createElement('div');
  imageContainer.className = 'card-image-container';

  const img = document.createElement('img');
  img.src = app.img || CONFIG.IMAGE_FALLBACK;
  img.alt = `${app.name} Logo`;
  img.className = 'card-image';
  img.onerror = () => {
    img.onerror = null;
    img.src = CONFIG.IMAGE_FALLBACK;
  };

  const badge = document.createElement('div');
  badge.className = 'new-update-badge';
  badge.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = app.name;

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = app.description || '';

  content.append(title, description);
  imageContainer.append(img, badge);
  link.append(imageContainer, content);
  card.appendChild(link);

  return card;
}

async function fetchRecentUpdateData() {
  const { searchIndexUrl, versionUrl } = buildFetchUrls();
  const fetchOpts = { cache: 'no-store' };

  const searchIndexPromise = fetch(searchIndexUrl, fetchOpts).then(res => {
    if (!res.ok) throw new Error('Could not fetch search index');
    return res.json();
  });

  const versionData = await fetch(versionUrl, fetchOpts).then(res => {
    if (!res.ok) throw new Error('Could not fetch version.json');
    return res.json();
  });

  const appLinksPromise = fetch(
    `${CONFIG.APP_LINKS_PATH}?v=${versionData.version}`,
    fetchOpts
  ).then(res => {
    if (!res.ok) throw new Error('Could not fetch app-links.json');
    return res.json();
  });

  const [searchIndex, appData] = await Promise.all([searchIndexPromise, appLinksPromise]);

  return { searchIndex, appData };
}

function computeRecentApps(searchIndex, appData) {
  const searchMap = new Map();

  for (const item of searchIndex) {
    const key = normalizeName(item.name);
    if (key) searchMap.set(key, item);
  }

  const cutoff = Date.now() - CONFIG.RECENT_WINDOW_MS;
  const recentApps = [];

  for (const info of Object.values(appData)) {
    if (!info?.releaseDate || info.releaseDate === 'Unknown') continue;

    const timestamp = Date.parse(info.releaseDate);
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp < cutoff) continue;

    const searchData = searchMap.get(normalizeName(info.name));
    if (!searchData) continue;

    recentApps.push({
      timestamp,
      url: searchData.url,
      img: searchData.img,
      name: searchData.name,
      description: searchData.description || '',
    });
  }

  recentApps.sort((a, b) => b.timestamp - a.timestamp);
  return recentApps;
}

async function loadRecentUpdates() {
  const grid = document.getElementById(IDS.GRID);
  const section = document.getElementById(IDS.SECTION);

  if (!grid || !section) return;

  if (state.inFlightPromise) return state.inFlightPromise;

  const token = ++state.renderToken;

  state.inFlightPromise = (async () => {
    try {
      const { searchIndex, appData } = await fetchRecentUpdateData();
      const recentApps = computeRecentApps(searchIndex, appData);

      if (token !== state.renderToken) return;

      if (recentApps.length === 0) {
        grid.replaceChildren();
        section.style.display = 'none';
        return;
      }

      const fragment = document.createDocumentFragment();
      for (const app of recentApps) {
        fragment.appendChild(createRecentCard(app));
      }

      grid.replaceChildren(fragment);
      section.style.display = 'block';
    } catch (error) {
      console.error('Failed to load recent updates:', error);
    } finally {
      state.inFlightPromise = null;
    }
  })();

  return state.inFlightPromise;
}

// --- INITIAL LOAD (module-safe) ---
loadRecentUpdates();

// --- BFCache restore ---
window.addEventListener('pageshow', event => {
  if (event.persisted) {
    loadRecentUpdates();
  }
});
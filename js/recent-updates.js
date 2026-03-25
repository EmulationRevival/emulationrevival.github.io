const IDS = {
  RECENT_GRID: 'recent-updates-grid',
  RECENT_SECTION: 'recent-updates-section',
  UPCOMING_GRID: 'coming-soon-grid',
  UPCOMING_SECTION: 'coming-soon-section',
};

const CONFIG = {
  SEARCH_INDEX_PATH: '/json/search-index.json',
  VERSION_PATH: '/json/version.json',
  APP_LINKS_PATH: '/json/app-links.json',
  IMAGE_FALLBACK: '/images/fallback.png',
  RECENT_WINDOW_MS: 30 * 24 * 60 * 60 * 1000,
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

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

function createHomepageCard(app, { isUpcoming = false } = {}) {
  const card = document.createElement('div');
  card.className = 'card';

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

  const content = document.createElement('div');
  content.className = 'card-content';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = app.name;

  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = app.description || '';

  content.append(title, description);
  imageContainer.appendChild(img);

  if (isUpcoming) {
    if (app.releaseDateText) {
      const releaseDate = document.createElement('p');
      releaseDate.className = 'card-description';
      releaseDate.textContent = `Releases ${app.releaseDateText}`;
      content.appendChild(releaseDate);
    }

    card.append(imageContainer, content);
    return card;
  }

  const link = document.createElement('a');
  link.href = app.url;
  link.className = 'card-link';
  link.append(imageContainer, content);
  card.appendChild(link);

  return card;
}

async function fetchHomepageData() {
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

function buildSearchMap(searchIndex) {
  const searchMap = new Map();

  for (const item of searchIndex) {
    const key = normalizeName(item.name);
    if (key) {
      searchMap.set(key, item);
    }
  }

  return searchMap;
}

function formatReleaseDate(timestamp) {
  return dateFormatter.format(timestamp);
}

function computeRecentApps(searchMap, appData) {
  const now = Date.now();
  const cutoff = now - CONFIG.RECENT_WINDOW_MS;
  const recentApps = [];

  for (const info of Object.values(appData)) {
    if (!info?.releaseDate || info.releaseDate === 'Unknown') continue;

    const timestamp = Date.parse(info.releaseDate);
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp > now) continue;
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

function computeUpcomingApps(searchMap, appData) {
  const now = Date.now();
  const upcomingApps = [];

  for (const info of Object.values(appData)) {
    if (!info?.releaseDate || info.releaseDate === 'Unknown') continue;

    const timestamp = Date.parse(info.releaseDate);
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp <= now) continue;

    const searchData = searchMap.get(normalizeName(info.name));
    if (!searchData) continue;

    upcomingApps.push({
      timestamp,
      url: searchData.url,
      img: searchData.img,
      name: searchData.name,
      description: searchData.description || '',
      releaseDateText: formatReleaseDate(timestamp),
    });
  }

  upcomingApps.sort((a, b) => a.timestamp - b.timestamp);
  return upcomingApps;
}

function renderCardSection(grid, section, apps, options = {}) {
  if (!grid || !section) return;

  if (apps.length === 0) {
    grid.replaceChildren();
    section.style.display = 'none';
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const app of apps) {
    fragment.appendChild(createHomepageCard(app, options));
  }

  grid.replaceChildren(fragment);
  section.style.display = 'block';
}

async function loadHomepageSections() {
  const recentGrid = document.getElementById(IDS.RECENT_GRID);
  const recentSection = document.getElementById(IDS.RECENT_SECTION);
  const upcomingGrid = document.getElementById(IDS.UPCOMING_GRID);
  const upcomingSection = document.getElementById(IDS.UPCOMING_SECTION);

  if (!recentGrid || !recentSection) return;

  if (state.inFlightPromise) return state.inFlightPromise;

  const token = ++state.renderToken;

  state.inFlightPromise = (async () => {
    try {
      const { searchIndex, appData } = await fetchHomepageData();
      const searchMap = buildSearchMap(searchIndex);
      const recentApps = computeRecentApps(searchMap, appData);
      const upcomingApps = computeUpcomingApps(searchMap, appData);

      if (token !== state.renderToken) return;

      renderCardSection(recentGrid, recentSection, recentApps);
      renderCardSection(upcomingGrid, upcomingSection, upcomingApps, { isUpcoming: true });
    } catch (error) {
      console.error('Failed to load homepage sections:', error);
    } finally {
      state.inFlightPromise = null;
    }
  })();

  return state.inFlightPromise;
}

loadHomepageSections();

window.addEventListener('pageshow', event => {
  if (event.persisted) {
    loadHomepageSections();
  }
});
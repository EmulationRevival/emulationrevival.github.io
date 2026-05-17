const DATA_VERSION_PATH = '/json/version.json';

let dataVersionCache = null;
let dataVersionPromise = null;

function normalizeDataVersion(value) {
  const normalized = String(value ?? '').trim();
  return normalized || '0';
}

export async function loadDataVersion({ force = false } = {}) {
  if (!force && dataVersionCache) {
    return dataVersionCache;
  }

  if (!force && dataVersionPromise) {
    return dataVersionPromise;
  }

  dataVersionPromise = fetch(DATA_VERSION_PATH, {
    credentials: 'same-origin',
    cache: 'no-cache',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Version fetch failed: ${response.status} ${response.statusText}`);
      }

      return response.json();
    })
    .then(data => {
      dataVersionCache = normalizeDataVersion(data?.version);
      return dataVersionCache;
    })
    .catch(error => {
      dataVersionCache = null;
      dataVersionPromise = null;
      throw error;
    });

  return dataVersionPromise;
}

export function buildVersionedUrl(path, version) {
  const normalizedVersion = normalizeDataVersion(version);
  const separator = String(path).includes('?') ? '&' : '?';
  return `${path}${separator}v=${encodeURIComponent(normalizedVersion)}`;
}

export async function resolveVersionedUrl(path, options) {
  const version = await loadDataVersion(options);
  return buildVersionedUrl(path, version);
}

export async function fetchVersionedJson(path, {
  requestInit = {},
  validate = null,
  errorLabel = path,
} = {}) {
  const requestPath = await resolveVersionedUrl(path);
  const response = await fetch(requestPath, {
    credentials: 'same-origin',
    ...requestInit,
  });

  if (!response.ok) {
    throw new Error(`${errorLabel} fetch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (validate && !validate(data)) {
    throw new Error(`${errorLabel} payload failed validation`);
  }

  return data;
}

export function clearDataVersionCache() {
  dataVersionCache = null;
  dataVersionPromise = null;
}

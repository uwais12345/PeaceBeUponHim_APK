const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const MAX_RESULTS = 40;
const QUERY_RESULT_LIMIT = 100;
const CACHE_TTL_MS = 10 * 60 * 1000;
const OVERPASS_TIMEOUT_MS = 15000;
const PHOTON_TIMEOUT_MS = 10000;
const PHOTON_MIN_INTERVAL_MS = 1100;
const APP_USER_AGENT = 'PeaceBeUponHimApp/1.0 (Islamic app; contact@peacebeuponhim.com)';
const MAX_PLACE_QUERY_LENGTH = 100;
const responseCache = new Map();
let lastPhotonRequestAt = 0;

function cacheKey({ latitude, longitude }, radiusKm) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)},${radiusKm}`;
}

function getSearchBounds({ latitude, longitude }, radiusKm) {
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta = radiusKm / (111.32 * Math.max(Math.abs(Math.cos(latitude * Math.PI / 180)), 0.01));
  return {
    south: Math.max(-90, latitude - latitudeDelta),
    west: Math.max(-180, longitude - longitudeDelta),
    north: Math.min(90, latitude + latitudeDelta),
    east: Math.min(180, longitude + longitudeDelta),
  };
}

function buildPhotonUrl(location, radiusKm) {
  const { south, west, north, east } = getSearchBounds(location, radiusKm);
  const params = new URLSearchParams({
    q: 'mosque',
    bbox: `${west},${south},${east},${north}`,
    lat: String(location.latitude),
    lon: String(location.longitude),
    limit: String(MAX_RESULTS),
  });
  return `https://photon.komoot.io/api/?${params.toString()}`;
}

function buildQuery({ latitude, longitude }, radiusKm) {
  const { south, west, north, east } = getSearchBounds({ latitude, longitude }, radiusKm);
  const bounds = `${south},${west},${north},${east}`;
  return `
    [out:json][timeout:20];
    (
      nwr(${bounds})["amenity"="mosque"];
      nwr(${bounds})["building"="mosque"];
      nwr(${bounds})["amenity"="place_of_worship"]["religion"~"^(muslim|islam)$",i];
    );
    out center tags ${QUERY_RESULT_LIMIT};
  `;
}

function getCoordinates(element) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function getAddress(tags) {
  if (tags['addr:full']) return tags['addr:full'];

  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const locality = [
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return [street, ...locality].filter(Boolean).join(', ') || null;
}

function distanceInMeters(from, to) {
  const radians = degrees => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude))
      * Math.cos(radians(to.latitude))
      * Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

function makeMasjid(element, origin) {
  const coordinates = getCoordinates(element);
  if (!coordinates) return null;

  const tags = element.tags || {};
  const distance = distanceInMeters(origin, coordinates);
  return {
    id: `${element.type}-${element.id}`,
    name: tags.name || tags['name:en'] || null,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distance,
    formattedDistance: formatDistance(distance),
    address: getAddress(tags),
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    openingHours: tags.opening_hours || null,
  };
}

function mapPhotonResult(feature) {
  const properties = feature.properties || {};
  const isMosque = properties.osm_key === 'amenity'
    && ['mosque', 'place_of_worship'].includes(properties.osm_value);
  const isMosqueBuilding = properties.osm_key === 'building' && properties.osm_value === 'mosque';
  if (!isMosque && !isMosqueBuilding) {
    return null;
  }

  const [longitude, latitude] = feature.geometry?.coordinates || [];
  const tags = {
    name: properties.name || null,
    'addr:housenumber': properties.housenumber,
    'addr:street': properties.street,
    'addr:suburb': properties.district || properties.locality,
    'addr:city': properties.city,
    'addr:postcode': properties.postcode,
    phone: properties.phone || properties['contact:phone'],
    website: properties.website || properties['contact:website'],
    opening_hours: properties.opening_hours,
  };

  const osmTypes = { N: 'node', W: 'way', R: 'relation' };
  return {
    type: osmTypes[properties.osm_type] || properties.osm_type,
    id: properties.osm_id,
    lat: Number(latitude),
    lon: Number(longitude),
    tags,
  };
}

function deduplicatePhotonResults(elements) {
  const seen = new Map();
  return elements.filter(element => {
    const name = (element.tags.name || element.tags['name:en'] || '').trim().toLocaleLowerCase();
    if (!name) return true;

    const sameNameResults = seen.get(name) || [];
    const coordinates = { latitude: element.lat, longitude: element.lon };
    if (sameNameResults.some(previous => distanceInMeters(previous, coordinates) <= 50)) return false;
    sameNameResults.push(coordinates);
    seen.set(name, sameNameResults);
    return true;
  });
}

function cacheElements(key, elements) {
  responseCache.set(key, { elements, timestamp: Date.now() });
  if (responseCache.size > 6) {
    responseCache.delete(responseCache.keys().next().value);
  }
  return elements;
}

async function loadPhotonElements(location, radiusKm) {
  const elements = [];
  let successfulSearches = 0;
  let lastError;

  for (const term of ['mosque', 'masjid']) {
    try {
      const params = new URL(buildPhotonUrl(location, radiusKm));
      params.searchParams.set('q', term);
      const features = await fetchPhotonFeatures(params.toString(), 'OpenStreetMap search');
      successfulSearches += 1;
      elements.push(...features.map(mapPhotonResult).filter(Boolean));
    } catch (error) {
      if (error.message.includes('rate-limiting')) throw error;
      lastError = error;
    }
  }

  if (!successfulSearches) throw lastError;
  return deduplicatePhotonResults(elements);
}

async function fetchPhotonFeatures(url, searchName) {
  const requestAt = Math.max(Date.now(), lastPhotonRequestAt + PHOTON_MIN_INTERVAL_MS);
  lastPhotonRequestAt = requestAt;
  const delay = requestAt - Date.now();
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(PHOTON_TIMEOUT_MS),
  });
  if (response.status === 429) {
    throw new Error('Search is busy right now. Please wait a moment and try again.');
  }
  if (!response.ok) {
    throw new Error(`${searchName} is temporarily unavailable. Please try again.`);
  }

  const data = await response.json();
  if (!Array.isArray(data.features)) {
    throw new Error(`${searchName} returned an unexpected response. Please try again.`);
  }
  return data.features;
}

export async function findPlaceCoordinates(query) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || normalizedQuery.length > MAX_PLACE_QUERY_LENGTH) {
    throw new Error(`Enter a town or area name up to ${MAX_PLACE_QUERY_LENGTH} characters.`);
  }

  const params = new URLSearchParams({ q: normalizedQuery, limit: '10' });
  let features;
  try {
    features = await fetchPhotonFeatures(
      `https://photon.komoot.io/api/?${params.toString()}`,
      'Area search',
    );
  } catch (error) {
    if (error.message.includes('Search is busy')) throw error;
    throw new Error('Area search is unavailable right now. Please try again in a moment.');
  }
  const normalizedName = normalizedQuery.toLocaleLowerCase();
  const places = features.filter(({ properties }) => {
    const key = properties?.osm_key;
    return key === 'place' || (key === 'boundary' && properties?.osm_value === 'administrative');
  });
  places.sort((first, second) => {
    const firstProperties = first.properties;
    const secondProperties = second.properties;
    const firstExact = firstProperties.name?.toLocaleLowerCase() === normalizedName ? 1 : 0;
    const secondExact = secondProperties.name?.toLocaleLowerCase() === normalizedName ? 1 : 0;
    const placeRank = value => ({
      suburb: 0,
      neighbourhood: 1,
      quarter: 2,
      city: 3,
      town: 4,
      village: 5,
      hamlet: 6,
    }[value] ?? 7);
    const rankDifference = placeRank(firstProperties.osm_value) - placeRank(secondProperties.osm_value);
    if (rankDifference) return rankDifference;
    return secondExact - firstExact;
  });

  const place = places[0];
  const [longitude, latitude] = place?.geometry?.coordinates || [];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`We couldn’t find “${normalizedQuery}”. Check the spelling or try a nearby town or area.`);
  }

  const { name, district, city, county, state, country } = place.properties;
  const locality = [district, city, county]
    .find(value => value && value.toLocaleLowerCase() !== name?.toLocaleLowerCase());
  return {
    coordinates: { latitude, longitude },
    label: [name || normalizedQuery, locality, state, country].filter(Boolean).join(', '),
  };
}

async function loadNominatimElements(location, radiusKm) {
  const { south, west, north, east } = getSearchBounds(location, radiusKm);
  const results = [];

  for (const term of ['mosque', 'masjid']) {
    try {
      const params = new URLSearchParams({
        q: term,
        format: 'jsonv2',
        bounded: '1',
        viewbox: `${west},${north},${east},${south}`,
        limit: '50',
        addressdetails: '1',
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': APP_USER_AGENT,
          },
          signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
        },
      );
      if (!response.ok) continue;
      const data = await response.json();
      if (!Array.isArray(data)) continue;

      for (const item of data) {
        if (!item.lat || !item.lon) continue;
        results.push({
          type: item.osm_type === 'node' ? 'node' : item.osm_type === 'way' ? 'way' : 'relation',
          id: item.osm_id,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          tags: {
            name: item.display_name?.split(',')[0] || null,
            'addr:city': item.address?.city || item.address?.town || item.address?.village || null,
            'addr:street': item.address?.road || null,
          },
        });
      }
    } catch {
      // continue with next term
    }
  }

  // Deduplicate by osm_id
  const seen = new Set();
  return results.filter(el => {
    const k = `${el.type}-${el.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function loadElements(location, radiusKm, forceRefresh) {
  const key = cacheKey(location, radiusKm);
  const cached = responseCache.get(key);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.elements;

  let lastError;
  try {
    const elements = await loadPhotonElements(location, radiusKm);
    if (elements.length) return cacheElements(key, elements);
  } catch (error) {
    if (error.message.includes('rate-limiting')) throw error;
    lastError = error;
  }

  // Try Overpass API (multiple mirrors)
  const queryStr = buildQuery(location, radiusKm);
  for (const endpoint of OVERPASS_URLS) {
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json',
          'User-Agent': APP_USER_AGENT,
        },
        body: new URLSearchParams({ data: queryStr }),
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;
      continue;
    }

    if (response.status === 429) {
      throw new Error('Search is busy right now. Please wait a moment and try again.');
    }
    if (response.status === 406 || response.status === 400) {
      lastError = new Error(`Overpass endpoint returned ${response.status}`);
      continue;
    }
    if (!response.ok) {
      lastError = new Error(`Overpass endpoint returned ${response.status}`);
      if (response.status < 500) {
        throw new Error('OpenStreetMap is busy right now. Please wait a moment and try again.');
      }
      continue;
    }

    let data;
    try {
      data = await response.json();
    } catch {
      lastError = new Error('Overpass returned invalid JSON');
      continue;
    }
    if (!Array.isArray(data.elements)) {
      lastError = new Error('Overpass response did not include results');
      continue;
    }
    if (data.elements.length > 0) {
      return cacheElements(key, data.elements);
    }
  }

  // Final fallback: Nominatim (OpenStreetMap search API)
  try {
    const elements = await loadNominatimElements(location, radiusKm);
    if (elements.length) return cacheElements(key, elements);
  } catch (nominatimError) {
    lastError = nominatimError;
  }

  if (lastError?.name === 'TimeoutError' || lastError?.name === 'AbortError') {
    throw new Error('Masjid listings are taking longer than expected. Please try again, or search in Google Maps.');
  }
  throw new Error('We couldn’t load masjid listings just now. Please try again, or search in Google Maps.');
}

export async function findNearbyMasjids(location, { radiusKm = 6, forceRefresh = false } = {}) {
  if (!MASJID_RADIUS_OPTIONS_KM.includes(radiusKm)) {
    throw new Error('The nearby search radius is invalid. Please reload and try again.');
  }
  if (
    !Number.isFinite(location?.latitude)
    || !Number.isFinite(location?.longitude)
    || location.latitude < -90
    || location.latitude > 90
    || location.longitude < -180
    || location.longitude > 180
  ) {
    throw new Error('We couldn’t confirm your location. Please try again or search by town or area.');
  }
  const elements = await loadElements(location, radiusKm, forceRefresh);
  const radiusMeters = radiusKm * 1000;
  return elements
    .map(element => makeMasjid(element, location))
    .filter(masjid => masjid && masjid.distance <= radiusMeters)
    .sort((first, second) => first.distance - second.distance)
    .slice(0, MAX_RESULTS);
}

export const MASJID_RADIUS_OPTIONS_KM = [1, 2, 5, 6, 10];

export function getDirectionsUrl(masjid, origin) {
  const destination = `${masjid.latitude},${masjid.longitude}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
  });
  if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function getGoogleMapsSearchUrl(location) {
  const params = new URLSearchParams({
    api: '1',
    query: `masjid near ${location.latitude},${location.longitude}`,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

// ============================================================
// QIBLA CALCULATOR — Pure math, zero React dependencies
// Uses the Great-Circle (orthodromic) bearing formula on WGS-84
// ============================================================

/** Kaaba coordinates — Al-Masjid al-Haram, Makkah al-Mukarramah */
export const KAABA = { lat: 21.422487, lon: 39.826206 };

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const R_EARTH = 6371.0088; // mean Earth radius in km (WGS-84)

/** Keep a compass angle in the [0, 360) range. */
export function normalizeBearing(degrees) {
  return ((degrees % 360) + 360) % 360;
}

/** Shortest signed turn from `from` to `to`, in the [-180, 180) range. */
export function shortestAngleDifference(from, to) {
  return normalizeBearing(to - from + 180) - 180;
}

/**
 * Calculate the Qibla bearing from a user location using the
 * initial-bearing great-circle formula.
 *
 * @param {number} userLat — user latitude in degrees
 * @param {number} userLon — user longitude in degrees
 * @returns {number} bearing in degrees [0, 360)
 */
export function calculateQiblaBearing(userLat, userLon) {
  const φ1 = toRad(userLat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lon - userLon);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return normalizeBearing(toDeg(θ));
}

/**
 * Estimate magnetic declination (in degrees) for a given location.
 * Positive = East, Negative = West.
 * Uses the geomagnetic dipole model approximation.
 */
export function estimateMagneticDeclination(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 0;
  // Approximate geomagnetic North Pole coordinates (recent WMM epoch)
  const POLE_LAT = 86.5;
  const POLE_LON = 164.0;

  const φ1 = toRad(lat);
  const φ2 = toRad(POLE_LAT);
  const Δλ = toRad(POLE_LON - lon);

  const y = Math.cos(φ2) * Math.sin(Δλ);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const declination = toDeg(Math.atan2(y, x));
  return shortestAngleDifference(0, declination);
}

/**
 * Calculate the shortest turn direction from current heading to target.
 * Handles 0°/360° wrap-around correctly.
 *
 * @param {number} heading   — current device heading [0, 360)
 * @param {number} bearing   — target Qibla bearing [0, 360)
 * @returns {{ direction: 'clockwise'|'anticlockwise'|'aligned', degrees: number, diff: number }}
 */
export function calculateTurnDirection(heading, bearing, alignedThreshold = 5) {
  const normHeading = normalizeBearing(heading);
  const normBearing = normalizeBearing(bearing);
  const diff = shortestAngleDifference(normHeading, normBearing);
  const absDiff = Math.abs(diff);

  if (absDiff <= alignedThreshold) {
    return { direction: 'aligned', degrees: absDiff, diff };
  }

  return {
    direction: diff > 0 ? 'clockwise' : 'anticlockwise',
    degrees: absDiff,
    diff,
  };
}

/**
 * Apply entry/exit hysteresis so small sensor fluctuations do not flicker the
 * success state. Enter at `enterThreshold`; leave only after `exitThreshold`.
 */
export function getAlignmentState(difference, wasAligned, enterThreshold = 5, exitThreshold = 8) {
  const absDifference = Math.abs(difference);
  if (wasAligned && absDifference <= exitThreshold) return 'aligned';
  if (absDifference <= enterThreshold) return 'aligned';
  return absDifference <= 15 ? 'near' : 'not-aligned';
}

/**
 * Calculate the great-circle distance to the Kaaba using the Haversine formula.
 *
 * @param {number} userLat
 * @param {number} userLon
 * @returns {number} distance in kilometres
 */
export function calculateDistanceToKaaba(userLat, userLon) {
  const φ1 = toRad(userLat);
  const φ2 = toRad(KAABA.lat);
  const Δφ = toRad(KAABA.lat - userLat);
  const Δλ = toRad(KAABA.lon - userLon);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH * c;
}

/**
 * Apply a circular IIR exponential smoothing filter.
 * Handles the 0°/360° wrap-around boundary correctly.
 *
 * @param {number|null} prev   — previous smoothed value (null on first call)
 * @param {number}      raw    — new raw sensor reading [0, 360)
 * @param {number}      alpha  — smoothing factor, default 0.15
 * @returns {number} smoothed value [0, 360)
 */
export function smoothHeading(prev, raw, alpha = 0.15) {
  if (prev === null || prev === undefined) return raw;
  const Δ = shortestAngleDifference(prev, raw);
  return normalizeBearing(prev + alpha * Δ);
}

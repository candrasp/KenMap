/**
 * geocodeLocal.js
 * Menentukan nama desa dari koordinat (lat, lng) menggunakan data lokal
 * data-desa.geojson — tanpa panggilan ke API eksternal.
 *
 * Algoritma: Ray casting (point-in-polygon) untuk setiap polygon desa.
 * GeoJSON dimuat sekali saat modul ini pertama kali di-require (di-cache Node.js).
 */

const path = require('path');
const fs = require('fs');

// ─── Load GeoJSON sekali saja ────────────────────────────────────────────────
let desaFeatures = [];

try {
  const filePath = path.join(__dirname, '..', 'public', 'data-desa.geojson');
  const raw = fs.readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(raw);
  desaFeatures = geojson.features || [];
  console.log(`[geocodeLocal] Loaded ${desaFeatures.length} desa polygons.`);
} catch (err) {
  console.error('[geocodeLocal] Gagal membaca data-desa.geojson:', err.message);
}

// ─── Point-in-polygon (ray casting) ─────────────────────────────────────────
/**
 * Cek apakah titik (px, py) berada di dalam polygon 2D.
 * Ring = array of [lng, lat, (z)] dari GeoJSON.
 */
function pointInRing(px, py, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Cek apakah titik berada di dalam MultiPolygon.
 * MultiPolygon = array of Polygon, Polygon = array of rings, ring[0] = outer ring.
 */
function pointInMultiPolygon(lng, lat, multiPolygon) {
  for (const polygon of multiPolygon) {
    const outerRing = polygon[0];
    if (pointInRing(lng, lat, outerRing)) {
      return true;
    }
  }
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Mengembalikan nama desa dari koordinat (lat, lng).
 * Format kembalian: "Desa Babadan, Kec. Babadan" atau null jika tidak ditemukan.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {string|null}
 */
function getDesaFromCoordinates(lat, lng) {
  if (!desaFeatures.length) return null;

  for (const feature of desaFeatures) {
    const geom = feature.geometry;
    if (!geom) continue;

    let found = false;

    if (geom.type === 'MultiPolygon') {
      found = pointInMultiPolygon(lng, lat, geom.coordinates);
    } else if (geom.type === 'Polygon') {
      const outerRing = geom.coordinates[0];
      found = pointInRing(lng, lat, outerRing);
    }

    if (found) {
      const p = feature.properties;
      const desa = p.kel_desa || `Ds. ${p.ori_name}` || '';
      const kec = p.kecamatan ? `Kec. ${p.kecamatan}` : '';
      return [desa, kec].filter(Boolean).join(', ');
    }
  }

  return null; // koordinat di luar semua polygon desa
}

module.exports = { getDesaFromCoordinates };

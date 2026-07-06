import { mkdir, writeFile } from 'node:fs/promises';

const bbox = {
  south: 13.8187094,
  west: 100.5109605,
  north: 13.8249109,
  east: 100.5170581,
};

const query = `
[out:json][timeout:25];
(
  way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  relation["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
);
out tags geom;
`;

const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Codex KMUTNB campus navigator setup',
  },
  body: new URLSearchParams({ data: query }),
});

if (!response.ok) {
  throw new Error(`Overpass returned ${response.status}`);
}

const overpass = await response.json();
const features = overpass.elements
  .filter((element) => element.type === 'way' && element.geometry?.length > 3)
  .map((element, index) => {
    const ring = element.geometry.map((point) => [point.lon, point.lat]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push(first);
    }

    const name =
      element.tags?.['name:en'] ||
      element.tags?.name ||
      element.tags?.['name:th'] ||
      `Campus building ${index + 1}`;

    return {
      type: 'Feature',
      id: element.id,
      properties: {
        osm_id: element.id,
        name,
        name_th: element.tags?.['name:th'] || element.tags?.name || '',
        name_en: element.tags?.['name:en'] || '',
        building: element.tags?.building || 'yes',
        levels: element.tags?.['building:levels'] || '',
        source: 'OpenStreetMap',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
    };
  });

features.sort((a, b) => String(a.properties.name).localeCompare(String(b.properties.name), 'th'));

const collection = {
  type: 'FeatureCollection',
  name: 'KMUTNB campus buildings',
  bbox: [bbox.west, bbox.south, bbox.east, bbox.north],
  metadata: {
    campus: "King Mongkut's University of Technology North Bangkok",
    source: 'OpenStreetMap contributors via Overpass API',
    source_timestamp: overpass.osm3s?.timestamp_osm_base || null,
    license: 'ODbL 1.0',
  },
  features,
};

await mkdir('src/data', { recursive: true });
await writeFile('src/data/kmutnb-buildings.json', `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote ${features.length} KMUTNB building footprints.`);

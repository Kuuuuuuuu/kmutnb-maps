import type { BuildingFeature, LngLat } from '../types/geo';

export const CAMPUS_CENTER: LngLat = [100.5131602, 13.8218432];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [100.5109605, 13.8187094],
  [100.5170581, 13.8248100],
];
export const MAIN_GATE: LngLat = [100.51372, 13.81886];

export function polygonCenter(feature: BuildingFeature): LngLat {
  const ring = feature.geometry.coordinates[0];
  const totals = ring.reduce(
    (acc, coord) => {
      acc.lng += coord[0];
      acc.lat += coord[1];
      return acc;
    },
    { lng: 0, lat: 0 },
  );

  return [totals.lng / ring.length, totals.lat / ring.length];
}

export function polygonBounds(feature: BuildingFeature): [[number, number], [number, number]] {
  const ring = feature.geometry.coordinates[0];
  const lngs = ring.map((coord) => coord[0]);
  const lats = ring.map((coord) => coord[1]);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export function compactBuildingName(feature: BuildingFeature): string {
  return feature.properties.name_en || feature.properties.name || feature.properties.name_th || 'Campus building';
}

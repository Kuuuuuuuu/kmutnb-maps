import type { BuildingFeature, LngLat, RouteStep } from "../types/geo";

export const CAMPUS_CENTER: LngLat = [100.5131602, 13.8218432];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [100.5109605, 13.8187094],
  [100.5170581, 13.82481],
];
export const MAIN_GATE: LngLat = [100.51372, 13.81886];

// How far past the campus edge the map may pan, and how close someone must be
// for live turn-by-turn. One value for both, so the camera can always reach
// anyone the app is actively navigating (maxBounds would otherwise pin it to
// the campus edge while the user's dot sits off-screen).
const CAMPUS_NEARBY_METERS = 150;
const METERS_PER_DEGREE = 111_320;
const latPad = CAMPUS_NEARBY_METERS / METERS_PER_DEGREE;
const lngPad =
  CAMPUS_NEARBY_METERS /
  (METERS_PER_DEGREE * Math.cos((CAMPUS_CENTER[1] * Math.PI) / 180));

export const CAMPUS_PAN_BOUNDS: [[number, number], [number, number]] = [
  [CAMPUS_BOUNDS[0][0] - lngPad, CAMPUS_BOUNDS[0][1] - latPad],
  [CAMPUS_BOUNDS[1][0] + lngPad, CAMPUS_BOUNDS[1][1] + latPad],
];

export function isNearCampus([lng, lat]: LngLat): boolean {
  const [[west, south], [east, north]] = CAMPUS_PAN_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

// Hands the trip to the campus off to Google Maps; origin is left out so it
// uses the device's own location.
export function mainGateDirectionsUrl(): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", `${MAIN_GATE[1]},${MAIN_GATE[0]}`);
  return url.toString();
}

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

export function polygonBounds(
  feature: BuildingFeature,
): [[number, number], [number, number]] {
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
  return (
    feature.properties.name_en ||
    feature.properties.name ||
    feature.properties.name_th ||
    "Campus building"
  );
}

export function formatRouteInstruction(step?: RouteStep): string {
  if (!step || step.type === "depart") {
    return step?.name
      ? `Head toward ${step.name}`
      : "Follow the highlighted route";
  }

  if (step.type === "arrive") {
    return "Arrive at your destination";
  }

  const modifier = step.modifier?.replaceAll("-", " ");
  const action =
    step.type === "turn"
      ? "Turn"
      : step.type === "merge"
        ? "Merge"
        : step.type === "fork"
          ? "Keep"
          : step.type === "roundabout"
            ? "Take the roundabout"
            : "Continue";
  const direction = modifier ? ` ${modifier}` : "";
  const road = step.name ? ` onto ${step.name}` : "";

  return `${action}${direction}${road}`;
}

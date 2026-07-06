import type { Feature, LineString } from "geojson";
import type { LngLat, RouteSummary } from "../types/geo";

type RouteResult = {
  route: Feature<LineString>;
  summary: RouteSummary;
};

const profiles = ["foot", "walking", "driving"];

export async function getRoute(
  start: LngLat,
  end: LngLat,
  originLabel: string,
): Promise<RouteResult> {
  let lastError: unknown;

  for (const profile of profiles) {
    try {
      const url = new URL(
        `https://router.project-osrm.org/route/v1/${profile}/${start.join(",")};${end.join(",")}`,
      );
      url.searchParams.set("overview", "full");
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("steps", "false");

      const response = await fetch(url);
      const payload = await response.json();

      if (!response.ok || payload.code !== "Ok" || !payload.routes?.[0]) {
        throw new Error(payload.message || `OSRM ${profile} route failed`);
      }

      const selected = payload.routes[0];
      return {
        route: {
          type: "Feature",
          properties: { profile },
          geometry: selected.geometry,
        },
        summary: {
          distanceMeters: selected.distance,
          durationSeconds: selected.duration,
          profile,
          originLabel,
        },
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to calculate route");
}

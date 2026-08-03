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

  // TODO: FIX IT TO START FROM ONLY MAIN ENTRANCE of university
  for (const profile of profiles) {
    try {
      const url = new URL(
        `https://router.project-osrm.org/route/v1/${profile}/${start.join(",")};${end.join(",")}`,
      );
      url.searchParams.set("overview", "full");
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("steps", "true");

      const response = await fetch(url);
      const payload = await response.json();

      if (!response.ok || payload.code !== "Ok" || !payload.routes?.[0]) {
        throw new Error(payload.message || `OSRM ${profile} route failed`);
      }

      const selected = payload.routes[0];
      const steps = (selected.legs || []).flatMap(
        (leg: {
          steps?: Array<{
            distance?: number;
            duration?: number;
            name?: string;
            maneuver?: { type?: string; modifier?: string };
          }>;
        }) =>
          (leg.steps || []).map((step) => ({
            distanceMeters: step.distance || 0,
            durationSeconds: step.duration || 0,
            name: step.name || "",
            type: step.maneuver?.type || "continue",
            modifier: step.maneuver?.modifier,
          })),
      );

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
          steps,
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

import type { Feature, LineString } from "geojson";
import type { LngLat, RouteSummary } from "../types/geo";

type RouteResult = {
  route: Feature<LineString>;
  summary: RouteSummary;
};

const profiles = ["foot", "driving"];
const routeCache = new Map<
  string,
  { expiresAt: number; result: RouteResult }
>();
const inFlightRoutes = new Map<string, Promise<RouteResult>>();
const ROUTE_CACHE_TTL_MS = 20_000;
const ROUTE_CACHE_MAX_ENTRIES = 24;
const ROUTE_TIMEOUT_MS = 7_000;

export async function getRoute(
  start: LngLat,
  end: LngLat,
  originLabel: string,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const key = routeKey(start, end);
  const cached = routeCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return withOriginLabel(cached.result, originLabel);
  }

  if (cached) {
    routeCache.delete(key);
  }

  const existingRequest = inFlightRoutes.get(key);
  if (existingRequest) {
    return existingRequest.then((result) => withOriginLabel(result, originLabel));
  }

  const request = requestRoute(start, end, originLabel, signal);
  inFlightRoutes.set(key, request);

  try {
    const result = await request;
    routeCache.set(key, {
      expiresAt: Date.now() + ROUTE_CACHE_TTL_MS,
      result,
    });
    trimCache();
    return result;
  } finally {
    inFlightRoutes.delete(key);
  }
}

async function requestRoute(
  start: LngLat,
  end: LngLat,
  originLabel: string,
  signal?: AbortSignal,
): Promise<RouteResult> {
  let lastError: unknown;

  for (const profile of profiles) {
    try {
      const url = new URL(
        `https://router.project-osrm.org/route/v1/${profile}/${start.join(",")};${end.join(",")}`,
      );
      url.searchParams.set("overview", "full");
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("steps", "true");

      const response = await fetchWithTimeout(url, signal);
      const payload = await response.json();

      if (!response.ok || payload.code !== "Ok" || !payload.routes?.[0]) {
        throw new Error(payload.message || `OSRM ${profile} route failed`);
      }

      const selected = payload.routes[0];
      let startDistanceMeters = 0;
      const steps = (selected.legs || []).flatMap(
        (leg: {
          steps?: Array<{
            distance?: number;
            duration?: number;
            name?: string;
            maneuver?: { type?: string; modifier?: string };
          }>;
        }) =>
          (leg.steps || []).map((step) => {
            const distanceMeters = step.distance || 0;
            const mappedStep = {
              distanceMeters,
              durationSeconds: step.duration || 0,
              name: step.name || "",
              type: step.maneuver?.type || "continue",
              modifier: step.maneuver?.modifier,
              startDistanceMeters,
            };

            startDistanceMeters += distanceMeters;
            return mappedStep;
          }),
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
      if (signal?.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to calculate route");
}

async function fetchWithTimeout(
  url: URL,
  parentSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    ROUTE_TIMEOUT_MS,
  );
  const abortParent = () => controller.abort();
  parentSignal?.addEventListener("abort", abortParent, { once: true });

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } finally {
    window.clearTimeout(timeoutId);
    parentSignal?.removeEventListener("abort", abortParent);
  }
}

function routeKey(start: LngLat, end: LngLat): string {
  return [start, end]
    .flat()
    .map((coordinate) => coordinate.toFixed(5))
    .join(",");
}

function withOriginLabel(result: RouteResult, originLabel: string): RouteResult {
  return {
    ...result,
    summary: {
      ...result.summary,
      originLabel,
    },
  };
}

function trimCache() {
  while (routeCache.size > ROUTE_CACHE_MAX_ENTRIES) {
    const oldestKey = routeCache.keys().next().value as string | undefined;
    if (!oldestKey) {
      return;
    }
    routeCache.delete(oldestKey);
  }
}

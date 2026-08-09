import type { Feature, LineString } from "geojson";
import type { LngLat, RouteStep, RouteSummary } from "../types/geo";

export type RouteProgress = {
  distanceAlongRouteMeters: number;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  distanceToRouteMeters: number;
  distanceToDestinationMeters: number;
  nextStep?: RouteStep;
  nextStepDistanceMeters: number;
  isArrived: boolean;
};

export function getRouteProgress(
  route: Feature<LineString>,
  summary: RouteSummary,
  position: LngLat,
): RouteProgress {
  const coordinates = route.geometry.coordinates as LngLat[];

  if (coordinates.length < 2) {
    return {
      distanceAlongRouteMeters: 0,
      remainingDistanceMeters: summary.distanceMeters,
      remainingDurationSeconds: summary.durationSeconds,
      distanceToRouteMeters: Number.POSITIVE_INFINITY,
      distanceToDestinationMeters: Number.POSITIVE_INFINITY,
      nextStep: summary.steps.find((step) => step.type !== "depart"),
      nextStepDistanceMeters: 0,
      isArrived: false,
    };
  }

  let traveledMeters = 0;
  let closest = {
    distanceMeters: Number.POSITIVE_INFINITY,
    distanceAlongRouteMeters: 0,
  };

  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    const segmentLength = distanceBetween(start, end);
    const projection = projectOnSegment(position, start, end);
    const candidateDistance = distanceBetween(position, projection.point);

    if (candidateDistance < closest.distanceMeters) {
      closest = {
        distanceMeters: candidateDistance,
        distanceAlongRouteMeters:
          traveledMeters + segmentLength * projection.ratio,
      };
    }

    traveledMeters += segmentLength;
  }

  const distanceAlongRouteMeters = Math.min(
    Math.max(closest.distanceAlongRouteMeters, 0),
    Math.max(summary.distanceMeters, traveledMeters),
  );
  const remainingDistanceMeters = Math.max(
    0,
    summary.distanceMeters - distanceAlongRouteMeters,
  );
  const remainingDurationSeconds = remainingDuration(
    summary.steps,
    distanceAlongRouteMeters,
  );
  const nextStep = getNextStep(summary.steps, distanceAlongRouteMeters);
  const nextStepDistanceMeters = getNextStepDistance(
    nextStep,
    distanceAlongRouteMeters,
  );
  const distanceToDestinationMeters = distanceBetween(
    position,
    coordinates[coordinates.length - 1],
  );

  return {
    distanceAlongRouteMeters,
    remainingDistanceMeters,
    remainingDurationSeconds,
    distanceToRouteMeters: closest.distanceMeters,
    distanceToDestinationMeters,
    nextStep,
    nextStepDistanceMeters,
    isArrived:
      distanceToDestinationMeters <= 18 || remainingDistanceMeters <= 18, // TODO: remove this hardcoded
  };
}

export function distanceBetween(start: LngLat, end: LngLat): number {
  const earthRadiusMeters = 6371008.8;
  const latDelta = toRadians(end[1] - start[1]);
  const lngDelta = toRadians(end[0] - start[0]);
  const startLat = toRadians(start[1]);
  const endLat = toRadians(end[1]);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function remainingDuration(
  steps: RouteStep[],
  distanceAlongRouteMeters: number,
) {
  return steps.reduce((total, step) => {
    const start = step.startDistanceMeters ?? 0;
    const end = start + step.distanceMeters;

    if (distanceAlongRouteMeters >= end) {
      return total;
    }

    if (distanceAlongRouteMeters <= start || step.distanceMeters <= 0) {
      return total + step.durationSeconds;
    }

    const ratio = (end - distanceAlongRouteMeters) / step.distanceMeters;
    return total + step.durationSeconds * Math.max(0, Math.min(1, ratio));
  }, 0);
}

function getNextStep(steps: RouteStep[], distanceAlongRouteMeters: number) {
  const meaningfulSteps = steps.filter((step) => step.type !== "depart");

  return meaningfulSteps.find((step) => {
    const start = step.startDistanceMeters ?? 0;
    const end = start + step.distanceMeters;
    return distanceAlongRouteMeters <= end + 6;
  });
}

function getNextStepDistance(
  step: RouteStep | undefined,
  distanceAlongRouteMeters: number,
) {
  if (!step) {
    return 0;
  }

  const start = step.startDistanceMeters ?? 0;
  const end = start + step.distanceMeters;

  return distanceAlongRouteMeters < start
    ? Math.max(0, start - distanceAlongRouteMeters)
    : Math.max(0, end - distanceAlongRouteMeters);
}

function projectOnSegment(
  point: LngLat,
  start: LngLat,
  end: LngLat,
): { point: LngLat; ratio: number } {
  const referenceLatitude = toRadians(point[1]);
  const scale = Math.cos(referenceLatitude);
  const startX = start[0] * scale;
  const startY = start[1];
  const endX = end[0] * scale;
  const endY = end[1];
  const pointX = point[0] * scale;
  const pointY = point[1];
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const lengthSquared = deltaX ** 2 + deltaY ** 2;
  const ratio = lengthSquared
    ? Math.max(
        0,
        Math.min(
          1,
          ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
            lengthSquared,
        ),
      )
    : 0;

  return {
    ratio,
    point: [
      start[0] + (end[0] - start[0]) * ratio,
      start[1] + (end[1] - start[1]) * ratio,
    ],
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

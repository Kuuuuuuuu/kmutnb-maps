import type { Feature, FeatureCollection, Geometry, Polygon } from 'geojson';

export type LngLat = [number, number];

export type BuildingProperties = {
  osm_id: number;
  name: string;
  name_th?: string;
  name_en?: string;
  building?: string;
  levels?: string;
  source?: string;
};

export type BuildingFeature = Feature<Polygon, BuildingProperties>;
export type BuildingCollection = FeatureCollection<Geometry, BuildingProperties>;

export type RouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
  profile: string;
  originLabel: string;
};

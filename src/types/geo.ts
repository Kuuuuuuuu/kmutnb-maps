import type { Feature, FeatureCollection, Geometry, Polygon } from "geojson";

export type LngLat = [number, number];
export type Language = "en" | "th";

export type PlaceCategory = "facility" | "amenity" | "event" | "room";

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
export type BuildingCollection = FeatureCollection<
  Geometry,
  BuildingProperties
>;

export type CampusPlace = {
  id: string;
  category: PlaceCategory;
  nameEn: string;
  nameTh: string;
  descriptionEn: string;
  descriptionTh: string;
  coordinates: LngLat;
  shortLabel: string;
  eventDate?: string;
  eventTime?: string;
};

export type SearchResult =
  | { kind: "building"; item: BuildingFeature }
  | { kind: "place"; item: CampusPlace };

export type RouteStep = {
  distanceMeters: number;
  durationSeconds: number;
  name: string;
  type: string;
  modifier?: string;
};

export type RouteSummary = {
  distanceMeters: number;
  durationSeconds: number;
  profile: string;
  originLabel: string;
  steps: RouteStep[];
};

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, Navigation } from "lucide-react";
import { CAMPUS_BOUNDS, CAMPUS_CENTER, polygonBounds } from "../lib/geo";
import { localizedPlaceName, t } from "../lib/i18n";
import type {
  BuildingCollection,
  BuildingFeature,
  CampusPlace,
  Language,
  LngLat,
} from "../types/geo";
import type {
  Feature,
  FeatureCollection,
  LineString,
  Point,
  Polygon,
} from "geojson";

type MapViewProps = {
  buildings: BuildingCollection;
  selected: BuildingFeature | null;
  selectedPlace: CampusPlace | null;
  route: Feature<LineString> | null;
  places: CampusPlace[];
  language: Language;
  colorBlindMode: boolean;
  userLocation: LngLat | null;
  accuracy: number | null;
  navigationActive: boolean;
  onSelectBuilding: (building: BuildingFeature) => void;
  onSelectPlace: (place: CampusPlace) => void;
};

const emptyRoute: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: [] },
};

const campusMask: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
      [
        [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[0][1]],
        [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[1][1]],
        [CAMPUS_BOUNDS[1][0], CAMPUS_BOUNDS[1][1]],
        [CAMPUS_BOUNDS[1][0], CAMPUS_BOUNDS[0][1]],
        [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[0][1]],
      ],
    ],
  },
};

const campusFrame: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[0][1]],
      [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[1][1]],
      [CAMPUS_BOUNDS[1][0], CAMPUS_BOUNDS[1][1]],
      [CAMPUS_BOUNDS[1][0], CAMPUS_BOUNDS[0][1]],
      [CAMPUS_BOUNDS[0][0], CAMPUS_BOUNDS[0][1]],
    ],
  },
};

const campusPanBounds: [[number, number], [number, number]] = [
  [CAMPUS_BOUNDS[0][0] - 0.0005, CAMPUS_BOUNDS[0][1] - 0.0005],
  [CAMPUS_BOUNDS[1][0] + 0.0005, CAMPUS_BOUNDS[1][1] + 0.0005],
];

export function MapView({
  buildings,
  selected,
  selectedPlace,
  route,
  places,
  language,
  colorBlindMode,
  userLocation,
  accuracy,
  navigationActive,
  onSelectBuilding,
  onSelectPlace,
}: MapViewProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const buildingsRef = useRef(buildings);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelectBuilding);
  const onSelectPlaceRef = useRef(onSelectPlace);
  const navigationActiveRef = useRef(navigationActive);
  const followLocationRef = useRef(true);
  const [isFollowingLocation, setIsFollowingLocation] = useState(true);

  buildingsRef.current = buildings;
  placesRef.current = places;
  onSelectRef.current = onSelectBuilding;
  onSelectPlaceRef.current = onSelectPlace;
  navigationActiveRef.current = navigationActive;

  useEffect(() => {
    if (!mapNode.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapNode.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: CAMPUS_CENTER,
      zoom: 17,
      minZoom: 16.2,
      maxZoom: 20.5,
      maxBounds: campusPanBounds,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      renderWorldCopies: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("dragstart", () => {
      if (!navigationActiveRef.current) {
        return;
      }

      followLocationRef.current = false;
      setIsFollowingLocation(false);
    });

    map.on("load", () => {
      map.fitBounds(CAMPUS_BOUNDS, {
        padding: 72,
        duration: 0,
        pitch: 0,
        bearing: 0,
      });

      map.addSource("campus-mask", {
        type: "geojson",
        data: campusMask,
      });

      map.addLayer({
        id: "campus-outside-mask",
        type: "fill",
        source: "campus-mask",
        paint: {
          "fill-color": "#aeb8af",
          "fill-opacity": 0.68,
        },
      });

      map.addSource("campus-frame", {
        type: "geojson",
        data: campusFrame,
      });

      map.addLayer({
        id: "campus-frame-line",
        type: "line",
        source: "campus-frame",
        paint: {
          "line-color": "#2b6655",
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 1.5, 20, 3],
          "line-opacity": 0.64,
        },
      });

      map.addSource("campus-buildings", {
        type: "geojson",
        data: buildingsRef.current,
      });

      map.addLayer({
        id: "campus-building-fill",
        type: "fill",
        source: "campus-buildings",
        paint: {
          "fill-color": buildingColorExpression(colorBlindMode),
          "fill-opacity": 0.46,
        },
      });

      map.addLayer({
        id: "campus-building-line",
        type: "line",
        source: "campus-buildings",
        paint: {
          "line-color": buildingLineColorExpression(colorBlindMode),
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 1, 20, 2.5],
          "line-opacity": 0.76,
        },
      });

      map.addLayer({
        id: "campus-building-selected",
        type: "fill",
        source: "campus-buildings",
        filter: ["==", ["get", "osm_id"], -1],
        paint: {
          "fill-color": "#d9583d",
          "fill-opacity": 0.82,
        },
      });

      map.addLayer({
        id: "campus-building-selected-outline",
        type: "line",
        source: "campus-buildings",
        filter: ["==", ["get", "osm_id"], -1],
        paint: {
          "line-color": "#a83e2b",
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 2, 20, 4],
          "line-opacity": 0.96,
        },
      });

      map.addSource("campus-places", {
        type: "geojson",
        data: placesFeatureCollection(placesRef.current, language),
      });

      map.addLayer({
        id: "campus-place-dot",
        type: "circle",
        source: "campus-places",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 16, 5, 20, 9],
          "circle-color": placeColorExpression(colorBlindMode),
          "circle-stroke-color": "#f7f5ef",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "campus-place-selected",
        type: "circle",
        source: "campus-places",
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-radius": 12,
          "circle-color": "#d9583d",
          "circle-stroke-color": "#fff8eb",
          "circle-stroke-width": 3,
        },
      });

      map.addLayer({
        id: "campus-place-labels",
        type: "symbol",
        source: "campus-places",
        layout: {
          "text-field": ["get", "shortLabel"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 16, 9, 20, 12],
          "text-offset": [0, 1.35],
          "text-anchor": "top",
          "text-font": ["Open Sans Bold"],
        },
        paint: {
          "text-color": "#17231c",
          "text-halo-color": "#f7f5ef",
          "text-halo-width": 1.5,
        },
      });

      map.addSource("route", {
        type: "geojson",
        data: emptyRoute,
      });

      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#f7f5ef",
          "line-width": ["interpolate", ["linear"], ["zoom"], 15, 8, 20, 16],
          "line-opacity": 0.96,
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#2f76c7",
          "line-width": ["interpolate", ["linear"], ["zoom"], 15, 4, 20, 8],
        },
      });

      map.addSource("user-location", {
        type: "geojson",
        data: userLocationFeature(null, null),
      });

      map.addLayer({
        id: "user-accuracy",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 15, 6, 20, 48],
          "circle-color": "#3b82f6",
          "circle-opacity": 0.13,
          "circle-stroke-color": "#3b82f6",
          "circle-stroke-opacity": 0.22,
          "circle-stroke-width": 1,
        },
      });

      map.addLayer({
        id: "user-dot",
        type: "circle",
        source: "user-location",
        paint: {
          "circle-radius": 7,
          "circle-color": "#2f76c7",
          "circle-stroke-color": "#f7f5ef",
          "circle-stroke-width": 3,
        },
      });
    });

    map.on("click", "campus-building-fill", (event) => {
      const feature = event.features?.[0] as BuildingFeature | undefined;
      if (!feature) {
        return;
      }

      const match = buildingsRef.current.features.find(
        (building) => building.properties.osm_id === feature.properties.osm_id,
      ) as BuildingFeature | undefined;

      if (match) {
        onSelectRef.current(match);
      }
    });

    map.on("mouseenter", "campus-building-fill", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "campus-building-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "campus-place-dot", (event) => {
      const feature = event.features?.[0];
      const placeId = feature?.properties?.id;
      const match = placesRef.current.find((place) => place.id === placeId);
      if (match) {
        onSelectPlaceRef.current(match);
      }
    });

    map.on("mouseenter", "campus-place-dot", () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "campus-place-dot", () => {
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!navigationActive) {
      followLocationRef.current = false;
      setIsFollowingLocation(false);
      return;
    }

    followLocationRef.current = true;
    setIsFollowingLocation(true);
  }, [navigationActive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("route") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(route || emptyRoute);

    if (navigationActive && userLocation) {
      return;
    }

    const coordinates = route?.geometry.coordinates;
    if (!coordinates || coordinates.length < 2) {
      return;
    }

    const bounds = coordinates.reduce(
      (currentBounds, coordinate) =>
        currentBounds.extend(coordinate as [number, number]),
      new maplibregl.LngLatBounds(
        coordinates[0] as [number, number],
        coordinates[0] as [number, number],
      ),
    );

    map.fitBounds(bounds, {
      padding: { top: 188, right: 58, bottom: 238, left: 58 },
      duration: navigationActive && userLocation ? 0 : 260,
      maxZoom: 18.6,
      pitch: 0,
      bearing: 0,
    });
  }, [navigationActive, route, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("campus-places") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(placesFeatureCollection(places, language));
  }, [places, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty(
      "campus-place-dot",
      "circle-color",
      placeColorExpression(colorBlindMode),
    );
    map.setPaintProperty(
      "campus-building-fill",
      "fill-color",
      buildingColorExpression(colorBlindMode),
    );
    map.setPaintProperty(
      "campus-building-line",
      "line-color",
      buildingLineColorExpression(colorBlindMode),
    );
  }, [colorBlindMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("user-location") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(userLocationFeature(userLocation, accuracy));

    if (navigationActive && userLocation && followLocationRef.current) {
      map.jumpTo({
        center: userLocation,
        zoom: Math.max(map.getZoom(), 18.2),
      });
    }
  }, [accuracy, navigationActive, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const selectedFilter = [
      "==",
      ["get", "osm_id"],
      selected?.properties.osm_id ?? -1,
    ] as maplibregl.FilterSpecification;

    map.setFilter("campus-building-selected", selectedFilter);
    map.setFilter("campus-building-selected-outline", selectedFilter);

    if (selected) {
      map.fitBounds(polygonBounds(selected), {
        padding: { top: 118, right: 42, bottom: 260, left: 42 },
        duration: 280,
        pitch: 0,
        bearing: 0,
      });
    }
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setFilter("campus-place-selected", [
      "==",
      ["get", "id"],
      selectedPlace?.id ?? "__none__",
    ]);

    if (selectedPlace) {
      map.easeTo({
        center: selectedPlace.coordinates,
        zoom: Math.max(map.getZoom(), 18),
        duration: 260,
      });
    }
  }, [selectedPlace]);

  function centerMap() {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (userLocation) {
      if (navigationActive) {
        followLocationRef.current = true;
        setIsFollowingLocation(true);
      }
      map.easeTo({
        center: userLocation,
        zoom: Math.max(map.getZoom(), 18),
        duration: 260,
      });
      return;
    }

    map.fitBounds(CAMPUS_BOUNDS, {
      padding: 72,
      duration: 260,
      pitch: 0,
      bearing: 0,
    });
  }

  function resetView() {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (navigationActive) {
      followLocationRef.current = false;
      setIsFollowingLocation(false);
    }

    map.easeTo({
      center: selected ? polygonBounds(selected)[0] : CAMPUS_CENTER,
      zoom: selected ? Math.max(map.getZoom(), 18) : 17,
      bearing: 0,
      pitch: 0,
      duration: 260,
    });
  }

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        ref={mapNode}
        aria-label={t(language, "campusMap")}
      />

      <div
        className="absolute right-3 top-[5.25rem] z-10 flex flex-col overflow-hidden rounded-full border border-ink/10 bg-paper shadow-soft md:right-6 md:top-[5.4rem]"
        aria-label={t(language, "mapControls")}
      >
        <button
          className={`grid size-10 place-items-center rounded-none border-0 border-b border-ink/10 transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fern/60 active:scale-95 ${navigationActive && isFollowingLocation ? "bg-ink text-paper" : "bg-transparent text-ink hover:bg-ink/[0.05]"}`}
          type="button"
          onClick={centerMap}
          aria-label={
            navigationActive && !isFollowingLocation
              ? t(language, "followLocation")
              : t(language, "centerMap")
          }
          title={
            navigationActive && !isFollowingLocation
              ? t(language, "followLocation")
              : t(language, "centerMap")
          }
        >
          <LocateFixed aria-hidden="true" size={18} />
        </button>
        <button
          className="grid size-10 place-items-center rounded-none border-0 bg-transparent text-ink transition hover:bg-ink/[0.05] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fern/60 active:scale-95"
          type="button"
          onClick={resetView}
          aria-label={t(language, "resetMap")}
        >
          <Navigation
            aria-hidden="true"
            size={18}
            className="-rotate-[16deg]"
          />
        </button>
      </div>
    </div>
  );
}

type PlaceProperties = {
  id: string;
  category: CampusPlace["category"];
  label: string;
  shortLabel: string;
};

function placesFeatureCollection(
  places: CampusPlace[],
  language: Language,
): FeatureCollection<Point, PlaceProperties> {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      properties: {
        id: place.id,
        category: place.category,
        label: localizedPlaceName(place, language),
        shortLabel: place.shortLabel,
      },
      geometry: {
        type: "Point",
        coordinates: place.coordinates,
      },
    })),
  };
}

function placeColorExpression(colorBlindMode: boolean) {
  return [
    "match",
    ["get", "category"],
    "event",
    colorBlindMode ? "#d55e00" : "#d9583d",
    "facility",
    colorBlindMode ? "#0072b2" : "#2f76c7",
    colorBlindMode ? "#009e73" : "#397969",
  ] as maplibregl.ExpressionSpecification;
}

function buildingColorExpression(colorBlindMode: boolean) {
  return [
    "match",
    ["get", "building"],
    "university",
    colorBlindMode ? "#0072b2" : "#397969",
    "school",
    colorBlindMode ? "#e69f00" : "#4c75a3",
    "dormitory",
    colorBlindMode ? "#cc79a7" : "#bd7b48",
    "yes",
    colorBlindMode ? "#009e73" : "#8a729b",
    colorBlindMode ? "#5d5d5d" : "#70877d",
  ] as maplibregl.ExpressionSpecification;
}

function buildingLineColorExpression(colorBlindMode: boolean) {
  return [
    "match",
    ["get", "building"],
    "university",
    colorBlindMode ? "#004b76" : "#20483c",
    "school",
    colorBlindMode ? "#9a6400" : "#35576f",
    "dormitory",
    colorBlindMode ? "#7f315f" : "#704522",
    "yes",
    colorBlindMode ? "#006b4f" : "#5a4669",
    colorBlindMode ? "#333333" : "#42554b",
  ] as maplibregl.ExpressionSpecification;
}

function userLocationFeature(position: LngLat | null, accuracy: number | null) {
  return {
    type: "Feature" as const,
    properties: accuracy ? { accuracy } : {},
    geometry: {
      type: "Point" as const,
      coordinates: position || [0, 0],
    },
  };
}

import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "preact/hooks";
import { LocateFixed, Minus, Plus, Navigation } from "lucide-preact";
import { CAMPUS_BOUNDS, CAMPUS_CENTER, polygonBounds } from "../lib/geo";
import type { BuildingCollection, BuildingFeature, LngLat } from "../types/geo";
import type { Feature, LineString, Polygon } from "geojson";

type MapViewProps = {
  buildings: BuildingCollection;
  selected: BuildingFeature | null;
  route: Feature<LineString> | null;
  userLocation: LngLat | null;
  accuracy: number | null;
  onSelectBuilding: (building: BuildingFeature) => void;
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
  route,
  userLocation,
  accuracy,
  onSelectBuilding,
}: MapViewProps) {
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const buildingsRef = useRef(buildings);
  const onSelectRef = useRef(onSelectBuilding);

  buildingsRef.current = buildings;
  onSelectRef.current = onSelectBuilding;

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
      pitch: 38,
      bearing: -18,
      attributionControl: false,
      renderWorldCopies: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );

    map.on("load", () => {
      map.fitBounds(CAMPUS_BOUNDS, {
        padding: 72,
        duration: 0,
        pitch: 38,
        bearing: -18,
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
          "fill-color": "#6d6d6d",
          "fill-opacity": 0.9,
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
          "line-color": "#236d5b",
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 2, 20, 5],
          "line-opacity": 0.85,
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
          "fill-color": "#236d5b",
          "fill-opacity": 0.42,
        },
      });

      map.addLayer({
        id: "campus-building-line",
        type: "line",
        source: "campus-buildings",
        paint: {
          "line-color": "#114338",
          "line-width": ["interpolate", ["linear"], ["zoom"], 16, 1, 20, 3],
          "line-opacity": 0.78,
        },
      });

      map.addLayer({
        id: "campus-building-selected",
        type: "fill",
        source: "campus-buildings",
        filter: ["==", ["get", "osm_id"], -1],
        paint: {
          "fill-color": "#e04f2f",
          "fill-opacity": 0.76,
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
          "line-color": "#fff7e0",
          "line-width": ["interpolate", ["linear"], ["zoom"], 15, 8, 20, 16],
          "line-opacity": 0.92,
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
          "line-color": "#1d73d4",
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
          "circle-color": "#1d73d4",
          "circle-stroke-color": "#ffffff",
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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("route") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(route || emptyRoute);
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("user-location") as
      | maplibregl.GeoJSONSource
      | undefined;
    source?.setData(userLocationFeature(userLocation, accuracy));
  }, [userLocation, accuracy]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setFilter("campus-building-selected", [
      "==",
      ["get", "osm_id"],
      selected?.properties.osm_id ?? -1,
    ]);

    if (selected) {
      map.fitBounds(polygonBounds(selected), {
        padding: { top: 118, right: 42, bottom: 260, left: 42 },
        duration: 680,
        pitch: 46,
        bearing: -18,
      });
    }
  }, [selected]);

  function centerMap() {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (userLocation) {
      map.easeTo({
        center: userLocation,
        zoom: Math.max(map.getZoom(), 18),
        duration: 450,
      });
      return;
    }

    map.fitBounds(CAMPUS_BOUNDS, {
      padding: 72,
      duration: 450,
      pitch: 38,
      bearing: -18,
    });
  }

  function resetView() {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.easeTo({
      center: selected ? polygonBounds(selected)[0] : CAMPUS_CENTER,
      zoom: selected ? Math.max(map.getZoom(), 18) : 17,
      bearing: -18,
      pitch: 38,
      duration: 450,
    });
  }

  return (
    <div className="map-shell">
      <div
        className="map-canvas"
        ref={mapNode}
        aria-label="Map of KMUTNB campus"
      />

      <div className="map-hud" aria-label="Map controls">
        <button
          className="map-hud-button primary"
          type="button"
          onClick={centerMap}
          aria-label="Center map on current location"
        >
          <LocateFixed aria-hidden="true" size={18} />
        </button>
        <button
          className="map-hud-button"
          type="button"
          onClick={resetView}
          aria-label="Reset map orientation"
        >
          <Navigation
            aria-hidden="true"
            size={18}
            className="map-hud-compass"
          />
        </button>
      </div>
    </div>
  );
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

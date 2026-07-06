import { MapPinned, Navigation, X } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import buildingData from "./data/kmutnb-buildings.json";
import { BuildingSheet } from "./components/BuildingSheet";
import { MapView } from "./components/MapView";
import { SearchPanel } from "./components/SearchPanel";
import {
  MAIN_GATE,
  compactBuildingName,
  formatDistance,
  formatDuration,
  polygonCenter,
} from "./lib/geo";
import { getRoute } from "./lib/routing";
import { useUserLocation } from "./lib/useUserLocation";
import type {
  BuildingCollection,
  BuildingFeature,
  RouteSummary,
} from "./types/geo";
import type { Feature, LineString } from "geojson";

const buildings = buildingData as unknown as BuildingCollection;

export function App() {
  const [selected, setSelected] = useState<BuildingFeature | null>(null);
  const [routeTarget, setRouteTarget] = useState<BuildingFeature | null>(null);
  const [route, setRoute] = useState<Feature<LineString> | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const userLocation = useUserLocation();

  const namedBuildings = useMemo(
    () =>
      buildings.features
        .filter(
          (feature): feature is BuildingFeature =>
            feature.geometry.type === "Polygon",
        )
        .filter((feature) =>
          Boolean(
            feature.properties.name ||
            feature.properties.name_en ||
            feature.properties.name_th,
          ),
        ),
    [],
  );

  async function refreshRoute(feature: BuildingFeature) {
    const destination = polygonCenter(feature);
    const origin = userLocation.position || MAIN_GATE;
    const originLabel = userLocation.position ? "Your location" : "Main Gate";

    return getRoute(origin, destination, originLabel);
  }

  function routeToBuilding(feature = selected) {
    if (!feature) {
      return;
    }

    setRouteTarget(feature);
    setRouteStatus("loading");
  }

  function cancelRoute() {
    setRouteTarget(null);
    setRoute(null);
    setRouteSummary(null);
    setRouteStatus("idle");
  }

  useEffect(() => {
    if (!routeTarget) {
      return;
    }

    let cancelled = false;

    if (!routeSummary) {
      setRouteStatus("loading");
    }

    refreshRoute(routeTarget)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setRoute(result.route);
        setRouteSummary(result.summary);
        setRouteStatus("idle");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        if (!routeSummary) {
          setRoute(null);
          setRouteSummary(null);
          setRouteStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeTarget, userLocation.position]);

  function handleSelect(feature: BuildingFeature) {
    setSelected(feature);
    setRouteTarget(null);
    setRoute(null);
    setRouteSummary(null);
    setRouteStatus("idle");
  }

  function formatArrivalTime(durationSeconds: number) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(Date.now() + durationSeconds * 1000));
  }

  const isNavigating = Boolean(routeSummary && selected);

  return (
    <main className="app-shell">
      <MapView
        buildings={buildings}
        selected={selected}
        route={route}
        userLocation={userLocation.position}
        accuracy={userLocation.accuracy}
        onSelectBuilding={handleSelect}
      />

      <section className="top-bar" aria-label="Campus navigator">
        <div className="brand-lockup">
          <MapPinned aria-hidden="true" size={21} />
          <div>
            <p>KMUTNB</p>
            <h1>Campus Navigator</h1>
          </div>
        </div>
      </section>

      <SearchPanel
        buildings={namedBuildings}
        selectedId={selected?.properties.osm_id}
        onSelect={handleSelect}
      />

      {selected && !isNavigating && (
        <BuildingSheet
          building={selected}
          routeSummary={routeSummary}
          routeStatus={routeStatus}
          isRouting={
            routeTarget?.properties.osm_id === selected.properties.osm_id &&
            Boolean(routeSummary)
          }
          onRoute={() => routeToBuilding()}
          onCancelRoute={cancelRoute}
          onClose={() => {
            setSelected(null);
            setRouteTarget(null);
            setRoute(null);
            setRouteSummary(null);
            setRouteStatus("idle");
          }}
        />
      )}

      {!selected && routeStatus === "error" && (
        <div className="route-toast" role="status">
          <X aria-hidden="true" size={16} />
          <span>Routing is unavailable right now.</span>
        </div>
      )}

      {isNavigating && routeSummary && selected && (
        <aside className="route-banner" aria-label="Current route">
          <button
            className="route-banner-close"
            type="button"
            onClick={cancelRoute}
            aria-label="Cancel route"
          >
            <X aria-hidden="true" size={16} />
          </button>

          <div className="route-banner-copy">
            <div className="route-banner-title">
              <Navigation
                aria-hidden="true"
                size={18}
                className="route-banner-arrow"
              />
              <strong>{compactBuildingName(selected)}</strong>
            </div>
            <span>
              {formatDuration(routeSummary.durationSeconds)} ·{" "}
              {formatDistance(routeSummary.distanceMeters)} · ETA{" "}
              {formatArrivalTime(routeSummary.durationSeconds)}
            </span>
          </div>
        </aside>
      )}
    </main>
  );
}

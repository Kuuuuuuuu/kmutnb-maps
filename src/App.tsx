import { LocateFixed, MapPinned, Route as RouteIcon, X } from 'lucide-preact';
import { useMemo, useState } from 'preact/hooks';
import buildingData from './data/kmutnb-buildings.json';
import { BuildingSheet } from './components/BuildingSheet';
import { MapView } from './components/MapView';
import { SearchPanel } from './components/SearchPanel';
import { MAIN_GATE, compactBuildingName, formatDistance, polygonCenter } from './lib/geo';
import { getRoute } from './lib/routing';
import { useUserLocation } from './lib/useUserLocation';
import type { BuildingCollection, BuildingFeature, RouteSummary } from './types/geo';
import type { Feature, LineString } from 'geojson';

const buildings = buildingData as unknown as BuildingCollection;

export function App() {
  const [selected, setSelected] = useState<BuildingFeature | null>(null);
  const [route, setRoute] = useState<Feature<LineString> | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeStatus, setRouteStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const userLocation = useUserLocation();

  const namedBuildings = useMemo(
    () =>
      buildings.features
        .filter((feature): feature is BuildingFeature => feature.geometry.type === 'Polygon')
        .filter((feature) => Boolean(feature.properties.name || feature.properties.name_en || feature.properties.name_th)),
    [],
  );

  async function routeToBuilding(feature = selected) {
    if (!feature) {
      return;
    }

    setRouteStatus('loading');
    const destination = polygonCenter(feature);
    const origin = userLocation.position || MAIN_GATE;
    const originLabel = userLocation.position ? 'Your location' : 'Main Gate';

    try {
      const result = await getRoute(origin, destination, originLabel);
      setRoute(result.route);
      setRouteSummary(result.summary);
      setRouteStatus('idle');
    } catch {
      setRoute(null);
      setRouteSummary(null);
      setRouteStatus('error');
    }
  }

  function handleSelect(feature: BuildingFeature) {
    setSelected(feature);
    setRoute(null);
    setRouteSummary(null);
    setRouteStatus('idle');
  }

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
        <div className={`signal ${userLocation.status}`} style="display: 'none'">
          <LocateFixed aria-hidden="true" size={15} />
          <span>{userLocation.position ? 'Live' : userLocation.status === 'denied' ? 'Off' : 'Ready'}</span>
        </div>
      </section>

      <SearchPanel buildings={namedBuildings} selectedId={selected?.properties.osm_id} onSelect={handleSelect} />

      {selected && (
        <BuildingSheet
          building={selected}
          routeSummary={routeSummary}
          routeStatus={routeStatus}
          onRoute={() => routeToBuilding()}
          onClose={() => {
            setSelected(null);
            setRoute(null);
            setRouteSummary(null);
            setRouteStatus('idle');
          }}
        />
      )}

      {!selected && routeStatus === 'error' && (
        <div className="route-toast" role="status">
          <X aria-hidden="true" size={16} />
          <span>Routing is unavailable right now.</span>
        </div>
      )}

      {routeSummary && (
        <aside className="route-pill" aria-label="Current route">
          <RouteIcon aria-hidden="true" size={17} />
          <span>
            {routeSummary.originLabel} · {formatDistance(routeSummary.distanceMeters)} ·{' '}
            {compactBuildingName(selected as BuildingFeature)}
          </span>
        </aside>
      )}
    </main>
  );
}

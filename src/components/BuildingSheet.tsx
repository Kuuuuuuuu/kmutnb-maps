import { Loader2, Navigation, Ruler, X } from "lucide-preact";
import BuildingPreview from "./BuildingPreview";
import {
  compactBuildingName,
  formatDistance,
  formatDuration,
} from "../lib/geo";
import type { BuildingFeature, RouteSummary } from "../types/geo";

type BuildingSheetProps = {
  building: BuildingFeature;
  routeSummary: RouteSummary | null;
  routeStatus: "idle" | "loading" | "error";
  onRoute: () => void;
  onClose: () => void;
};

export function BuildingSheet({
  building,
  routeSummary,
  routeStatus,
  onRoute,
  onClose,
}: BuildingSheetProps) {
  return (
    <aside className="building-sheet" aria-label="Selected building">
      <button
        className="icon-button close"
        type="button"
        onClick={onClose}
        aria-label="Close selected building"
      >
        <X aria-hidden="true" size={18} />
      </button>

      <BuildingPreview building={building} />

      <p className="sheet-kicker">Selected building</p>
      <h2>{compactBuildingName(building)}</h2>
      {building.properties.name_th &&
        building.properties.name_th !== compactBuildingName(building) && (
          <p className="thai-name">{building.properties.name_th}</p>
        )}

      <div className="meta-strip">
        <span>
          <Ruler aria-hidden="true" size={16} />
          {building.properties.levels
            ? `${building.properties.levels} levels`
            : "Footprint mapped"}
        </span>
        <span>#{building.properties.osm_id}</span>
      </div>

      {routeSummary && (
        <div className="route-summary">
          <strong>{formatDuration(routeSummary.durationSeconds)}</strong>
          <span>
            {formatDistance(routeSummary.distanceMeters)} from{" "}
            {routeSummary.originLabel}
          </span>
        </div>
      )}

      {routeStatus === "error" && (
        <p className="route-error">
          OSRM could not calculate a route from this origin.
        </p>
      )}

      <button
        className="route-button"
        type="button"
        onClick={onRoute}
        disabled={routeStatus === "loading"}
      >
        {routeStatus === "loading" ? (
          <Loader2 className="spin" aria-hidden="true" size={18} />
        ) : (
          <Navigation aria-hidden="true" size={18} />
        )}
        <span>
          {routeStatus === "loading" ? "Calculating route" : "Route here"}
        </span>
      </button>
    </aside>
  );
}

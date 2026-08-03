import { Accessibility, Languages, MapPinned, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import buildingData from "./data/kmutnb-buildings.json";
import { campusPlaces } from "./data/campus-places";
import { BuildingSheet } from "./components/BuildingSheet";
import {
  IssueReportDialog,
  type IssueReport,
} from "./components/IssueReportDialog";
import { MapView } from "./components/MapView";
import { NavigationPanel } from "./components/NavigationPanel";
import { PlaceSheet } from "./components/PlaceSheet";
import { SearchPanel } from "./components/SearchPanel";
import { MAIN_GATE, polygonCenter } from "./lib/geo";
import { localizedBuildingName, localizedPlaceName, t } from "./lib/i18n";
import { getRoute } from "./lib/routing";
import { useUserLocation } from "./lib/useUserLocation";
import type {
  BuildingCollection,
  BuildingFeature,
  CampusPlace,
  Language,
  RouteSummary,
  SearchResult,
} from "./types/geo";
import type { Feature, LineString } from "geojson";

const buildings = buildingData as unknown as BuildingCollection;
type RouteTarget = BuildingFeature | CampusPlace;

export function App() {
  const [language, setLanguage] = useState<Language>(() =>
    readStoredLanguage(),
  );
  const [colorBlindMode, setColorBlindMode] = useState(() =>
    readStoredBoolean("kmutnb-color-safe"),
  );
  const [selected, setSelected] = useState<BuildingFeature | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<CampusPlace | null>(null);
  const [routeTarget, setRouteTarget] = useState<RouteTarget | null>(null);
  const [route, setRoute] = useState<Feature<LineString> | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueSaved, setIssueSaved] = useState(false);
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

  const selectedKey = selected
    ? `building-${selected.properties.osm_id}`
    : selectedPlace
      ? `place-${selectedPlace.id}`
      : undefined;
  const isNavigating = Boolean(routeSummary && routeTarget);
  const destinationName = selected
    ? localizedBuildingName(selected, language)
    : selectedPlace
      ? localizedPlaceName(selectedPlace, language)
      : "Campus destination";

  async function refreshRoute(target: RouteTarget) {
    const destination =
      "geometry" in target ? polygonCenter(target) : target.coordinates;
    const origin = userLocation.position || MAIN_GATE;
    const originLabel = userLocation.position
      ? language === "th"
        ? "ตำแหน่งของคุณ"
        : "Your location"
      : language === "th"
        ? "ประตูหลัก"
        : "Main Gate";

    return getRoute(origin, destination, originLabel);
  }

  function startRoute(target: RouteTarget) {
    setRouteTarget(target);
    setRoute(null);
    setRouteSummary(null);
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
    setRouteStatus("loading");

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

        setRoute(null);
        setRouteSummary(null);
        setRouteStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [language, routeTarget, userLocation.position]);

  function clearSelection() {
    setSelected(null);
    setSelectedPlace(null);
    cancelRoute();
  }

  function handleSelectBuilding(building: BuildingFeature) {
    setSelected(building);
    setSelectedPlace(null);
    cancelRoute();
  }

  function handleSelectPlace(place: CampusPlace) {
    setSelected(null);
    setSelectedPlace(place);
    cancelRoute();
  }

  function handleSearchResult(result: SearchResult) {
    if (result.kind === "building") {
      handleSelectBuilding(result.item);
    } else {
      handleSelectPlace(result.item);
    }
  }

  function handleLanguageChange(nextLanguage: Language) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("kmutnb-language", nextLanguage);
  }

  function handleColorSafeChange() {
    setColorBlindMode((current) => {
      const next = !current;
      window.localStorage.setItem("kmutnb-color-safe", String(next));
      return next;
    });
  }

  function handleIssueSubmit(report: IssueReport) {
    // TODO: SEND TO SERVER
    const existing = JSON.parse(
      window.localStorage.getItem("kmutnb-issue-reports") || "[]",
    ) as IssueReport[];
    window.localStorage.setItem(
      "kmutnb-issue-reports",
      JSON.stringify([
        ...existing,
        { ...report, createdAt: new Date().toISOString() },
      ]),
    );
    setIssueOpen(false);
    setIssueSaved(true);
    window.setTimeout(() => setIssueSaved(false), 3600);
  }

  function formatArrivalTime(durationSeconds: number) {
    return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(Date.now() + durationSeconds * 1000));
  }

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#d9e5da] text-ink selection:bg-coral/20">
      <MapView
        buildings={buildings}
        selected={selected}
        selectedPlace={selectedPlace}
        route={route}
        places={campusPlaces}
        language={language}
        colorBlindMode={colorBlindMode}
        userLocation={userLocation.position}
        accuracy={userLocation.accuracy}
        onSelectBuilding={handleSelectBuilding}
        onSelectPlace={handleSelectPlace}
      />

      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute left-3 right-3 top-[max(0.875rem,env(safe-area-inset-top))] z-20 hidden items-start justify-between gap-3 md:flex md:left-6 md:right-6 md:top-[max(1.125rem,env(safe-area-inset-top))]"
        aria-label={t(language, "directory")}
      >
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-[1.05rem] border border-ink/10 bg-paper px-2.5 py-2 shadow-soft">
          <div className="grid size-8 shrink-0 place-items-center rounded-[0.7rem] bg-ink text-paper">
            <MapPinned aria-hidden="true" size={16} strokeWidth={2.4} />
          </div>
          <div className="min-w-0 pr-1">
            <p className="m-0 text-[0.58rem] font-extrabold uppercase tracking-[0.19em] text-fern">
              KMUTNB / NAVIGATION
            </p>
            <h1 className="m-0 truncate font-display text-[1.02rem] font-semibold leading-none tracking-[-0.025em] text-ink">
              {t(language, "campusMap")}
            </h1>
          </div>
        </div>
      </motion.header>

      <div className="absolute right-3 top-[max(0.875rem,env(safe-area-inset-top))] z-30 flex items-center gap-1.5 md:right-6 md:top-[max(1.125rem,env(safe-area-inset-top))]">
        <div
          className="flex items-center overflow-hidden rounded-full border border-ink/10 bg-paper p-1 shadow-soft"
          aria-label={t(language, "language")}
        >
          <Languages
            aria-hidden="true"
            className="mx-1.5 text-ink/45"
            size={15}
          />
          {(["en", "th"] as Language[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleLanguageChange(option)}
              aria-pressed={language === option}
              className={`min-h-8 rounded-full border-0 px-2.5 text-[0.65rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 ${language === option ? "bg-ink text-paper" : "bg-transparent text-ink/55 hover:bg-ink/[0.06]"}`}
            >
              {option === "en" ? "EN" : "ไทย"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleColorSafeChange}
          aria-pressed={colorBlindMode}
          aria-label={
            colorBlindMode
              ? t(language, "colorSafeOn")
              : t(language, "colorSafeOff")
          }
          title={
            colorBlindMode
              ? t(language, "colorSafeOn")
              : t(language, "colorSafeOff")
          }
          className={`grid size-10 place-items-center rounded-full border shadow-soft transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95 ${colorBlindMode ? "border-ink bg-ink text-paper" : "border-ink/10 bg-paper text-ink"}`}
        >
          <Accessibility aria-hidden="true" size={17} />
        </button>
      </div>

      <SearchPanel
        buildings={namedBuildings}
        places={campusPlaces}
        selectedKey={selectedKey}
        language={language}
        onSelect={handleSearchResult}
      />

      <AnimatePresence initial={false}>
        {selected && !isNavigating && (
          <BuildingSheet
            key={`building-${selected.properties.osm_id}`}
            building={selected}
            language={language}
            routeSummary={routeSummary}
            routeStatus={routeStatus}
            isRouting={routeTarget === selected && Boolean(routeTarget)}
            onRoute={() => startRoute(selected)}
            onCancelRoute={cancelRoute}
            onClose={clearSelection}
            onReportIssue={() => setIssueOpen(true)}
          />
        )}
        {selectedPlace && !isNavigating && (
          <PlaceSheet
            key={`place-${selectedPlace.id}`}
            place={selectedPlace}
            language={language}
            routeStatus={routeStatus}
            isRouting={routeTarget === selectedPlace && Boolean(routeTarget)}
            onRoute={() => startRoute(selectedPlace)}
            onCancelRoute={cancelRoute}
            onClose={clearSelection}
            onReportIssue={() => setIssueOpen(true)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!routeTarget && routeStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-40 flex min-h-11 items-center gap-2 rounded-xl border border-coral/20 bg-paper px-3.5 py-2.5 text-[0.8rem] font-bold text-coral shadow-soft md:bottom-5 md:left-1/2 md:right-auto md:w-max md:-translate-x-1/2"
            role="status"
          >
            <X aria-hidden="true" size={16} />
            <span>{t(language, "routeUnavailable")}</span>
          </motion.div>
        )}

        {isNavigating && routeSummary && routeTarget && (
          <NavigationPanel
            key={`route-${targetKey(routeTarget)}`}
            destinationName={destinationName}
            language={language}
            routeSummary={routeSummary}
            arrivalTime={formatArrivalTime(routeSummary.durationSeconds)}
            onExit={cancelRoute}
          />
        )}

        {issueSaved && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-xl border border-fern/20 bg-paper px-4 py-3 text-center text-[0.8rem] font-extrabold text-fern shadow-soft md:left-1/2 md:right-auto md:w-max md:-translate-x-1/2"
            role="status"
          >
            {t(language, "issueSaved")}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {issueOpen && (
          <IssueReportDialog
            language={language}
            building={selected}
            place={selectedPlace}
            onClose={() => setIssueOpen(false)}
            onSubmit={handleIssueSubmit}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function targetKey(target: RouteTarget): string {
  return "geometry" in target ? String(target.properties.osm_id) : target.id;
}

function readStoredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }
  return window.localStorage.getItem("kmutnb-language") === "th" ? "th" : "en";
}

function readStoredBoolean(key: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(key) === "true";
}

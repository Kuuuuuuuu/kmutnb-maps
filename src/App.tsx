import { Accessibility, Languages, MapPinned, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import {
  distanceBetween,
  getRouteProgress,
  type RouteProgress,
} from "./lib/navigation";
import { useUserLocation } from "./lib/useUserLocation";
import { useGsapEntrance } from "./lib/gsap";
import type {
  BuildingCollection,
  BuildingFeature,
  CampusPlace,
  Language,
  LngLat,
  NavigationPhase,
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
  const [routeProgress, setRouteProgress] = useState<RouteProgress | null>(
    null,
  );
  const [navigationPhase, setNavigationPhase] =
    useState<NavigationPhase>("active");
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueSaved, setIssueSaved] = useState(false);
  const userLocation = useUserLocation();
  const routeOriginRef = useRef<LngLat | null>(null);
  const lastRouteRequestAtRef = useRef(0);
  const routeRequestIdRef = useRef(0);
  const rerouteInFlightRef = useRef(false);
  const routeAbortControllerRef = useRef<AbortController | null>(null);
  const headerRef = useGsapEntrance<HTMLElement>("fadeDown");

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

  async function refreshRouteFrom(
    target: RouteTarget,
    origin: LngLat,
    hasLiveLocation = Boolean(userLocation.position),
    signal?: AbortSignal,
  ) {
    const destination =
      "geometry" in target ? polygonCenter(target) : target.coordinates;
    const originLabel = hasLiveLocation
      ? language === "th"
        ? "ตำแหน่งของคุณ"
        : "Your location"
      : language === "th"
        ? "ประตูหลัก"
        : "Main Gate";

    return getRoute(origin, destination, originLabel, signal);
  }

  function startRoute(target: RouteTarget) {
    routeAbortControllerRef.current?.abort();
    setRouteTarget(target);
    setRoute(null);
    setRouteSummary(null);
    setRouteProgress(null);
    setNavigationPhase("active");
    setRouteStatus("loading");
    routeOriginRef.current = null;
    lastRouteRequestAtRef.current = 0;
    routeRequestIdRef.current += 1;
  }

  function cancelRoute() {
    routeAbortControllerRef.current?.abort();
    routeAbortControllerRef.current = null;
    routeRequestIdRef.current += 1;
    setRouteTarget(null);
    setRoute(null);
    setRouteSummary(null);
    setRouteProgress(null);
    setNavigationPhase("active");
    setRouteStatus("idle");
    routeOriginRef.current = null;
    lastRouteRequestAtRef.current = 0;
    rerouteInFlightRef.current = false;
  }

  useEffect(() => {
    if (!routeTarget) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const requestId = ++routeRequestIdRef.current;
    const origin = userLocation.position || MAIN_GATE;
    routeOriginRef.current = origin;
    lastRouteRequestAtRef.current = Date.now();
    routeAbortControllerRef.current = controller;
    setRouteStatus("loading");

    refreshRouteFrom(routeTarget, origin, Boolean(userLocation.position), controller.signal)
      .then((result) => {
        if (
          cancelled ||
          controller.signal.aborted ||
          requestId !== routeRequestIdRef.current
        ) {
          return;
        }

        setRoute(result.route);
        setRouteSummary(result.summary);
        setRouteProgress(
          userLocation.position
            ? getRouteProgress(
                result.route,
                result.summary,
                userLocation.position,
              )
            : null,
        );
        setNavigationPhase("active");
        setRouteStatus("idle");
      })
      .catch(() => {
        if (
          cancelled ||
          controller.signal.aborted ||
          requestId !== routeRequestIdRef.current
        ) {
          return;
        }

        setRoute(null);
        setRouteSummary(null);
        setRouteProgress(null);
        setRouteStatus("error");
      })
      .finally(() => {
        if (routeAbortControllerRef.current === controller) {
          routeAbortControllerRef.current = null;
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (routeAbortControllerRef.current === controller) {
        routeAbortControllerRef.current = null;
      }
    };
  }, [language, routeTarget]);

  useEffect(() => {
    if (!routeTarget || !route || !routeSummary || !userLocation.position) {
      return;
    }

    const position = userLocation.position;
    const progress = getRouteProgress(route, routeSummary, position);
    setRouteProgress(progress);

    if (progress.isArrived) {
      setNavigationPhase("arrived");
      return;
    }

    const accuracyBuffer = Math.max(35, (userLocation.accuracy || 0) * 1.35);
    const isOffRoute = progress.distanceToRouteMeters > accuracyBuffer;
    if (isOffRoute) {
      setNavigationPhase("off-route");
    } else if (navigationPhase === "off-route") {
      setNavigationPhase("active");
    }

    const routeOrigin = routeOriginRef.current || position;
    const movedSinceRouteStart = distanceBetween(routeOrigin, position);
    const cooldownComplete =
      Date.now() - lastRouteRequestAtRef.current >= 12000;
    const needsReroute = movedSinceRouteStart >= 80 || isOffRoute;

    if (!needsReroute || !cooldownComplete || rerouteInFlightRef.current) {
      return;
    }

    rerouteInFlightRef.current = true;
    lastRouteRequestAtRef.current = Date.now();
    const requestId = ++routeRequestIdRef.current;
    const controller = new AbortController();
    routeAbortControllerRef.current = controller;
    setNavigationPhase(isOffRoute ? "off-route" : "recalculating");
    setRouteStatus("loading");

    refreshRouteFrom(routeTarget, position, true, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || requestId !== routeRequestIdRef.current) {
          return;
        }

        routeOriginRef.current = position;
        setRoute(result.route);
        setRouteSummary(result.summary);
        const updatedProgress = getRouteProgress(
          result.route,
          result.summary,
          position,
        );
        setRouteProgress(updatedProgress);
        setNavigationPhase(updatedProgress.isArrived ? "arrived" : "active");
        setRouteStatus("idle");
      })
      .catch(() => {
        if (
          !controller.signal.aborted &&
          requestId === routeRequestIdRef.current
        ) {
          setRouteStatus("idle");
          setNavigationPhase(isOffRoute ? "off-route" : "active");
        }
      })
      .finally(() => {
        rerouteInFlightRef.current = false;
        if (routeAbortControllerRef.current === controller) {
          routeAbortControllerRef.current = null;
        }
      });
  }, [
    navigationPhase,
    route,
    routeSummary,
    routeTarget,
    userLocation.accuracy,
    userLocation.position,
  ]);

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
        navigationActive={isNavigating}
        onSelectBuilding={handleSelectBuilding}
        onSelectPlace={handleSelectPlace}
      />

      <header
        ref={headerRef}
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
      </header>

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

      <>
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
      </>

      <>
        {!routeTarget && routeStatus === "error" && (
          <GsapToast
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-40 flex min-h-11 items-center gap-2 rounded-xl border border-coral/20 bg-paper px-3.5 py-2.5 text-[0.8rem] font-bold text-coral shadow-soft md:bottom-5 md:left-1/2 md:right-auto md:w-max md:-translate-x-1/2"
            role="status"
          >
            <X aria-hidden="true" size={16} />
            <span>{t(language, "routeUnavailable")}</span>
          </GsapToast>
        )}

        {isNavigating && routeSummary && routeTarget && (
          <NavigationPanel
            key={`route-${targetKey(routeTarget)}`}
            destinationName={destinationName}
            language={language}
            routeSummary={routeSummary}
            routeProgress={routeProgress}
            navigationPhase={navigationPhase}
            locationStatus={userLocation.status}
            arrivalTime={formatArrivalTime(
              routeProgress?.remainingDurationSeconds ??
                routeSummary.durationSeconds,
            )}
            onExit={cancelRoute}
          />
        )}

        {issueSaved && (
          <GsapToast
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-xl border border-fern/20 bg-paper px-4 py-3 text-center text-[0.8rem] font-extrabold text-fern shadow-soft md:left-1/2 md:right-auto md:w-max md:-translate-x-1/2"
            role="status"
          >
            {t(language, "issueSaved")}
          </GsapToast>
        )}
      </>

      <>
        {issueOpen && (
          <IssueReportDialog
            language={language}
            building={selected}
            place={selectedPlace}
            onClose={() => setIssueOpen(false)}
            onSubmit={handleIssueSubmit}
          />
        )}
      </>
    </main>
  );
}

function targetKey(target: RouteTarget): string {
  return "geometry" in target ? String(target.properties.osm_id) : target.id;
}

function GsapToast({
  children,
  className,
  role,
}: {
  children: ReactNode;
  className: string;
  role: "status";
}) {
  const toastRef = useGsapEntrance<HTMLDivElement>("toast");

  return (
    <div ref={toastRef} className={className} role={role}>
      {children}
    </div>
  );
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

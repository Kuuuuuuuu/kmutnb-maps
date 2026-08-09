import { AlertTriangle, Loader2, Navigation, Ruler, X } from "lucide-react";
import { useState, type Dispatch, type SetStateAction } from "react";
import { localizedBuildingName, t } from "../lib/i18n";
import { formatDistance } from "../lib/geo";
import { getFloorPlan, type FloorPlan } from "../data/floor-plans";
import { useGsapEntrance, useGsapSpin } from "../lib/gsap";
import type { BuildingFeature, Language, RouteSummary } from "../types/geo";

type BuildingSheetProps = {
  building: BuildingFeature;
  language: Language;
  routeSummary: RouteSummary | null;
  routeStatus: "idle" | "loading" | "error";
  isRouting: boolean;
  onRoute: () => void;
  onCancelRoute: () => void;
  onClose: () => void;
  onReportIssue: () => void;
};

export function BuildingSheet({
  building,
  language,
  routeSummary,
  routeStatus,
  isRouting,
  onRoute,
  onCancelRoute,
  onClose,
  onReportIssue,
}: BuildingSheetProps) {
  const floorCount = Math.min(
    Math.max(Number.parseInt(building.properties.levels || "1", 10) || 1, 1),
    20,
  );
  const [selectedFloor, setSelectedFloor] = useState(1);
  const sheetRef = useGsapEntrance<HTMLElement>("sheetUp");
  const routeSummaryRef = useGsapEntrance<HTMLDivElement>(
    "fadeDown",
    Boolean(routeSummary),
  );
  const loadingIconRef = useGsapSpin<HTMLSpanElement>(
    routeStatus === "loading" && !isRouting,
  );

  return (
    <aside
      ref={sheetRef}
      className="absolute bottom-[max(0.625rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 z-40 max-h-[78vh] overflow-auto rounded-[1.15rem] border border-ink/10 bg-paper p-4 shadow-float md:bottom-6 md:left-auto md:right-6 md:w-[min(25rem,calc(100vw-3rem))] md:max-h-[calc(100vh-2.75rem)] md:p-[1.125rem]"
      aria-label={t(language, "building")}
    >
      <button
        className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full border border-paper/70 bg-paper/90 text-ink transition hover:bg-[#ecebe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95"
        type="button"
        onClick={onClose}
        aria-label={t(language, "close")}
      >
        <X aria-hidden="true" size={16} />
      </button>

      {/* TODO: NEED REAL IMAGE  */}
      <div className="mt-3 pr-9">
        <p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-fern">
          {isRouting
            ? t(language, "navigationActive")
            : t(language, "building")}
        </p>
        <h2 className="m-0 mt-1 font-display text-[1.42rem] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
          {localizedBuildingName(building, language)}
        </h2>
        {building.properties.name_th && language === "en" && (
          <p className="mb-0 mt-1 text-[0.74rem] font-semibold text-ink/[0.55]">
            {building.properties.name_th}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-y border-ink/10 py-2.5 text-[0.72rem] font-bold text-ink/[0.58]">
        <span className="flex items-center gap-1.5">
          <Ruler aria-hidden="true" size={14} />
          {building.properties.levels || "—"} {t(language, "floors")}
        </span>
        <span className="size-1 rounded-full bg-ink/20" />
        <span>Ref #{building.properties.osm_id}</span>
      </div>

      {!isRouting && (
        <section className="mt-4" aria-label={t(language, "floorPlan")}>
          <FloorPlanGraphic
            building={building}
            floor={selectedFloor}
            language={language}
            floorCount={floorCount}
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
          />
        </section>
      )}

      {routeSummary && (
        <div
          ref={routeSummaryRef}
          className="mt-3 flex items-center gap-3 rounded-xl bg-mapblue/[0.08] p-3 text-[#144f95]"
        >
          <Navigation aria-hidden="true" size={17} className="rotate-45" />
          <div className="min-w-0">
            <strong className="block text-[0.92rem] font-extrabold">
              {Math.max(1, Math.round(routeSummary.durationSeconds / 60))}{" "}
              {t(language, "minWalk")}
            </strong>
            <span className="block truncate text-[0.76rem] font-bold">
              {formatDistance(routeSummary.distanceMeters)}{" "}
              {t(language, "from")} {routeSummary.originLabel}
            </span>
          </div>
        </div>
      )}

      {routeStatus === "error" && (
        <p className="mb-0 mt-3 text-[0.78rem] font-bold text-coral">
          {t(language, "routeUnavailable")}
        </p>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 px-4 text-[0.82rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 ${isRouting ? "bg-ink/[0.08] text-ink hover:bg-ink/[0.12]" : "bg-ink text-paper hover:bg-fern"}`}
          type="button"
          onClick={isRouting ? onCancelRoute : onRoute}
          disabled={routeStatus === "loading" && !isRouting}
        >
          {isRouting ? (
            <X aria-hidden="true" size={17} />
          ) : routeStatus === "loading" ? (
            <span ref={loadingIconRef} className="inline-grid">
              <Loader2 aria-hidden="true" size={17} />
            </span>
          ) : (
            <Navigation aria-hidden="true" size={17} />
          )}
          <span>
            {isRouting
              ? t(language, "cancelRoute")
              : routeStatus === "loading"
                ? t(language, "calculatingRoute")
                : t(language, "routeHere")}
          </span>
        </button>
        <button
          type="button"
          onClick={onReportIssue}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-coral/20 bg-coral/10 text-coral transition hover:bg-coral/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 active:scale-95"
          aria-label={t(language, "reportIssue")}
          title={t(language, "reportIssue")}
        >
          <AlertTriangle aria-hidden="true" size={18} />
        </button>
      </div>
    </aside>
  );
}

function FloorPlanGraphic({
  building,
  floor,
  language,
  floorCount,
  selectedFloor,
  setSelectedFloor,
}: {
  building: BuildingFeature;
  floor: number;
  language: Language;
  floorCount: number;
  selectedFloor: number;
  setSelectedFloor: Dispatch<SetStateAction<number>>;
}) {
  const plan = getFloorPlan(building.properties.osm_id, floor);

  if (plan) {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-[0.84rem] font-extrabold text-ink">
              {t(language, "floorPlan")}
            </h3>
            <p className="m-0 mt-0.5 text-[0.68rem] font-semibold text-ink/45">
              {t(language, "chooseFloor")} · {t(language, "floorDataReady")}
            </p>
          </div>
          <span className="rounded-full bg-fern/10 px-2 py-1 text-[0.61rem] font-extrabold uppercase tracking-[0.12em] text-fern">
            F{selectedFloor}
          </span>
        </div>
        <div
          className="mt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
          role="listbox"
          aria-label={t(language, "chooseFloor")}
        >
          {Array.from({ length: floorCount }, (_, index) => index + 1).map(
            (floor) => (
              <button
                key={floor}
                type="button"
                role="option"
                aria-selected={selectedFloor === floor}
                onClick={() => setSelectedFloor(floor)}
                className={`grid size-8 shrink-0 place-items-center rounded-lg border text-[0.7rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 ${selectedFloor === floor ? "border-ink bg-ink text-paper" : "border-ink/10 bg-transparent text-ink/55 hover:bg-fern/10"}`}
              >
                {floor}
              </button>
            ),
          )}
        </div>
        <div className="mt-2 overflow-hidden rounded-xl border border-ink/10 bg-[#eef2ea] p-2">
          {plan ? (
            <EditableFloorPlan plan={plan} floor={floor} language={language} />
          ) : (
            <FootprintFloorState
              building={building}
              floor={floor}
              language={language}
            />
          )}
        </div>
      </>
    );
  } else {
    return <></>;
  }
}

function EditableFloorPlan({
  plan,
  floor,
  language,
}: {
  plan: FloorPlan;
  floor: number;
  language: Language;
}) {
  return (
    <>
      <svg
        viewBox="0 0 320 150"
        className="h-auto w-full"
        role="img"
        aria-label={`${t(language, "floorPlan")} ${floor}`}
      >
        <rect
          x="8"
          y="8"
          width="304"
          height="134"
          rx="10"
          fill="#f9f8f1"
          stroke="#9db3a4"
          strokeWidth="2"
        />
        {plan.rooms.map((room) => (
          <g key={room.id}>
            <rect
              x={room.x * 3.04 + 8}
              y={room.y * 1.34 + 8}
              width={room.width * 3.04}
              height={room.height * 1.34}
              rx="4"
              fill={
                room.kind === "corridor"
                  ? "#dceade"
                  : room.kind === "service"
                    ? "#e3edf3"
                    : "#f0e5d4"
              }
              stroke={
                room.kind === "corridor"
                  ? "#397969"
                  : room.kind === "service"
                    ? "#6d9ab6"
                    : "#bf9671"
              }
              strokeWidth="1.5"
            />
            <text
              x={room.x * 3.04 + 8 + (room.width * 3.04) / 2}
              y={room.y * 1.34 + 8 + (room.height * 1.34) / 2 + 3}
              textAnchor="middle"
              fontSize="7"
              fontWeight="700"
              fill="#20483c"
            >
              {(language === "th" ? room.labelTh : room.labelEn).slice(0, 22)}
            </text>
          </g>
        ))}
      </svg>
      {(plan.noteEn || plan.noteTh) && (
        <p className="mb-0 mt-1 px-1 text-[0.65rem] font-semibold text-ink/50">
          {language === "th" ? plan.noteTh : plan.noteEn}
        </p>
      )}
    </>
  );
}

function FootprintFloorState({
  building,
  floor,
  language,
}: {
  building: BuildingFeature;
  floor: number;
  language: Language;
}) {
  return (
    <>
      <svg
        viewBox="0 0 320 150"
        className="h-auto w-full"
        role="img"
        aria-label={`${t(language, "floorPlan")} ${floor}`}
      >
        <rect
          x="8"
          y="8"
          width="304"
          height="134"
          rx="10"
          fill="#f9f8f1"
          stroke="#9db3a4"
          strokeWidth="2"
        />
        <polygon
          points={buildingFootprintPoints(building)}
          fill="#dceade"
          stroke="#397969"
          strokeWidth="3"
        />
        <text
          x="160"
          y="72"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="#20483c"
        >
          F{floor}
        </text>
        <text
          x="160"
          y="89"
          textAnchor="middle"
          fontSize="8"
          fontWeight="700"
          fill="#397969"
        >
          {t(language, "buildingFootprint")}
        </text>
      </svg>
      <p className="mb-0 mt-2 rounded-lg bg-paper/70 px-2.5 py-2 text-[0.68rem] font-semibold leading-relaxed text-ink/55">
        {t(language, "floorDataReady")} ·{" "}
        <code className="font-bold text-ink/70">src/data/floor-plans.ts</code>
      </p>
    </>
  );
}

function buildingFootprintPoints(building: BuildingFeature): string {
  const ring = building.geometry.coordinates[0];
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = Math.max(maxLng - minLng, 0.0000001);
  const height = Math.max(maxLat - minLat, 0.0000001);
  const scale = Math.min(260 / width, 110 / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  const offsetX = (320 - renderedWidth) / 2;
  const offsetY = (150 - renderedHeight) / 2;

  return ring
    .map(
      ([lng, lat]) =>
        `${(offsetX + (lng - minLng) * scale).toFixed(2)},${(offsetY + (maxLat - lat) * scale).toFixed(2)}`,
    )
    .join(" ");
}

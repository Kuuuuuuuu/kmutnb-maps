import { AlertTriangle, Loader2, Navigation, Ruler, X } from "lucide-react";
import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { localizedBuildingName, t } from "../lib/i18n";
import { formatDistance } from "../lib/geo";
import { getFloorImage, type FloorImage } from "../data/floor-plans";
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
  onReportIssue: (floor: number) => void;
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
  const backdropRef = useGsapEntrance<HTMLDivElement>("modalBackdrop");
  const sheetRef = useGsapEntrance<HTMLElement>("modal");
  const routeSummaryRef = useGsapEntrance<HTMLDivElement>(
    "fadeDown",
    Boolean(routeSummary),
  );
  const loadingIconRef = useGsapSpin<HTMLSpanElement>(
    routeStatus === "loading" && !isRouting,
  );

  return (
    <div
      ref={backdropRef}
      className="absolute inset-0 z-40 grid place-items-center bg-ink/45 p-4"
      onClick={onClose}
    >
    <aside
      ref={sheetRef}
      onClick={(event) => event.stopPropagation()}
      className="relative max-h-[calc(100vh-1.5rem)] w-[min(52rem,calc(100vw-1.5rem))] overflow-auto rounded-[1.5rem] border border-ink/10 bg-paper p-6 shadow-float md:max-h-[calc(100vh-2.5rem)] md:p-9"
      role="dialog"
      aria-modal="true"
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
          onClick={() => onReportIssue(selectedFloor)}
          className="grid min-h-11 min-w-11 place-items-center rounded-lg border border-coral/20 bg-coral/10 text-coral transition hover:bg-coral/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral/40 active:scale-95"
          aria-label={t(language, "reportIssue")}
          title={t(language, "reportIssue")}
        >
          <AlertTriangle aria-hidden="true" size={18} />
        </button>
      </div>
    </aside>
    </div>
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
  const buildingId = building.properties.osm_id;
  const [image, setImage] = useState<FloorImage | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">(
    "loading",
  );

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setImage(null);

    getFloorImage(buildingId, floor)
      .then((result) => {
        if (!active) return;
        if (result) {
          setImage(result);
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch(() => {
        if (active) setStatus("empty");
      });

    return () => {
      active = false;
    };
  }, [buildingId, floor]);

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
        {status === "loading" ? (
          <FloorLoading />
        ) : image ? (
          <FloorImageView image={image} floor={floor} language={language} />
        ) : (
          <EmptyFloorPlaceholder floor={floor} language={language} />
        )}
      </div>
    </>
  );
}

function FloorLoading() {
  return (
    <div className="grid min-h-[22rem] animate-pulse place-items-center rounded-lg bg-[#f9f8f1] text-ink/40 md:min-h-[26rem]">
      <Loader2 aria-hidden="true" size={22} className="animate-spin" />
    </div>
  );
}

function FloorImageView({
  image,
  floor,
  language,
}: {
  image: FloorImage;
  floor: number;
  language: Language;
}) {
  const aspectRatio =
    image.imageWidth && image.imageHeight
      ? `${image.imageWidth} / ${image.imageHeight}`
      : undefined;

  return (
    <img
      src={image.imageUrl}
      alt={`${t(language, "floorPlan")} ${floor}`}
      loading="lazy"
      width={image.imageWidth ?? undefined}
      height={image.imageHeight ?? undefined}
      className="h-auto w-full rounded-lg bg-[#f9f8f1]"
      style={{ aspectRatio }}
    />
  );
}

function EmptyFloorPlaceholder({
  floor,
  language,
}: {
  floor: number;
  language: Language;
}) {
  return (
    <div
      className="grid min-h-[22rem] place-items-center rounded-lg border-2 border-dashed border-ink/15 bg-[#f9f8f1] px-4 py-10 text-center md:min-h-[26rem]"
      role="img"
      aria-label={`${t(language, "floorPlan")} ${floor} — ${t(language, "floorDataPending")}`}
    >
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-fern/10 text-[1.15rem] font-extrabold text-fern">
          F{floor}
        </span>
        <p className="mb-0 mt-4 text-[0.95rem] font-extrabold text-ink/70">
          {t(language, "floorDataPending")}
        </p>
        <p className="mb-0 mt-1.5 text-[0.78rem] font-semibold leading-relaxed text-ink/45">
          {t(language, "floorPlaceholderHint").replace("{floor}", String(floor))}
        </p>
      </div>
    </div>
  );
}


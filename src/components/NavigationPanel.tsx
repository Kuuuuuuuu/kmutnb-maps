import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Flag,
  LocateFixed,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import {
  formatDistance,
  formatDuration,
  formatRouteInstruction,
} from "../lib/geo";
import { t } from "../lib/i18n";
import type {
  Language,
  NavigationPhase,
  RouteStep,
  RouteSummary,
} from "../types/geo";
import type { RouteProgress } from "../lib/navigation";
import { useGsapEntrance } from "../lib/gsap";

type NavigationPanelProps = {
  destinationName: string;
  language: Language;
  routeSummary: RouteSummary;
  routeProgress: RouteProgress | null;
  navigationPhase: NavigationPhase;
  locationStatus: "idle" | "watching" | "denied" | "unavailable";
  // The user is off campus: the route shown starts at the main gate.
  outsideCampus: boolean;
  outsideCampusUrl: string;
  arrivalTime: string;
  onExit: () => void;
};

export function NavigationPanel({
  destinationName,
  language,
  routeSummary,
  routeProgress,
  navigationPhase,
  locationStatus,
  outsideCampus,
  outsideCampusUrl,
  arrivalTime,
  onExit,
}: NavigationPanelProps) {
  const nextStep =
    routeProgress?.nextStep ||
    routeSummary.steps.find((step) => step.type !== "depart");
  const instruction = formatRouteInstruction(nextStep || routeSummary.steps[0]);
  const status = navigationStatus(language, navigationPhase, locationStatus);
  const remainingDistance =
    routeProgress?.remainingDistanceMeters ?? routeSummary.distanceMeters;
  const remainingDuration =
    routeProgress?.remainingDurationSeconds ?? routeSummary.durationSeconds;
  const nextStepDistance =
    routeProgress?.nextStepDistanceMeters ?? nextStep?.distanceMeters;
  const nextInstructionRef = useGsapEntrance<HTMLElement>("navTop");
  const navigationSummaryRef = useGsapEntrance<HTMLElement>("navBottom");

  return (
    <>
      <aside
        ref={nextInstructionRef}
        className="absolute left-3 right-16 top-[max(5.25rem,env(safe-area-inset-top)+4rem)] z-40 md:left-6 md:right-auto md:top-[max(5.4rem,env(safe-area-inset-top)+3.5rem)] md:w-[min(23rem,calc(100vw-3rem))]"
        aria-label={t(language, "nextInstruction")}
      >
        {outsideCampus ? (
          <div className="rounded-[1.1rem] border border-ink bg-ink px-3.5 py-3 text-paper shadow-float">
            <div className="flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-[0.9rem] bg-mapblue text-white shadow-[0_5px_16px_rgba(56,123,198,0.35)]">
                <MapPin aria-hidden="true" size={23} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/[0.58]">
                  <AlertTriangle aria-hidden="true" size={13} />
                  <span>{t(language, "outsideCampus")}</span>
                </div>
                <strong className="mt-1 block text-[0.98rem] leading-tight text-[#f5fff2]">
                  {t(language, "headToMainGate")}
                </strong>
                <span className="mt-1 block text-[0.72rem] font-semibold text-white/[0.68]">
                  {t(language, "liveNavigationOnArrival")}
                </span>
              </div>
            </div>
            <a
              href={outsideCampusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-mapblue px-3.5 text-[0.78rem] font-extrabold text-white no-underline transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.98]"
            >
              <ExternalLink aria-hidden="true" size={15} />
              {t(language, "openInGoogleMaps")}
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-[1.1rem] border border-ink bg-ink px-3.5 py-3 text-paper shadow-float">
            <div className="grid size-12 shrink-0 place-items-center rounded-[0.9rem] bg-mapblue text-white shadow-[0_5px_16px_rgba(56,123,198,0.35)]">
              <ManeuverIcon step={nextStep} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/[0.58]">
                {status.icon}
                <span>{status.label}</span>
              </div>
              <strong className="mt-1 block truncate text-[0.98rem] leading-tight text-[#f5fff2]">
                {navigationPhase === "arrived"
                  ? t(language, "arrived")
                  : instruction}
              </strong>
              {nextStep && navigationPhase !== "arrived" && (
                <span className="mt-1 block text-[0.72rem] font-semibold text-white/[0.68]">
                  {formatDistance(nextStepDistance || nextStep.distanceMeters)}
                </span>
              )}
            </div>
          </div>
        )}
      </aside>

      <aside
        ref={navigationSummaryRef}
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom)+0.875rem)] left-2.5 right-2.5 z-40 rounded-[1.15rem] border border-ink/10 bg-paper p-3 shadow-float md:bottom-6 md:left-6 md:right-auto md:w-[min(28rem,calc(100vw-3rem))]"
        aria-label={t(language, "navigatingTo")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-1 pb-2.5">
          <div className="min-w-0">
            <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-fern">
              {t(language, "navigatingTo")}
            </span>
            <strong className="mt-1 block truncate font-display text-[1.05rem] font-semibold leading-none tracking-[-0.025em] text-ink">
              {destinationName}
            </strong>
            <span className="mt-1 block truncate text-[0.68rem] font-semibold text-ink/50">
              {t(language, "fromLocation")} {routeSummary.originLabel}
            </span>
          </div>
          <button
            className="grid size-9 shrink-0 place-items-center rounded-full border-0 bg-ink text-paper transition hover:bg-[#34443a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95"
            type="button"
            onClick={onExit}
            aria-label={t(language, "endNavigation")}
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink/10 pt-2.5">
          <RouteStat label={t(language, "eta")} value={arrivalTime} />
          <RouteStat
            label={t(language, "time")}
            value={formatDuration(remainingDuration)}
          />
          <RouteStat
            label={t(language, "distance")}
            value={formatDistance(remainingDistance)}
          />
        </div>
      </aside>
    </>
  );
}

function RouteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 first:pl-1 last:pr-1">
      <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink/45">
        {label}
      </span>
      <strong className="mt-1 block truncate text-[0.86rem] font-extrabold leading-none text-ink">
        {value}
      </strong>
    </div>
  );
}

function ManeuverIcon({ step }: { step?: RouteStep }) {
  if (step?.type === "arrive") {
    return <Flag aria-hidden="true" size={23} strokeWidth={2.4} />;
  }

  if (step?.modifier?.includes("left")) {
    return <CornerUpLeft aria-hidden="true" size={24} strokeWidth={2.5} />;
  }

  if (step?.modifier?.includes("right")) {
    return <CornerUpRight aria-hidden="true" size={24} strokeWidth={2.5} />;
  }

  return <ArrowUp aria-hidden="true" size={24} strokeWidth={2.5} />;
}

function navigationStatus(
  language: Language,
  phase: NavigationPhase,
  locationStatus: "idle" | "watching" | "denied" | "unavailable",
) {
  if (phase === "arrived") {
    return {
      label: t(language, "arrived"),
      icon: <CheckCircle2 aria-hidden="true" size={13} />,
    };
  }

  if (phase === "off-route") {
    return {
      label: t(language, "offRoute"),
      icon: <AlertTriangle aria-hidden="true" size={13} />,
    };
  }

  if (phase === "recalculating") {
    return {
      label: t(language, "recalculatingRoute"),
      icon: <RefreshCw aria-hidden="true" size={13} />,
    };
  }

  // iOS Safari reports "denied" on any non-HTTPS origin, so without this the
  // panel sat on "Waiting for GPS" forever while quietly routing from the gate.
  if (locationStatus === "denied" || locationStatus === "unavailable") {
    return {
      label: t(language, "locationOff"),
      icon: <AlertTriangle aria-hidden="true" size={13} />,
    };
  }

  if (locationStatus !== "watching") {
    return {
      label: t(language, "gpsWaiting"),
      icon: <LocateFixed aria-hidden="true" size={13} />,
    };
  }

  return {
    label: t(language, "nextInstruction"),
    icon: <LocateFixed aria-hidden="true" size={13} />,
  };
}

import { ArrowUp, CornerUpLeft, CornerUpRight, Flag, X } from "lucide-react";
import { motion } from "framer-motion";
import {
  formatDistance,
  formatDuration,
  formatRouteInstruction,
} from "../lib/geo";
import { t } from "../lib/i18n";
import type { Language, RouteStep, RouteSummary } from "../types/geo";

type NavigationPanelProps = {
  destinationName: string;
  language: Language;
  routeSummary: RouteSummary;
  arrivalTime: string;
  onExit: () => void;
};

export function NavigationPanel({
  destinationName,
  language,
  routeSummary,
  arrivalTime,
  onExit,
}: NavigationPanelProps) {
  const nextStep = routeSummary.steps.find((step) => step.type !== "depart");
  const instruction = formatRouteInstruction(nextStep || routeSummary.steps[0]);

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, y: -14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-3 right-16 top-[max(5.25rem,env(safe-area-inset-top)+4rem)] z-40 md:left-6 md:right-auto md:top-[max(5.4rem,env(safe-area-inset-top)+3.5rem)] md:w-[min(23rem,calc(100vw-3rem))]"
        aria-label={t(language, "nextInstruction")}
      >
        <div className="flex items-center gap-3 rounded-[1.1rem] border border-ink bg-ink px-3.5 py-3 text-paper shadow-float">
          <div className="grid size-12 shrink-0 place-items-center rounded-[0.9rem] bg-mapblue text-white shadow-[0_5px_16px_rgba(56,123,198,0.35)]">
            <ManeuverIcon step={nextStep} />
          </div>
          <div className="min-w-0">
            <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-white/[0.58]">
              {t(language, "nextInstruction")}
            </span>
            <strong className="mt-1 block truncate text-[0.98rem] leading-tight text-[#f5fff2]">
              {instruction}
            </strong>
            {nextStep && (
              <span className="mt-1 block text-[0.72rem] font-semibold text-white/[0.68]">
                {formatDistance(nextStep.distanceMeters)}
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      <motion.aside
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.35, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
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
            value={formatDuration(routeSummary.durationSeconds)}
          />
          <RouteStat
            label={t(language, "distance")}
            value={formatDistance(routeSummary.distanceMeters)}
          />
        </div>
      </motion.aside>
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

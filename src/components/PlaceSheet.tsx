import {
  AlertTriangle,
  CalendarDays,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { localizedPlaceDescription, localizedPlaceName, t } from "../lib/i18n";
import type { CampusPlace, Language } from "../types/geo";

type PlaceSheetProps = {
  place: CampusPlace;
  language: Language;
  routeStatus: "idle" | "loading" | "error";
  isRouting: boolean;
  onRoute: () => void;
  onCancelRoute: () => void;
  onClose: () => void;
  onReportIssue: () => void;
};

export function PlaceSheet({
  place,
  language,
  routeStatus,
  isRouting,
  onRoute,
  onCancelRoute,
  onClose,
  onReportIssue,
}: PlaceSheetProps) {
  const categoryLabel = t(language, place.category);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 22, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-[max(0.625rem,env(safe-area-inset-bottom))] left-2.5 right-2.5 z-40 rounded-[1.15rem] border border-ink/10 bg-paper p-4 shadow-float md:bottom-6 md:left-auto md:right-6 md:w-[min(23rem,calc(100vw-3rem))]"
      aria-label={categoryLabel}
    >
      <button
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-ink/10 bg-paper text-ink transition hover:bg-[#ecebe4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95"
        type="button"
        onClick={onClose}
        aria-label={t(language, "close")}
      >
        <X aria-hidden="true" size={16} />
      </button>
      <div className="flex items-start gap-3 pr-9">
        <div className="grid size-14 shrink-0 place-items-center rounded-[0.9rem] bg-fern/10 text-fern">
          {place.category === "event" ? (
            <CalendarDays aria-hidden="true" size={24} />
          ) : (
            <MapPin aria-hidden="true" size={24} />
          )}
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="m-0 text-[0.6rem] font-extrabold uppercase tracking-[0.16em] text-fern">
            {categoryLabel}
          </p>
          <h2 className="m-0 mt-1 font-display text-[1.32rem] font-semibold leading-[1.03] tracking-[-0.03em] text-ink">
            {localizedPlaceName(place, language)}
          </h2>
        </div>
      </div>
      <p className="mb-0 mt-4 text-[0.82rem] font-semibold leading-relaxed text-ink/65">
        {localizedPlaceDescription(place, language)}
      </p>
      {(place.eventDate || place.eventTime) && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-coral/10 px-3 py-2.5 text-[0.75rem] font-extrabold text-coral">
          <CalendarDays aria-hidden="true" size={15} />
          <span>
            {[place.eventDate, place.eventTime].filter(Boolean).join(" · ")}
          </span>
        </div>
      )}
      {routeStatus === "error" && (
        <p className="mb-0 mt-3 text-[0.78rem] font-bold text-coral">
          {t(language, "routeUnavailable")}
        </p>
      )}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 px-4 text-[0.82rem] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 ${isRouting ? "bg-ink/[0.08] text-ink hover:bg-ink/[0.12]" : "bg-ink text-paper hover:bg-fern"}`}
          type="button"
          onClick={isRouting ? onCancelRoute : onRoute}
          disabled={routeStatus === "loading" && !isRouting}
        >
          {isRouting ? (
            <X aria-hidden="true" size={17} />
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
    </motion.aside>
  );
}

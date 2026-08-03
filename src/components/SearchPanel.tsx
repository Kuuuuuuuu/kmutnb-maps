import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Droplets,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { localizedBuildingName, localizedPlaceName, t } from "../lib/i18n";
import type {
  BuildingFeature,
  CampusPlace,
  Language,
  SearchResult,
} from "../types/geo";
import BuildingPreview from "./BuildingPreview";

type SearchPanelProps = {
  buildings: BuildingFeature[];
  places: CampusPlace[];
  selectedKey?: string;
  language: Language;
  onSelect: (result: SearchResult) => void;
};

export function SearchPanel({
  buildings,
  places,
  selectedKey,
  language,
  onSelect,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th");
    const buildingResults: SearchResult[] = buildings.map((item) => ({
      kind: "building",
      item,
    }));
    const placeResults: SearchResult[] = places.map((item) => ({
      kind: "place",
      item,
    }));
    const all = normalized
      ? [...buildingResults, ...placeResults]
      : [...buildingResults.slice(0, 10), ...placeResults];

    return all
      .filter((result) => {
        if (!normalized) {
          return true;
        }

        const haystack =
          result.kind === "building"
            ? [
                result.item.properties.name,
                result.item.properties.name_en,
                result.item.properties.name_th,
                result.item.properties.osm_id,
              ]
            : [result.item.nameEn, result.item.nameTh, result.item.category];

        return haystack.join(" ").toLocaleLowerCase("th").includes(normalized);
      })
      .slice(0, 18);
  }, [buildings, language, places, query]);

  const isOpen = isFocused || query.trim().length > 0;

  return (
    <motion.aside
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        maxHeight: isOpen ? "min(62vh, 470px)" : 52,
      }}
      transition={{
        opacity: { duration: 0.35 },
        y: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        maxHeight: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        layout: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`pointer-events-auto absolute left-3 right-3 top-[max(1rem,env(safe-area-inset-top))] z-30 flex flex-col overflow-hidden rounded-[1.05rem] border border-ink/10 bg-paper shadow-soft md:left-6 md:right-auto md:top-[max(5.4rem,env(safe-area-inset-top)+3.5rem)] md:w-[22rem] md:max-h-[calc(100vh-11rem)] ${isOpen ? "rounded-[1.05rem]" : "rounded-full"}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      <label
        className={`flex min-h-[3.25rem] items-center gap-2.5 px-3.5 text-ink/[0.55] ${isOpen ? "border-b border-ink/10" : ""}`}
      >
        <Search aria-hidden="true" size={17} strokeWidth={2.5} />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-[0.88rem] font-bold text-ink outline-none placeholder:text-ink/[0.45]"
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={t(language, "searchPlaceholder")}
          aria-label={t(language, "searchPlaceholder")}
        />
        <button
          className={`grid size-8 shrink-0 place-items-center rounded-full border-0 text-ink transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fern/60 active:scale-95 ${query ? "bg-ink/[0.08] hover:bg-ink/[0.12]" : isOpen ? "bg-fern/[0.12]" : "bg-ink/[0.08] hover:bg-ink/[0.12]"}`}
          type="button"
          aria-expanded={isOpen}
          aria-label={
            query
              ? t(language, "close")
              : isOpen
                ? t(language, "close")
                : t(language, "directory")
          }
          onClick={() => {
            if (query) {
              setQuery("");
              setIsFocused(true);
              return;
            }

            setIsFocused((current) => !current);
          }}
        >
          {query ? (
            <X aria-hidden="true" size={16} />
          ) : isOpen ? (
            <ChevronUp aria-hidden="true" size={16} />
          ) : (
            <ChevronDown aria-hidden="true" size={16} />
          )}
        </button>
      </label>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="overflow-auto overscroll-contain pb-1 scrollbar-thin"
            role="listbox"
            aria-label={t(language, "directory")}
          >
            <div className="flex items-center justify-between px-3.5 pb-1.5 pt-3 text-[0.63rem] font-extrabold uppercase tracking-[0.16em] text-ink/[0.42]">
              <span>
                {query ? t(language, "searchResults") : t(language, "nearby")}
              </span>
              <span>{filtered.length}</span>
            </div>
            {filtered.length ? (
              filtered.map((result, index) => {
                const key =
                  result.kind === "building"
                    ? `building-${result.item.properties.osm_id}`
                    : `place-${result.item.id}`;
                const name =
                  result.kind === "building"
                    ? localizedBuildingName(result.item, language)
                    : localizedPlaceName(result.item, language);
                const meta =
                  result.kind === "building"
                    ? `${result.item.properties.levels || "—"} ${t(language, "floors")}`
                    : t(language, result.item.category);
                const selected = key === selectedKey;

                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index, 7) * 0.025 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group grid w-full grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-2.5 border-0 border-b border-ink/[0.07] bg-transparent px-3.5 py-2 text-left text-ink transition last:border-b-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-fern/60 ${selected ? "bg-fern/10" : "hover:bg-fern/[0.07]"}`}
                    type="button"
                    key={key}
                    onClick={() => {
                      onSelect(result);
                      setIsFocused(false);
                    }}
                    aria-selected={selected}
                    aria-label={`${name} · ${meta}`}
                  >
                    {result.kind === "building" ? (
                      <BuildingPreview building={result.item} compact />
                    ) : (
                      <PlaceIcon category={result.item.category} />
                    )}
                    <span className="min-w-0">
                      <strong className="block truncate text-[0.8rem] font-extrabold leading-tight">
                        {name}
                      </strong>
                      <small className="mt-0.5 block truncate text-[0.68rem] font-semibold text-ink/[0.55]">
                        {meta}
                      </small>
                    </span>
                  </motion.button>
                );
              })
            ) : (
              <p className="m-0 px-4 py-7 text-center text-sm font-bold text-ink/[0.55]">
                {t(language, "noResults")}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function PlaceIcon({ category }: { category: CampusPlace["category"] }) {
  return (
    <span
      className={`grid size-9 place-items-center rounded-[0.7rem] ${category === "event" ? "bg-coral/10 text-coral" : category === "facility" ? "bg-mapblue/10 text-mapblue" : "bg-fern/10 text-fern"}`}
    >
      {category === "event" ? (
        <CalendarDays aria-hidden="true" size={17} />
      ) : category === "facility" ? (
        <Droplets aria-hidden="true" size={17} />
      ) : category === "amenity" ? (
        <MapPin aria-hidden="true" size={17} />
      ) : (
        <Building2 aria-hidden="true" size={17} />
      )}
    </span>
  );
}

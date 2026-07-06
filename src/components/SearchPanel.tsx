import { Search, SlidersHorizontal } from "lucide-preact";
import { useMemo, useState } from "preact/hooks";
import BuildingPreview from "./BuildingPreview";
import { compactBuildingName } from "../lib/geo";
import type { BuildingFeature } from "../types/geo";

type SearchPanelProps = {
  buildings: BuildingFeature[];
  selectedId?: number;
  onSelect: (building: BuildingFeature) => void;
};

export function SearchPanel({
  buildings,
  selectedId,
  onSelect,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("th");
    if (!normalized) {
      return buildings.slice(0, 14);
    }

    return buildings
      .filter((building) => {
        const haystack = [
          building.properties.name,
          building.properties.name_en,
          building.properties.name_th,
          building.properties.osm_id,
        ]
          .join(" ")
          .toLocaleLowerCase("th");

        return haystack.includes(normalized);
      })
      .slice(0, 18);
  }, [buildings, query]);

  const isOpen = isFocused || query.trim().length > 0;

  return (
    <aside
      className={`search-panel ${isOpen ? "open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
    >
      <label className="search-box">
        <Search aria-hidden="true" size={18} />
        <input
          value={query}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search"
          aria-label="Search buildings"
        />
        <button
          className="search-filter"
          type="button"
          aria-label={
            isOpen ? "Collapse search results" : "Show search results"
          }
          onClick={() => setIsFocused((current) => !current)}
        >
          <SlidersHorizontal aria-hidden="true" size={18} />
        </button>
      </label>

      <div
        className="building-list"
        role="listbox"
        aria-label="KMUTNB buildings"
      >
        {filtered.map((building) => {
          const isSelected = building.properties.osm_id === selectedId;

          return (
            <button
              className={`building-row ${isSelected ? "selected" : ""}`}
              type="button"
              key={building.properties.osm_id}
              onClick={() => {
                onSelect(building);
                setIsFocused(false);
              }}
              aria-selected={isSelected}
            >
              <BuildingPreview building={building} />
              <span>
                <strong>{compactBuildingName(building)}</strong>
                <small>
                  {building.properties.name_th &&
                  building.properties.name_th !== compactBuildingName(building)
                    ? building.properties.name_th
                    : building.properties.levels
                      ? `${building.properties.levels} levels`
                      : "KMUTNB building"}
                </small>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

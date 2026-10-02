import type { BuildingFeature } from "../types/geo";

type Props = {
  building: BuildingFeature;
  compact?: boolean;
};

type PreviewPalette = {
  surface: string;
  road: string;
  building: string;
  outline: string;
  shadow: string;
};

const palettes: PreviewPalette[] = [
  {
    surface: "#e3efe6",
    road: "#c4ddc9",
    building: "#2b6655",
    outline: "#174538",
    shadow: "#173f35",
  },
  {
    surface: "#f0e9de",
    road: "#dfcfba",
    building: "#a36e3d",
    outline: "#704522",
    shadow: "#704522",
  },
  {
    surface: "#e2ebf1",
    road: "#c3d7e5",
    building: "#53728a",
    outline: "#35576f",
    shadow: "#35576f",
  },
];

export default function BuildingPreview({ building, compact = false }: Props) {
  const palette =
    palettes[Math.abs(building.properties.osm_id) % palettes.length];
  const points = footprintPoints(building);
  const center = footprintCenter(points);

  return (
    <span
      className={`relative grid h-auto w-auto shrink-0 place-items-center overflow-hidden border border-ink/10 ${compact ? "h-9 w-9 rounded-[0.7rem]" : "h-14 w-14 rounded-[0.85rem]"}`}
      style={{
        width: compact ? 36 : 56,
        height: compact ? 36 : 56,
        backgroundColor: palette.surface,
      }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 72"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width="100" height="72" fill={palette.surface} />
        <path
          d="M -12 59 L 112 17 M 7 -10 L 89 82"
          fill="none"
          stroke={palette.road}
          strokeLinecap="round"
          strokeWidth="9"
          opacity="0.68"
        />
        <path
          d="M -12 59 L 112 17 M 7 -10 L 89 82"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeWidth="1.6"
          opacity="0.7"
        />
        <path
          d="M 0 13 H 100 M 0 62 H 100"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.8"
          opacity="0.38"
        />
        <polygon
          points={points}
          transform="translate(0 2)"
          fill={palette.shadow}
          opacity="0.16"
        />
        <polygon
          points={points}
          fill={palette.building}
          stroke={palette.outline}
          strokeLinejoin="round"
          strokeWidth={compact ? 1.8 : 1.35}
        />
        <polyline
          points={points}
          fill="none"
          stroke="#ffffff"
          strokeLinejoin="round"
          strokeWidth="0.8"
          opacity="0.58"
        />
        <circle
          cx={center.x}
          cy={center.y}
          r={compact ? 2.2 : 2.6}
          fill="#ffffff"
          opacity="0.88"
        />
        <circle
          cx={center.x}
          cy={center.y}
          r={compact ? 1 : 1.2}
          fill={palette.outline}
        />
      </svg>
    </span>
  );
}

function footprintPoints(building: BuildingFeature): string {
  const ring = building.geometry.coordinates[0];
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = Math.max(maxLng - minLng, 0.0000001);
  const height = Math.max(maxLat - minLat, 0.0000001);
  const scale = Math.min(78 / width, 50 / height);
  const renderedWidth = width * scale;
  const renderedHeight = height * scale;
  const offsetX = (100 - renderedWidth) / 2;
  const offsetY = (72 - renderedHeight) / 2;

  return ring
    .map(([lng, lat]) => {
      const x = offsetX + (lng - minLng) * scale;
      const y = offsetY + (maxLat - lat) * scale;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function footprintCenter(points: string) {
  const coordinates = points
    .split(" ")
    .map((point) => point.split(",").map(Number));
  const totals = coordinates.reduce(
    (sum, [x, y]) => ({ x: sum.x + x, y: sum.y + y }),
    { x: 0, y: 0 },
  );

  return {
    x: totals.x / coordinates.length,
    y: totals.y / coordinates.length,
  };
}

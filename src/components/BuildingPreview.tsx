import { MapPinned } from "lucide-preact";
import type { BuildingFeature } from "../types/geo";

type Props = {
  building: BuildingFeature;
};

export default function BuildingImage({ building }: Props) {
  return (
    // placeholder
    <span className="building-image" aria-hidden="true">
      <MapPinned size={48} />
    </span>
  );
}

import { useEffect, useState } from "preact/compat";
import { compactBuildingName } from "../lib/geo";
import type { BuildingFeature } from "../types/geo";

type Props = {
  building: BuildingFeature;
};

type OpenverseImage = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  creator: string;
  license: string;
};

export default function BuildingImage({ building }: Props) {
  const [image, setImage] = useState<OpenverseImage | null>(null);

  useEffect(() => {
    async function search() {
      const query = `${compactBuildingName(building)}`;

      const res = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
          query,
        )}&page_size=1`,
      );

      const data = await res.json();

      if (data.results.length > 0) {
        setImage(data.results[0]);
      }
    }

    search();
  }, [building]);

  if (!image) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <img
        src={image.thumbnail}
        alt={image.title}
        style={{
          width: "100%",
          borderRadius: 12,
          objectFit: "cover",
        }}
      />

      <small>
        {image.creator} • {image.license}
      </small>
    </div>
  );
}

export type FloorPlanRoom = {
  id: string;
  labelEn: string;
  labelTh: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind?: "room" | "corridor" | "service";
};

export type FloorPlan = {
  rooms: FloorPlanRoom[];
  noteEn?: string;
  noteTh?: string;
};

export const floorPlans: Record<string, Record<number, FloorPlan>> = {
  // DO LATER PROBABLY WILL FIND BETTER SOLUTION THAN THIS
  // TODO: ALSO MOVE TO SERVER SIDE
  // "158474996": {
  //   1: {
  //     rooms: [
  //       {
  //         id: "lobby",
  //         labelEn: "Main lobby",
  //         labelTh: "โถงทางเข้าหลัก",
  //         x: 8,
  //         y: 8,
  //         width: 30,
  //         height: 22,
  //         kind: "room",
  //       },
  //     ],
  //     noteEn: "Verified from the building plan.",
  //     noteTh: "ตรวจสอบจากแบบแปลนอาคารแล้ว",
  //   },
  // },
};

export function getFloorPlan(
  buildingId: number,
  floor: number,
): FloorPlan | null {
  return floorPlans[String(buildingId)]?.[floor] || null;
}

import { supabase } from "../lib/supabase";

export type FloorImage = {
  floor: number;
  imageUrl: string;
  imageWidth: number | null;
  imageHeight: number | null;
};

// Fetches a single floor's plan image from Supabase (table `floor_plan`).
// Returns null when Supabase is not configured, the row is missing, or it has
// no image yet — the caller then falls back to the empty placeholder.
export async function getFloorImage(
  buildingId: number,
  floor: number,
): Promise<FloorImage | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("floor_plan")
    .select("floor, image_url, image_width, image_height")
    .eq("building_id", buildingId)
    .eq("floor", floor)
    .maybeSingle();

  if (error || !data || !data.image_url) {
    return null;
  }

  return {
    floor: data.floor,
    imageUrl: data.image_url,
    imageWidth: data.image_width ?? null,
    imageHeight: data.image_height ?? null,
  };
}

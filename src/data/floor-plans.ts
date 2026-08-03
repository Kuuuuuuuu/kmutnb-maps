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

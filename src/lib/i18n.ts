import type { CampusPlace, BuildingFeature, Language } from "../types/geo";

const copy = {
  en: {
    campusMap: "Campus map",
    directory: "Campus directory",
    searchPlaceholder: "Find a building, room, facility…",
    nearby: "Nearby places",
    searchResults: "Search results",
    noResults: "No places match that search.",
    building: "Building",
    facility: "Facility",
    amenity: "Campus place",
    event: "Campus event",
    room: "Room / lab",
    close: "Close",
    routeHere: "Route here",
    cancelRoute: "Cancel route",
    calculatingRoute: "Calculating route",
    navigationActive: "Navigation active",
    floors: "floors",
    floorPlan: "Floor plan",
    chooseFloor: "Choose a floor",
    floorDataReady: "Room layout data can be added later",
    buildingFootprint: "Verified building footprint",
    reportIssue: "Report a problem",
    entrancePreview: "Building / entrance preview",
    minWalk: "min walk",
    from: "from",
    routeUnavailable: "Routing is unavailable right now.",
    nextInstruction: "Next instruction",
    recalculatingRoute: "Updating route",
    offRoute: "You are off route — finding a better path",
    arrived: "You have arrived",
    gpsWaiting: "Waiting for GPS",
    gpsWeak: "GPS signal is weak",
    followLocation: "Follow my location",
    mapFollowPaused: "Map follow paused",
    navigatingTo: "Navigating to",
    eta: "ETA",
    time: "Time",
    distance: "Distance",
    endNavigation: "End navigation",
    language: "Language",
    colorSafe: "Color-safe map",
    colorSafeOn: "Color-safe on",
    colorSafeOff: "Color-safe off",
    issueTitle: "Report a campus problem",
    issueDescription:
      "Tell us what needs attention so the campus team can follow up.",
    issueCategory: "What is wrong?",
    issueOptionBroken: "Broken equipment",
    issueOptionBuilding: "Building or access",
    issueOptionCleanliness: "Cleanliness",
    issueOptionOther: "Other",
    issueDetails: "Details",
    issueDetailsPlaceholder: "Add a short description…",
    issuePhoto: "Photo evidence",
    uploadPhoto: "Take or choose a photo",
    issueSubmit: "Save report",
    issueSaved: "Report saved on this device.",
    report: "Report",
    mapControls: "Map controls",
    centerMap: "Center map on current location",
    resetMap: "Reset map orientation",
    fromLocation: "From",
  },
  th: {
    campusMap: "แผนที่มหาวิทยาลัย",
    directory: "ไดเรกทอรีภายในมหาวิทยาลัย",
    searchPlaceholder: "ค้นหาตึก ห้อง สิ่งอำนวยความสะดวก…",
    nearby: "สถานที่ใกล้เคียง",
    searchResults: "ผลการค้นหา",
    noResults: "ไม่พบสถานที่ที่ตรงกับการค้นหา",
    building: "อาคาร",
    facility: "สิ่งอำนวยความสะดวก",
    amenity: "สถานที่ในมหาวิทยาลัย",
    event: "อีเว้นต์ในมหาวิทยาลัย",
    room: "ห้อง / ห้องปฏิบัติการ",
    close: "ปิด",
    routeHere: "นำทางมาที่นี่",
    cancelRoute: "ยกเลิกเส้นทาง",
    calculatingRoute: "กำลังคำนวณเส้นทาง",
    navigationActive: "กำลังนำทาง",
    floors: "ชั้น",
    floorPlan: "แผนผังชั้น",
    chooseFloor: "เลือกชั้น",
    floorDataReady: "สามารถเพิ่มข้อมูลผังห้องภายหลังได้",
    buildingFootprint: "รูปทรงอาคารจากข้อมูลจริง",
    reportIssue: "รายงานปัญหา",
    entrancePreview: "ภาพอาคาร / ทางเข้า",
    minWalk: "นาทีเดิน",
    from: "จาก",
    routeUnavailable: "ไม่สามารถคำนวณเส้นทางได้ในขณะนี้",
    nextInstruction: "คำแนะนำถัดไป",
    recalculatingRoute: "กำลังอัปเดตเส้นทาง",
    offRoute: "ออกนอกเส้นทาง — กำลังหาเส้นทางใหม่",
    arrived: "คุณมาถึงแล้ว",
    gpsWaiting: "กำลังรอสัญญาณ GPS",
    gpsWeak: "สัญญาณ GPS อ่อน",
    followLocation: "ติดตามตำแหน่งของฉัน",
    mapFollowPaused: "หยุดติดตามแผนที่ชั่วคราว",
    navigatingTo: "กำลังนำทางไปยัง",
    eta: "ถึงโดยประมาณ",
    time: "เวลา",
    distance: "ระยะทาง",
    endNavigation: "จบการนำทาง",
    language: "ภาษา",
    colorSafe: "โหมดสีสำหรับทุกคน",
    colorSafeOn: "เปิดโหมดสี",
    colorSafeOff: "ปิดโหมดสี",
    issueTitle: "รายงานปัญหาในมหาวิทยาลัย",
    issueDescription: "แจ้งสิ่งที่ต้องแก้ไข เพื่อให้ทีมงานติดตามได้ง่ายขึ้น",
    issueCategory: "ปัญหาคืออะไร",
    issueOptionBroken: "อุปกรณ์ชำรุด",
    issueOptionBuilding: "อาคารหรือการเข้าถึง",
    issueOptionCleanliness: "ความสะอาด",
    issueOptionOther: "อื่น ๆ",
    issueDetails: "รายละเอียด",
    issueDetailsPlaceholder: "เพิ่มรายละเอียดสั้น ๆ…",
    issuePhoto: "รูปประกอบ",
    uploadPhoto: "ถ่ายหรือเลือกรูปภาพ",
    issueSubmit: "บันทึกรายงาน",
    issueSaved: "บันทึกรายงานไว้ในอุปกรณ์นี้แล้ว",
    report: "รายงาน",
    mapControls: "ปุ่มควบคุมแผนที่",
    centerMap: "ไปยังตำแหน่งปัจจุบัน",
    resetMap: "รีเซ็ตมุมมองแผนที่",
    fromLocation: "จาก",
  },
} as const;

export type TranslationKey = keyof typeof copy.en;

export function t(language: Language, key: TranslationKey): string {
  return copy[language][key];
}

export function localizedBuildingName(
  building: BuildingFeature,
  language: Language,
): string {
  return language === "th"
    ? building.properties.name_th ||
        building.properties.name ||
        building.properties.name_en ||
        "อาคารในมหาวิทยาลัย"
    : building.properties.name_en ||
        building.properties.name ||
        building.properties.name_th ||
        "Campus building";
}

export function localizedPlaceName(
  place: CampusPlace,
  language: Language,
): string {
  return language === "th" ? place.nameTh : place.nameEn;
}

export function localizedPlaceDescription(
  place: CampusPlace,
  language: Language,
): string {
  return language === "th" ? place.descriptionTh : place.descriptionEn;
}

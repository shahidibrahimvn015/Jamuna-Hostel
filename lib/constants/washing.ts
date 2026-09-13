import type {
  WashingMachineFloor,
  WashingMachineModel,
  WashingSlotKind,
} from "@/lib/types/database.types";

// Floors are stored as slugs so display text can change without a migration.
// The array order is the display order -- alphabetical would put "Ground"
// after "3rd".
export const WASHING_FLOORS: {
  value: WashingMachineFloor;
  label: string;
}[] = [
  { value: "ground", label: "Ground Floor" },
  { value: "1st", label: "1st Floor" },
  { value: "2nd", label: "2nd Floor" },
  { value: "3rd", label: "3rd Floor" },
];

export const WASHING_MODELS: {
  value: WashingMachineModel;
  label: string;
}[] = [
  { value: "automatic", label: "Automatic" },
  { value: "semi_automatic", label: "Semi-Automatic" },
];

export const SLOT_LABELS: Record<WashingSlotKind, string> = {
  wash: "Wash",
  washer: "Washer",
  dryer: "Dryer",
};

// Mirrors sync_washing_machine_slots() in 0015; the database is authoritative,
// this is only for rendering before a round-trip.
export const SLOT_MAX_MINUTES: Record<WashingSlotKind, number> = {
  wash: 90,
  washer: 60,
  dryer: 30,
};

export function floorLabel(floor: WashingMachineFloor) {
  return WASHING_FLOORS.find((f) => f.value === floor)?.label ?? floor;
}

export function modelLabel(model: WashingMachineModel) {
  return WASHING_MODELS.find((m) => m.value === model)?.label ?? model;
}

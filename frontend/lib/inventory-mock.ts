export type PartRow = {
  id: string;
  name: string;
  category: "CT" | "PET" | "General";
  stock: number;
};

/** Demo data for Phase 1; replace with API in Phase 2. */
export const MOCK_PARTS: PartRow[] = [
  { id: "CT-1001", name: "CT X-Ray Tube Assembly", category: "CT", stock: 3 },
  { id: "CT-1002", name: "CT Detector Module", category: "CT", stock: 8 },
  { id: "CT-1003", name: "CT Gantry Board", category: "CT", stock: 0 },
  { id: "CT-1004", name: "CT Slip Ring", category: "CT", stock: 2 },
  { id: "PET-2001", name: "PET Detector Crystal", category: "PET", stock: 5 },
  { id: "PET-2002", name: "PET PMT Assembly", category: "PET", stock: 0 },
  { id: "PET-2003", name: "PET Coincidence Board", category: "PET", stock: 4 },
  { id: "PET-2004", name: "PET Bed Motor", category: "PET", stock: 1 },
  { id: "GEN-4001", name: "Power Supply Unit", category: "General", stock: 12 },
  { id: "GEN-4002", name: "Cooling Fan Assembly", category: "General", stock: 0 },
  { id: "GEN-4003", name: "Cable Harness Set", category: "General", stock: 15 },
];

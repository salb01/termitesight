export type StructureType = "primary" | "garage" | "patio" | "deck";

export type Structure = {
  id: string;
  name: string;
  type: StructureType;
  geometry: GeoJSON.Polygon;
};

export type FindingCategory =
  | "active termites"
  | "mud tubes"
  | "frass"
  | "wood damage"
  | "wood-to-soil contact"
  | "moisture"
  | "cellulose debris"
  | "inaccessible area"
  | "obstructed area"
  | "treatment needed"
  | "repair needed"
  | "monitor";

export type Finding = {
  id: string;
  structureId: string;
  category: FindingCategory;
  severity: "low" | "moderate" | "high";
  recommendation: string;
  notes: string;
  lng: number;
  lat: number;
  photos: string[];
};

export type Inspection = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  inspector_name: string;
  client_name: string;
};

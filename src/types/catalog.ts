import { Unit, TVARate } from "./quote";

export interface CatalogCategory {
  id: string;
  code: string; // Lettre A-Z
  name: string;
  description: string;
}

export interface CatalogPrestation {
  id: string;
  categoryId: string;
  designation: string;
  description: string;
  unit: Unit;
  priceMin: number;
  priceMax: number;
  priceDefault: number;
  tvaRate: TVARate;
  type: "prestation" | "fourniture" | "main_oeuvre";
  tags: string[];
}

export interface CatalogSupplier {
  id: string;
  name: string;
  contact: string;
  specialties: string[];
}

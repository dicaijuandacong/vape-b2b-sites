export type Tier = {
  moq: number;
  price_eur: number | null;
};

export type ProductCategory =
  | "disposable"
  | "rechargeable-disposable"
  | "pod-kit"
  | "prefilled-pod"
  | "open-system"
  | "shisha-style";

export type Product = {
  id: string;
  brand: string;
  model: string;
  puffs: number | null;
  flavors: string[];
  tiers: Tier[];
  category: ProductCategory;
  source_page?: string;
  confidence?: "high" | "medium" | "low";
  salt_nicotine_pct?: string;
  battery_mah?: number;
  battery_type?: string;
  eliquid_ml?: number;
  coil?: string;
  airflow?: string;
  design_notes?: string;
};

export type Brand = {
  id: string;
  name: string;
  tagline: string;
  source_pdf: string;
  products: Product[];
};

export type ProductsFile = {
  _meta: Record<string, string>;
  stats: {
    total_brands: number;
    total_products: number;
    total_flavor_listings: number;
    unique_flavors_estimate: number;
  };
  brands: Brand[];
};

export type Country = {
  code: string;
  name: string;
  flag: string;
  currency: "EUR" | "GBP" | "AED" | "SAR" | "QAR" | "KWD" | "BHD" | "OMR" | "USD";
  disposable_allowed: boolean;
  dtc_allowed: boolean;
  warning_label: string;
  notes?: string;
};

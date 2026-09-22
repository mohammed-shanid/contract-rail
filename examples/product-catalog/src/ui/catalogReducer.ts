import type { Product } from "../contracts/catalog.ts";

export type CatalogStatus = "idle" | "loading" | "loaded" | "failed";

export interface CatalogState {
  readonly status: CatalogStatus;
  readonly products: readonly Product[];
  readonly category: string | null;
  readonly error: string | null;
}

export type CatalogAction =
  | { type: "load/start" }
  | { type: "load/success"; products: readonly Product[] }
  | { type: "load/failure"; error: string }
  | { type: "filter/category"; category: string | null };

export const initialState: CatalogState = {
  status: "idle",
  products: [],
  category: null,
  error: null,
};

export function catalogReducer(state: CatalogState, action: CatalogAction): CatalogState {
  switch (action.type) {
    case "load/start":
      return { ...state, status: "loading", error: null };
    case "load/success":
      return { ...state, status: "loaded", products: action.products, error: null };
    case "load/failure":
      return { ...state, status: "failed", products: [], error: action.error };
    case "filter/category":
      return { ...state, category: action.category };
  }
}

/** Products visible under the current filter. Pure; safe to call in render. */
export function visibleProducts(state: CatalogState): readonly Product[] {
  return state.category === null
    ? state.products
    : state.products.filter((p) => p.category === state.category);
}

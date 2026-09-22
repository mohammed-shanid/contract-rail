import { describe, expect, it } from "vitest";
import type { Product } from "../src/contracts/catalog.ts";
import { catalogReducer, initialState, visibleProducts } from "../src/ui/catalogReducer.ts";

const products: readonly Product[] = [
  { id: "a", name: "A", category: "x", priceCents: 100, inStock: true },
  { id: "b", name: "B", category: "y", priceCents: 200, inStock: false },
];

describe("catalogReducer", () => {
  it("moves idle → loading → loaded", () => {
    const loading = catalogReducer(initialState, { type: "load/start" });
    expect(loading.status).toBe("loading");
    const loaded = catalogReducer(loading, { type: "load/success", products });
    expect(loaded).toMatchObject({ status: "loaded", products, error: null });
  });

  it("records failures and clears products", () => {
    const loaded = catalogReducer(initialState, { type: "load/success", products });
    const failed = catalogReducer(loaded, { type: "load/failure", error: "boom" });
    expect(failed).toMatchObject({ status: "failed", products: [], error: "boom" });
  });

  it("is pure: does not mutate the previous state", () => {
    const before = { ...initialState };
    catalogReducer(initialState, { type: "filter/category", category: "x" });
    expect(initialState).toEqual(before);
  });

  it("visibleProducts applies the category filter", () => {
    const loaded = catalogReducer(initialState, { type: "load/success", products });
    expect(visibleProducts(loaded).map((p) => p.id)).toEqual(["a", "b"]);
    const filtered = catalogReducer(loaded, { type: "filter/category", category: "y" });
    expect(visibleProducts(filtered).map((p) => p.id)).toEqual(["b"]);
  });
});

import { describe, expect, it } from "vitest";
import { InMemoryCatalogRepository, SEED_PRODUCTS } from "./inMemoryCatalogRepository.ts";

describe("InMemoryCatalogRepository (CR-0001 invariants)", () => {
  const repo = new InMemoryCatalogRepository();

  it("list() with no query returns everything", async () => {
    expect(await repo.list()).toEqual(SEED_PRODUCTS);
  });

  it("list() filters by category and stock", async () => {
    const stationery = await repo.list({ category: "stationery" });
    expect(stationery.map((p) => p.id)).toEqual(["p2", "p4"]);
    const inStock = await repo.list({ inStockOnly: true });
    expect(inStock.every((p) => p.inStock)).toBe(true);
    expect(inStock.map((p) => p.id)).not.toContain("p3");
  });

  it("getById() returns null for unknown ids", async () => {
    expect(await repo.getById("nope")).toBeNull();
    expect((await repo.getById("p1"))?.name).toBe("Desk lamp");
  });
});

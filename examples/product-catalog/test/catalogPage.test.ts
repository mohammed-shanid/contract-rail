import { describe, expect, it } from "vitest";
import type { CatalogRepository, Product } from "../src/contracts/catalog.ts";
import { catalogReducer, initialState, type CatalogAction, type CatalogState } from "../src/ui/catalogReducer.ts";
import { formatPrice, loadCatalog, renderCatalogPage } from "../src/ui/catalogPage.ts";

// A fake that satisfies the *interface*. The UI tests never touch src/data.
function fakeRepo(products: readonly Product[], fail = false): CatalogRepository {
  return {
    async list() {
      if (fail) throw new Error("network down");
      return products;
    },
    async getById(id) {
      return products.find((p) => p.id === id) ?? null;
    },
  };
}

const products: readonly Product[] = [
  { id: "p1", name: "Lamp <big>", category: "lighting", priceCents: 3499, inStock: false },
  { id: "p2", name: "Pen", category: "stationery", priceCents: 2400, inStock: true },
];

function runLoad(repo: CatalogRepository): Promise<CatalogState> {
  let state = initialState;
  const dispatch = (a: CatalogAction) => {
    state = catalogReducer(state, a);
  };
  return loadCatalog(repo, dispatch).then(() => state);
}

describe("loadCatalog + renderCatalogPage", () => {
  it("renders the loading marker before data arrives", () => {
    expect(renderCatalogPage(catalogReducer(initialState, { type: "load/start" }))).toContain('data-state="loading"');
  });

  it("renders every product by name and price when loaded", async () => {
    const html = renderCatalogPage(await runLoad(fakeRepo(products)));
    expect(html).toContain('data-state="loaded"');
    expect(html).toContain("Lamp &lt;big&gt; — $34.99");
    expect(html).toContain("Pen — $24.00");
    expect(html).toContain('data-id="p1" data-out-of-stock=""');
  });

  it("renders the failed marker with the error message", async () => {
    const html = renderCatalogPage(await runLoad(fakeRepo(products, true)));
    expect(html).toContain('data-state="failed"');
    expect(html).toContain("network down");
  });

  it("formats integer cents without float math", () => {
    expect(formatPrice(5)).toBe("$0.05");
    expect(formatPrice(100)).toBe("$1.00");
    expect(formatPrice(123456)).toBe("$1234.56");
  });
});

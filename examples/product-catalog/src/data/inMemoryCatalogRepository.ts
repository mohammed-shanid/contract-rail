import type { CatalogRepository, Product, ProductQuery } from "../contracts/catalog.ts";

export const SEED_PRODUCTS: readonly Product[] = [
  { id: "p1", name: "Desk lamp", category: "lighting", priceCents: 3499, inStock: true },
  { id: "p2", name: "Notebook, A5 ruled", category: "stationery", priceCents: 650, inStock: true },
  { id: "p3", name: "Mechanical keyboard", category: "peripherals", priceCents: 12900, inStock: false },
  { id: "p4", name: "Fountain pen", category: "stationery", priceCents: 2400, inStock: true },
];

export class InMemoryCatalogRepository implements CatalogRepository {
  readonly #products: readonly Product[];

  constructor(products: readonly Product[] = SEED_PRODUCTS) {
    this.#products = products;
  }

  async list(query: ProductQuery = {}): Promise<readonly Product[]> {
    return this.#products.filter(
      (p) =>
        (query.category === undefined || p.category === query.category) &&
        (!query.inStockOnly || p.inStock),
    );
  }

  async getById(id: string): Promise<Product | null> {
    return this.#products.find((p) => p.id === id) ?? null;
  }
}

// Frozen by contracts/CR-0001-catalog-repository.md.
// Any change to this directory must be accompanied by a superseding CR and
// `npm run contracts:lock`; otherwise test/architecture.test.ts fails.

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly priceCents: number;
  readonly inStock: boolean;
}

export interface ProductQuery {
  readonly category?: string;
  readonly inStockOnly?: boolean;
}

export interface CatalogRepository {
  list(query?: ProductQuery): Promise<readonly Product[]>;
  getById(id: string): Promise<Product | null>;
}

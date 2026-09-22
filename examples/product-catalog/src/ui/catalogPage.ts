import type { CatalogRepository } from "../contracts/catalog.ts";
import { visibleProducts, type CatalogAction, type CatalogState } from "./catalogReducer.ts";

/**
 * Loads the catalog through the repository *interface*. The concrete
 * implementation is injected by src/main.ts; this file never sees src/data.
 */
export async function loadCatalog(
  repo: CatalogRepository,
  dispatch: (action: CatalogAction) => void,
): Promise<void> {
  dispatch({ type: "load/start" });
  try {
    const products = await repo.list();
    dispatch({ type: "load/success", products });
  } catch (err) {
    dispatch({ type: "load/failure", error: err instanceof Error ? err.message : String(err) });
  }
}

/** Integer cents → "$12.34". Currency symbol is a placeholder; the point is no float math. */
export function formatPrice(priceCents: number): string {
  const whole = Math.trunc(priceCents / 100);
  const cents = Math.abs(priceCents % 100);
  return `$${whole}.${cents.toString().padStart(2, "0")}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export function renderCatalogPage(state: CatalogState): string {
  switch (state.status) {
    case "idle":
    case "loading":
      return `<section data-state="${state.status}"><p>Loading catalog…</p></section>`;
    case "failed":
      return `<section data-state="failed"><p role="alert">Could not load catalog: ${escapeHtml(state.error ?? "unknown error")}</p></section>`;
    case "loaded": {
      const rows = visibleProducts(state)
        .map(
          (p) =>
            `<li data-id="${escapeHtml(p.id)}"${p.inStock ? "" : ' data-out-of-stock=""'}>${escapeHtml(p.name)} — ${formatPrice(p.priceCents)}</li>`,
        )
        .join("");
      return `<section data-state="loaded"><ul>${rows}</ul></section>`;
    }
  }
}

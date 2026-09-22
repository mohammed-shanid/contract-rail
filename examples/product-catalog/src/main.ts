// Composition root. This is the ONE file allowed to import src/data
// (CR-0001 rule 2). Everything below the interface line is injected.
import { InMemoryCatalogRepository } from "./data/inMemoryCatalogRepository.ts";
import { catalogReducer, initialState, type CatalogState } from "./ui/catalogReducer.ts";
import { loadCatalog, renderCatalogPage } from "./ui/catalogPage.ts";

let state: CatalogState = initialState;
const repo = new InMemoryCatalogRepository();

await loadCatalog(repo, (action) => {
  state = catalogReducer(state, action);
});

console.log(renderCatalogPage(state));

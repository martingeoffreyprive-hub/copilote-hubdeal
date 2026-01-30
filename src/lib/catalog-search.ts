import { CatalogPrestation } from "@/types/catalog";
import { CATALOG_CATEGORIES, CATALOG_PRESTATIONS } from "@/data/catalog";

/**
 * Normalize text for search: lowercase, remove accents, trim.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Search catalog by keywords in designation + description + tags.
 * Returns matched prestations sorted by relevance (score descending).
 */
export function searchCatalog(query: string, limit = 30): CatalogPrestation[] {
  const words = normalize(query).split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return [];

  const scored: { item: CatalogPrestation; score: number }[] = [];

  for (const item of CATALOG_PRESTATIONS) {
    const haystack = normalize(
      `${item.designation} ${item.description} ${item.tags.join(" ")}`
    );
    let score = 0;
    for (const word of words) {
      if (haystack.includes(word)) score += 1;
      // Bonus for designation match
      if (normalize(item.designation).includes(word)) score += 1;
    }
    if (score > 0) scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * Get all prestations for a given category.
 */
export function getCategoryPrestations(categoryId: string): CatalogPrestation[] {
  return CATALOG_PRESTATIONS.filter((p) => p.categoryId === categoryId);
}

/**
 * Build a context string for GPT prompt injection with relevant catalog items.
 */
export function buildCatalogContext(query: string): string {
  const results = searchCatalog(query, 40);
  if (results.length === 0) return "";

  // Group by category
  const grouped = new Map<string, CatalogPrestation[]>();
  for (const item of results) {
    const list = grouped.get(item.categoryId) || [];
    list.push(item);
    grouped.set(item.categoryId, list);
  }

  const lines: string[] = [
    "CATALOGUE DE PRIX (utilisez ces prix pour le devis):",
  ];

  for (const [catId, items] of grouped) {
    const cat = CATALOG_CATEGORIES.find((c) => c.id === catId);
    lines.push(`\n--- ${cat?.name || catId} ---`);
    for (const item of items) {
      lines.push(
        `• ${item.designation}: ${item.priceMin}-${item.priceMax}€/${item.unit} (défaut: ${item.priceDefault}€) [TVA ${item.tvaRate}%] [${item.type}]`
      );
    }
  }

  lines.push(
    "\nUtilise le prix 'défaut' sauf si le client demande une gamme spécifique. Les prix sont HTVA."
  );

  return lines.join("\n");
}

/**
 * Format search results for the GPT tool response.
 */
export function formatCatalogResults(query: string): string {
  const results = searchCatalog(query, 15);
  if (results.length === 0) return `Aucun résultat pour "${query}".`;

  const lines = results.map(
    (r) =>
      `${r.designation} | ${r.priceMin}-${r.priceMax}€/${r.unit} (défaut: ${r.priceDefault}€) | TVA ${r.tvaRate}% | ${r.type}`
  );
  return `${results.length} résultat(s) pour "${query}":\n${lines.join("\n")}`;
}

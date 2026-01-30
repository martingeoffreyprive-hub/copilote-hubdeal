"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { CATALOG_CATEGORIES, CATALOG_PRESTATIONS } from "@/data/catalog";
import { searchCatalog, getCategoryPrestations } from "@/lib/catalog-search";
import { CatalogPrestation } from "@/types/catalog";
import { Search } from "lucide-react";

export default function CataloguePage() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const results: CatalogPrestation[] = query.trim().length > 2
    ? searchCatalog(query)
    : selectedCategory
      ? getCategoryPrestations(selectedCategory)
      : [];

  const showAll = !query.trim() && !selectedCategory;

  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-xl font-bold">Catalogue des prestations</h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedCategory(null); }}
          placeholder="Rechercher (ex: carrelage, électricité, douche italienne...)"
          className="pl-10 h-10 border-white/10 bg-transparent"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATALOG_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); setQuery(""); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
            }`}
          >
            {cat.code}. {cat.name}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!showAll && (
        <p className="text-xs text-muted-foreground">
          {results.length} prestation(s) trouvée(s)
          {selectedCategory && ` dans ${CATALOG_CATEGORIES.find((c) => c.id === selectedCategory)?.name}`}
        </p>
      )}

      {/* Welcome state */}
      {showAll && (
        <GlassCard className="p-8 text-center space-y-2">
          <p className="text-sm font-medium">
            {CATALOG_PRESTATIONS.length} prestations dans {CATALOG_CATEGORIES.length} catégories
          </p>
          <p className="text-xs text-muted-foreground">
            Sélectionnez une catégorie ou recherchez un mot-clé pour consulter les prix.
          </p>
        </GlassCard>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <GlassCard className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Unité</th>
                <th className="px-4 py-3">Prix min</th>
                <th className="px-4 py-3">Prix max</th>
                <th className="px-4 py-3">Prix défaut</th>
                <th className="px-4 py-3">TVA</th>
                <th className="px-4 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2">
                    <div className="font-medium">{item.designation}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </td>
                  <td className="px-4 py-2">{item.unit}</td>
                  <td className="px-4 py-2">{item.priceMin}€</td>
                  <td className="px-4 py-2">{item.priceMax}€</td>
                  <td className="px-4 py-2 font-medium">{item.priceDefault}€</td>
                  <td className="px-4 py-2">{item.tvaRate}%</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      item.type === "fourniture" ? "bg-blue-500/10 text-blue-400"
                      : item.type === "main_oeuvre" ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {item.type === "main_oeuvre" ? "MO" : item.type === "fourniture" ? "Fourniture" : "Prestation"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";

export default function DevisListPage() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mes Devis</h1>
        <Link href="/devis/nouveau">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Nouveau
          </Button>
        </Link>
      </div>

      <GlassCard className="p-8 flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Aucun devis</p>
          <p className="text-xs text-muted-foreground">Créez votre premier devis avec le copilote AI</p>
        </div>
        <Link href="/devis/nouveau">
          <Button size="sm" variant="outline" className="border-white/10">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Créer un devis
          </Button>
        </Link>
      </GlassCard>
    </div>
  );
}

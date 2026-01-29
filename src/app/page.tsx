import Link from "next/link";
import { FileText, Plus, TrendingUp, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function Home() {
  return (
    <div className="min-h-screen p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Hubdeal</h1>
        <p className="text-muted-foreground text-sm">Copilote devis pour artisans belges</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/devis/nouveau">
          <GlassCard className="p-5 space-y-3 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Plus className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Nouveau devis</p>
              <p className="text-xs text-muted-foreground">Créer avec le copilote AI</p>
            </div>
          </GlassCard>
        </Link>

        <Link href="/devis">
          <GlassCard className="p-5 space-y-3 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Mes devis</p>
              <p className="text-xs text-muted-foreground">Voir et gérer</p>
            </div>
          </GlassCard>
        </Link>

        <Link href="/finances">
          <GlassCard className="p-5 space-y-3 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold">Finances</p>
              <p className="text-xs text-muted-foreground">Suivi financier</p>
            </div>
          </GlassCard>
        </Link>

        <GlassCard className="p-5 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Copilote AI</p>
            <p className="text-xs text-muted-foreground">Vocal & intelligent</p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-5 space-y-3">
        <h2 className="text-sm font-semibold">Activité récente</h2>
        <p className="text-xs text-muted-foreground">Aucun devis pour le moment. Créez votre premier devis.</p>
      </GlassCard>
    </div>
  );
}

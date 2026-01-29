import { GlassCard } from "@/components/ui/glass-card";
import { TrendingUp } from "lucide-react";

export default function FinancesPage() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <h1 className="text-xl font-bold">Finances</h1>
      <GlassCard className="p-8 flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">Bientôt disponible</p>
          <p className="text-xs text-muted-foreground">Le suivi financier sera disponible prochainement.</p>
        </div>
      </GlassCard>
    </div>
  );
}

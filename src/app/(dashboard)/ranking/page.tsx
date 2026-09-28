import type { Metadata } from "next";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentLevel, getGamificationLevels, getRanking } from "@/core/gamification/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.ranking.title };

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function RankingPage() {
  const ctx = await requireTenantContext();

  const [ranking, levels] = ctx.tenant
    ? await Promise.all([getRanking(ctx.tenant.id), getGamificationLevels(ctx.tenant.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{pt.ranking.title}</h1>
        <p className="text-sm text-muted-foreground">{pt.ranking.subtitle}</p>
      </div>

      {ranking.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {pt.ranking.empty}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {ranking.map((entry, index) => {
            const level = getCurrentLevel(levels, entry.totalPoints);
            return (
              <div key={entry.userId} className="flex items-center gap-3 p-3">
                <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <Avatar>
                  <AvatarFallback>{initials(entry.fullName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{entry.fullName}</p>
                  <Badge variant="outline">{level ? level.name : pt.ranking.noLevel}</Badge>
                </div>
                <p className="text-sm font-semibold">
                  {entry.totalPoints} <span className="font-normal text-muted-foreground">{pt.ranking.points}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

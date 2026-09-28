"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";

import { CommunityCard } from "@/components/community/community-card";
import { Input } from "@/components/ui/input";
import type { Community } from "@/core/communities/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function CommunityCatalog({ communities }: { communities: Community[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter(
      (community) =>
        community.name.toLowerCase().includes(q) ||
        (community.description ?? "").toLowerCase().includes(q)
    );
  }, [communities, search]);

  return (
    <div className="flex flex-col gap-5">
      <Input
        placeholder={pt.community.catalog.searchPlaceholder}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{pt.community.catalog.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pt.community.catalog.emptyBody}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

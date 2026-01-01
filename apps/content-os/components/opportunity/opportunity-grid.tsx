"use client";

import { Opportunity } from "@/lib/types/opportunity";
import { OpportunityCard } from "./opportunity-card";

interface OpportunityGridProps {
  opportunities: Opportunity[];
  onCreateDraft: (id: string) => void;
  onExclude: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function OpportunityGrid({
  opportunities,
  onCreateDraft,
  onExclude,
  onToggleFavorite,
}: OpportunityGridProps) {
  if (opportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground text-lg mb-2">
          조건에 맞는 Opportunity가 없습니다
        </div>
        <p className="text-sm text-muted-foreground">
          필터를 조정해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          onCreateDraft={onCreateDraft}
          onExclude={onExclude}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

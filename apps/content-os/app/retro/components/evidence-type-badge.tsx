"use client";

import { EvidenceType, EVIDENCE_TYPE_CONFIG } from "../types/retro";
import { cn } from "@/lib/utils";

interface EvidenceTypeBadgeProps {
  type: EvidenceType;
  className?: string;
}

export function EvidenceTypeBadge({ type, className }: EvidenceTypeBadgeProps) {
  const config = EVIDENCE_TYPE_CONFIG[type];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// 여러 배지를 렌더링하는 헬퍼 컴포넌트
interface EvidenceTypeBadgeListProps {
  types: EvidenceType[];
  className?: string;
}

export function EvidenceTypeBadgeList({
  types,
  className,
}: EvidenceTypeBadgeListProps) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {types.map((type) => (
        <EvidenceTypeBadge key={type} type={type} />
      ))}
    </div>
  );
}

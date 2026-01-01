"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  StarOff,
  FileText,
  EyeOff,
  TrendingUp,
} from "lucide-react";
import { Opportunity, FORMAT_LABELS, TARGET_LOOP_LABELS } from "@/lib/types/opportunity";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onCreateDraft: (id: string) => void;
  onExclude: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function OpportunityCard({
  opportunity,
  onCreateDraft,
  onExclude,
  onToggleFavorite,
}: OpportunityCardProps) {
  const {
    id,
    keyword,
    finalScore,
    marketScore,
    fitScore,
    saturationScore,
    whyNow,
    recommendedBundle,
    format,
    targetLoop,
    isFavorite,
  } = opportunity;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {FORMAT_LABELS[format]}
          </Badge>
          <button
            onClick={() => onToggleFavorite(id)}
            className="text-muted-foreground hover:text-yellow-500 transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            {isFavorite ? (
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-5 w-5" />
            )}
          </button>
        </div>
        <CardTitle className="text-base font-semibold mt-2">
          {keyword}
        </CardTitle>
        <Badge variant="outline" className="w-fit text-xs">
          {TARGET_LOOP_LABELS[targetLoop]}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Final Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">FinalScore</span>
          <span className="text-2xl font-bold text-primary">
            {finalScore.toFixed(1)}/10
          </span>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center bg-muted/50 rounded-lg p-3">
          <div>
            <div className="text-xs text-muted-foreground">Market</div>
            <div className="text-sm font-semibold">{marketScore.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Fit</div>
            <div className="text-sm font-semibold">{fitScore.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Sat</div>
            <div className="text-sm font-semibold">{saturationScore.toFixed(2)}</div>
          </div>
        </div>

        <Separator />

        {/* Why Now */}
        <div className="flex items-start gap-2">
          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground mb-1">왜 지금?</div>
            <div className="text-sm">{whyNow}</div>
          </div>
        </div>

        {/* Recommended Bundle */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">추천 번들</div>
          <div className="flex gap-3 text-sm">
            <span>Shorts x{recommendedBundle.shorts}</span>
            <span>Longform x{recommendedBundle.longform}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 flex gap-2">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onCreateDraft(id)}
        >
          <FileText className="h-4 w-4 mr-1" />
          Draft 생성
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExclude(id)}
        >
          <EyeOff className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

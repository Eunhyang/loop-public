"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearningCard as LearningCardType, LEARNING_CARD_TYPE_LABELS } from "../types/retro";
import { Lightbulb, TrendingUp, Video, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningCardProps {
  card: LearningCardType;
}

function getCardIcon(type: LearningCardType["type"]) {
  switch (type) {
    case "hook_pattern":
      return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    case "format_performance":
      return <Video className="h-5 w-5 text-blue-500" />;
    case "loop_response":
      return <Target className="h-5 w-5 text-purple-500" />;
  }
}

export function LearningCard({ card }: LearningCardProps) {
  const { type, title, items } = card;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            {getCardIcon(type)}
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {LEARNING_CARD_TYPE_LABELS[type]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {type === "hook_pattern" ? (
          // 순위 리스트 형태
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-1.5 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {item.rank}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium flex items-center gap-1",
                    item.isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {item.isPositive && <TrendingUp className="h-3 w-3" />}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          // 테이블 형태 (format_performance, loop_response)
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
              >
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold">{item.value}</span>
                  {item.delta && (
                    <span className="text-muted-foreground">
                      | {item.delta}
                    </span>
                  )}
                  {item.isPositive !== undefined && (
                    <span
                      className={cn(
                        item.isPositive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {item.isPositive ? <TrendingUp className="h-4 w-4" /> : null}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Auth Status Banner
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * Shows authentication status and login/logout buttons
 */

"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Youtube, AlertCircle, Loader2 } from "lucide-react";
import { useAuthStatus, useLogout, getLoginUrl } from "../hooks";

interface AuthStatusBannerProps {
  /** Whether showing real data or dummy data */
  dataSource?: "youtube_analytics" | "dummy";
  /** Warning message from API */
  warning?: string;
}

export function AuthStatusBanner({
  dataSource = "dummy",
  warning,
}: AuthStatusBannerProps) {
  const { data: authState, isLoading, error } = useAuthStatus();
  const logoutMutation = useLogout();

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card p-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking authentication...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span className="text-sm text-destructive">
          Failed to check authentication status
        </span>
      </div>
    );
  }

  // Authenticated state
  if (authState?.isAuthenticated) {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
        <div className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-foreground">
            Connected to YouTube
          </span>
          {authState.channel && (
            <span className="text-sm text-muted-foreground">
              ({authState.channel.title})
            </span>
          )}
        </div>
        <div className="flex-1" />
        {dataSource === "youtube_analytics" && (
          <span className="text-xs rounded bg-green-500/20 px-2 py-1 text-green-700 dark:text-green-400">
            Live Data
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Disconnect
        </Button>
      </div>
    );
  }

  // Unauthenticated state
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <span className="text-sm text-foreground">
          {warning || "Connect your YouTube channel to see real analytics data"}
        </span>
      </div>
      <div className="flex-1" />
      <span className="text-xs rounded bg-yellow-500/20 px-2 py-1 text-yellow-700 dark:text-yellow-400">
        Demo Data
      </span>
      <Button variant="default" size="sm" onClick={handleLogin}>
        <LogIn className="mr-2 h-4 w-4" />
        Connect YouTube
      </Button>
    </div>
  );
}

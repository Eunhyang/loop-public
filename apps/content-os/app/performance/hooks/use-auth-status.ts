/**
 * Auth Status Hook
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * TanStack Query hook for YouTube OAuth status
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthState } from "@/types/youtube-analytics";

interface AuthStatusResponse {
  success: boolean;
  data?: AuthState;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Fetch auth status from API
 */
async function fetchAuthStatus(): Promise<AuthState> {
  const response = await fetch("/api/auth/youtube/status");
  const data: AuthStatusResponse = await response.json();

  if (!data.success || !data.data) {
    return {
      status: "unauthenticated",
      isAuthenticated: false,
      error: data.error?.message,
    };
  }

  return data.data;
}

/**
 * Logout from YouTube
 */
async function logout(): Promise<void> {
  const response = await fetch("/api/auth/youtube/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}

/**
 * Hook to get current auth status
 */
export function useAuthStatus() {
  return useQuery({
    queryKey: ["youtube", "auth", "status"],
    queryFn: fetchAuthStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}

/**
 * Hook to logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Invalidate auth status
      queryClient.setQueryData(["youtube", "auth", "status"], {
        status: "unauthenticated",
        isAuthenticated: false,
      });

      // Invalidate analytics data to trigger refetch with dummy data
      queryClient.invalidateQueries({ queryKey: ["youtube", "analytics"] });
    },
  });
}

/**
 * Get login URL
 */
export function getLoginUrl(): string {
  return "/api/auth/youtube/login";
}

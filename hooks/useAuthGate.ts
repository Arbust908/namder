// hooks/useAuthGate.ts
// Shared shape for pages that gate on auth state: read auth synchronously on
// first client render (no flash of the wrong view — SSR returns anonymous
// safely since localStorage is unavailable there), then redirect once the
// effect confirms the same predicate against a fresh read.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthState, type AuthState } from "@/lib/authState";

export function useAuthGate(
  shouldRedirect: (state: AuthState) => boolean,
  to: string
): AuthState {
  const router = useRouter();
  const state = getAuthState();

  useEffect(() => {
    if (shouldRedirect(getAuthState())) router.push(to);
  }, [router]);

  return state;
}

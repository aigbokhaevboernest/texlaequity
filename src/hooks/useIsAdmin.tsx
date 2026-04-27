import { useAuth } from "./useAuth";

/**
 * Backwards-compatible thin wrapper around the centralized role in `useAuth`.
 * Prefer `useAuth()` directly in new code.
 */
export const useIsAdmin = () => {
  const { isAdmin, loading, roleLoading } = useAuth();
  return { isAdmin, loading: loading || roleLoading };
};

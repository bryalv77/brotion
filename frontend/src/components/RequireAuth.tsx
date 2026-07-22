import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../stores/session.js";

/**
 * Blocks rendering until the session is confirmed; redirects to /login if not.
 * Subscribes to the session store so it reacts to logout.
 */
export function RequireAuth() {
  const { user, loading, fetchMe } = useSession();

  useEffect(() => {
    if (!user && loading) {
      void fetchMe();
    }
  }, [user, loading, fetchMe]);

  if (user) return <Outlet />;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin text-neutral-400">Loading…</div>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
}

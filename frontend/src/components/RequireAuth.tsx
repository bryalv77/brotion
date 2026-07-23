import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../stores/session.js";

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
        <div className="animate-spin text-neutral-400 dark:text-neutral-500">Loading…</div>
      </div>
    );
  }

  return <Navigate to="/login" replace />;
}

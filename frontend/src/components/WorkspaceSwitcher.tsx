import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaces } from "../hooks/useWorkspaces.js";

export function WorkspaceSwitcher() {
  const { wsId } = useParams();
  const navigate = useNavigate();
  const { data: workspaces, isLoading } = useWorkspaces();
  const [open, setOpen] = useState(false);

  const current = workspaces?.find((w) => w.id === wsId);

  if (isLoading) {
    return <div className="px-2 py-1.5 text-sm text-neutral-400">Loading…</div>;
  }

  if (!workspaces || workspaces.length === 0) {
    return <div className="px-2 py-1.5 text-sm text-neutral-400">No workspaces</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-neutral-200"
      >
        <span className="text-base">{current?.icon || "📁"}</span>
        <span className="flex-1 truncate">{current?.name || "Select workspace"}</span>
        <span className="text-neutral-400">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-neutral-200 bg-white py-1 shadow-md">
          {workspaces.map((w) => (
            <button
              key={w.id}
              onClick={() => {
                setOpen(false);
                navigate(`/app/${w.id}`);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-neutral-100"
            >
              <span>{w.icon || "📁"}</span>
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === wsId && <span className="text-blue-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

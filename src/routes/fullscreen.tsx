import {
  createFileRoute,
  useSearch,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TealFMFullscreen } from "@/components/fullscreen";
import { resolveHandle, isValidHandle } from "@/lib/atproto";

export const Route = createFileRoute("/fullscreen")({
  validateSearch: (search: Record<string, unknown>) => ({
    handle: (search.handle as string) || "",
    pds: (search.pds as string) || "",
    repo: (search.repo as string) || "",
  }),
  component: FullscreenPage,
});

function FullscreenPage() {
  const navigate = useNavigate();
  const { handle, pds, repo } = useSearch({ from: "/fullscreen" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have pds and repo, we're good to go
    if (pds && repo) {
      return;
    }

    // If we have a handle but no pds/repo, resolve and redirect
    if (handle && !pds && !repo) {
      const resolveAndRedirect = async () => {
        setLoading(true);
        try {
          if (!isValidHandle(handle)) {
            throw new Error("Invalid handle format");
          }

          const resolution = await resolveHandle(handle);

          // Redirect to the same route but with resolved pds/repo instead of handle
          navigate({
            to: "/fullscreen",
            search: {
              handle: "", // Clear handle to avoid re-resolving
              pds: resolution.pdsUrl,
              repo: resolution.did,
            },
            replace: true, // Replace the current history entry
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to resolve handle",
          );
          setLoading(false);
        }
      };

      resolveAndRedirect();
      return;
    }

    // If we have neither handle nor pds/repo, show error
    if (!handle && !pds && !repo) {
      setError("No handle, PDS, or repo provided");
      setLoading(false);
    }
  }, [handle, pds, repo, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Resolving {handle}...</p>
        </div>
      </div>
    );
  }

  if (error || !pds || !repo) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <p className="text-red-600">Failed to load teal.fm player</p>
          <p className="text-sm text-gray-500">
            {error || "Missing required parameters"}
          </p>
          <a
            href="/"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  return <TealFMFullscreen pdsAddress={pds} repo={repo} />;
}

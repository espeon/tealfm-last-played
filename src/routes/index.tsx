import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { resolveHandle, isValidHandle } from "@/lib/atproto";
import { useAtprotoRecords } from "@/hooks/useAtprotoRecords";
import { TealFMFullscreen } from "@/components/fullscreen";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState<{
    did: string;
    pdsUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  const {
    data: record,
    loading,
    error: recordError,
  } = useAtprotoRecords(
    resolved?.pdsUrl || "",
    resolved?.did || "",
    "fm.teal.alpha.feed.play",
  );

  const handleResolve = useCallback(async (handleToResolve: string) => {
    if (!handleToResolve.trim()) {
      setResolved(null);
      setError(null);
      return;
    }

    setResolving(true);
    setError(null);

    try {
      if (!isValidHandle(handleToResolve)) {
        throw new Error("Invalid handle format");
      }

      const resolution = await resolveHandle(handleToResolve);
      setResolved(resolution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve handle");
      setResolved(null);
    } finally {
      setResolving(false);
    }
  }, []);

  // Debounced auto-resolve effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleResolve(handle);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [handle, handleResolve]);

  const handleManualResolve = () => {
    handleResolve(handle);
  };

  const handleGoFullscreen = () => {
    navigate({
      to: "/fullscreen",
      search: {
        pds: resolved?.pdsUrl || "",
        repo: resolved?.did || "",
      } as any,
    });
  };

  const generateEmbedCode = () => {
    if (!handle.trim()) return "";

    // If we have resolved data, use pds/repo params for better performance
    if (resolved) {
      const embedUrl = `${window.location.origin}/fullscreen?pds=${encodeURIComponent(resolved.pdsUrl)}&repo=${encodeURIComponent(resolved.did)}&embed=true`;
      return `<iframe src="${embedUrl}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
    }

    // Fallback to handle param if not yet resolved
    const embedUrl = `${window.location.origin}/fullscreen?handle=${encodeURIComponent(handle)}&embed=true`;
    return `<iframe src="${embedUrl}" width="800" height="600" frameborder="0" allowfullscreen></iframe>`;
  };

  const copyEmbedCode = () => {
    const code = generateEmbedCode();
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-900 dark:text-teal-100 mb-4">
            teal.fm now playing
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            if you have teal.fm records, you can see your last played track in
            an embed.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              AT Protocol Handle or DID
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="alice.bsky.social or did:plc:..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!resolving && !resolved) {
                    handleManualResolve();
                  } else if (resolved) {
                    handleGoFullscreen();
                  }
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleGoFullscreen}
              disabled={!handle.trim()}
              className="bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go Fullscreen
            </button>

            <button
              onClick={() => setShowEmbed(!showEmbed)}
              disabled={!handle.trim()}
              className="bg-gray-600 dark:bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Get Embed
            </button>
          </div>

          {showEmbed && handle.trim() && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Embed Code:
              </div>
              <textarea
                readOnly
                value={generateEmbedCode()}
                className="w-full h-20 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded p-2 font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyEmbedCode}
                className="text-sm bg-teal-600 dark:bg-teal-700 text-white px-3 py-1 rounded hover:bg-teal-700 dark:hover:bg-teal-800 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          {resolved && (
            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-sm">
              <div className="text-green-800 dark:text-green-200 font-medium mb-1">
                Resolved successfully!
              </div>
              <div className="text-green-600 dark:text-green-300">
                DID: {resolved.did}
              </div>
              <div className="text-green-600 dark:text-green-300">
                PDS: {resolved.pdsUrl}
              </div>
              {loading && (
                <div className="text-green-600 dark:text-green-300 mt-2">
                  Loading records...
                </div>
              )}
              {recordError && (
                <div className="text-red-600 dark:text-red-400 mt-2">
                  Error loading records: {recordError.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          connect your music streaming service to see what's currently playing
        </div>
      </div>
    </div>
  );
}

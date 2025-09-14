import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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

  const handleResolve = async () => {
    if (!handle.trim()) return;

    setResolving(true);
    setError(null);

    try {
      if (!isValidHandle(handle)) {
        throw new Error("Invalid handle format");
      }

      const resolution = await resolveHandle(handle);
      setResolved(resolution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve handle");
      setResolved(null);
    } finally {
      setResolving(false);
    }
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

  if (resolved && record) {
    return (
      <TealFMFullscreen pdsAddress={resolved.pdsUrl} repo={resolved.did} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-900 mb-4">
            teal.fm now playing
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            if you have teal.fm records, you can see your last played track in
            an embed.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              AT Protocol Handle or DID
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="alice.bsky.social or did:plc:..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGoFullscreen();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleGoFullscreen}
              disabled={!handle.trim()}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go Fullscreen
            </button>

            <button
              onClick={() => setShowEmbed(!showEmbed)}
              disabled={!handle.trim()}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Get Embed
            </button>
          </div>

          {showEmbed && handle.trim() && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="text-sm font-medium text-gray-700">
                Embed Code:
              </div>
              <textarea
                readOnly
                value={generateEmbedCode()}
                className="w-full h-20 text-xs bg-white border border-gray-300 rounded p-2 font-mono"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={copyEmbedCode}
                className="text-sm bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700 transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {resolved && (
            <div className="bg-green-50 p-3 rounded-lg text-sm">
              <div className="text-green-800 font-medium mb-1">
                Resolved successfully!
              </div>
              <div className="text-green-600">DID: {resolved.did}</div>
              <div className="text-green-600">PDS: {resolved.pdsUrl}</div>
              {loading && (
                <div className="text-green-600 mt-2">Loading records...</div>
              )}
              {recordError && (
                <div className="text-red-600 mt-2">
                  Error loading records: {recordError.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center mt-6 text-sm text-gray-500">
          connect your music streaming service to see what's currently playing
        </div>
      </div>
    </div>
  );
}

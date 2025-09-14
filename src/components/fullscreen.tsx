"use client";
import { useState, useEffect } from "react";
import { ScrollingText } from "./scrolling-text";
import { useAtprotoRecords } from "../hooks/useAtprotoRecords";
import MeshArtBackground from "./shader";
import { isInIframe, shouldUseCompactMode } from "@/lib/embed";

function useQueryParam(param: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param) || undefined;
}

async function fetchAlbumArt(
  releaseMbId?: string,
  artistName?: string,
  releaseName?: string,
): Promise<string | null> {
  // Try Cover Art Archive first if we have an MBID
  if (releaseMbId) {
    try {
      const response = await fetch(
        `https://coverartarchive.org/release/${releaseMbId}/front-500`,
      );
      if (response.ok) {
        return response.url;
      }
    } catch (error) {
      console.log("Cover Art Archive failed:", error);
    }
  }

  // Fallback to MusicBrainz search + Cover Art Archive
  if (artistName && releaseName) {
    try {
      const searchQuery = `artist:"${artistName}" AND release:"${releaseName}"`;
      const mbResponse = await fetch(
        `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(searchQuery)}&fmt=json&limit=1`,
      );

      if (mbResponse.ok) {
        const mbData = await mbResponse.json();
        if (mbData.releases && mbData.releases.length > 0) {
          const mbid = mbData.releases[0].id;
          const coverResponse = await fetch(
            `https://coverartarchive.org/release/${mbid}/front-500`,
          );
          if (coverResponse.ok) {
            return coverResponse.url;
          }
        }
      }
    } catch (error) {
      console.log("MusicBrainz + Cover Art Archive fallback failed:", error);
    }
  }

  // Last.fm fallback
  if (artistName && releaseName) {
    try {
      // Note: You'll need a Last.fm API key for this to work in production
      const lastFmResponse = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=6f5ff9d828991a85bd78449a85548586&artist=${encodeURIComponent(artistName)}&album=${encodeURIComponent(releaseName)}&format=json`,
      );

      if (lastFmResponse.ok) {
        const lastFmData = await lastFmResponse.json();
        const images = lastFmData.album?.image;
        if (images && images.length > 0) {
          // Get the largest available image
          const largeImage =
            images.find((img: any) => img.size === "large") ||
            images[images.length - 1];
          if (largeImage && largeImage["#text"]) {
            return largeImage["#text"];
          }
        }
      }
    } catch (error) {
      console.log("Last.fm fallback failed:", error);
    }
  }

  return null;
}

function useAlbumArt(
  releaseMbId?: string,
  artistName?: string,
  releaseName?: string,
) {
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!releaseMbId && (!artistName || !releaseName)) {
      setAlbumArt(null);
      return;
    }

    setLoading(true);
    fetchAlbumArt(releaseMbId, artistName, releaseName)
      .then(setAlbumArt)
      .finally(() => setLoading(false));
  }, [releaseMbId, artistName, releaseName]);

  return { albumArt, loading };
}

export interface TealFMFullscreenProps {
  pdsAddress?: string;
  repo?: string;
  refreshIntervalMs?: number;
}

export function TealFMFullscreen({
  pdsAddress = "https://selfhosted.social",
  repo = "did:plc:k644h4rq5bjfzcetgsa6tuby",
  refreshIntervalMs = 45000,
}: TealFMFullscreenProps) {
  // All hooks must be called before any conditional returns
  const hideParam = Boolean(useQueryParam("hide"));
  const embedParam = Boolean(useQueryParam("embed"));
  const isEmbed = isInIframe() || embedParam;
  const useCompactMode = shouldUseCompactMode();

  const { data, loading, error } = useAtprotoRecords(
    pdsAddress,
    repo,
    "fm.teal.alpha.feed.play",
    refreshIntervalMs,
  );

  // Get artist names from artists array (do this before calling useAlbumArt)
  const artistNames =
    data?.value?.artists?.map((artist) => artist.artistName).join(", ") || "";

  // Call useAlbumArt hook before any returns
  const { albumArt, loading: artLoading } = useAlbumArt(
    data?.value?.releaseMbId,
    artistNames,
    data?.value?.releaseName,
  );

  // Now we can do conditional returns
  if (hideParam) {
    return <></>;
  }

  if (loading && !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-600 dark:text-red-400">Error loading TealFM</p>
          <p className="text-sm text-neutral-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      {/* Hide shader in embed mode */}
      {!isEmbed && (
        <MeshArtBackground
          imageUrl={albumArt || undefined}
          enableNavigationTransition={true}
          backgroundOpacity={albumArt ? 0.6 : 0.0}
        />
      )}

      {/* Embed mode: fullscreen album art with overlay */}
      {isEmbed ? (
        <div className="relative h-full w-full overflow-hidden">
          {/* Full-screen album art background */}
          {albumArt && (
            <img
              src={albumArt}
              alt="Album cover"
              className="absolute inset-0 h-full w-full object-cover blur-xs scale-125 overflow-hidden"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/10 to-black"></div>

          {/* Overlay with track info */}
          {data && data.value && (
            <div className="absolute inset-0 bg-black/40 flex items-end p-6">
              <div className="text-white w-full md:gap-1 xl:gap-4 flex flex-col">
                {data.value.trackName && (
                  <h1 className="text-2xl md:text-4xl xl:text-9xl font-bold drop-shadow-lg">
                    {data.value.trackName}
                  </h1>
                )}
                {artistNames && (
                  <h2 className="text-lg md:text-2xl xl:text-7xl drop-shadow-lg opacity-90">
                    {artistNames}
                  </h2>
                )}
                {data.value.releaseName && (
                  <h3 className="text-base md:text-2xl xl:text-7xl opacity-80 drop-shadow-lg">
                    {data.value.releaseName}
                  </h3>
                )}
                {data.value.playedTime && (
                  <p className="text-sm xl:text-3xl mt-2 opacity-70">
                    {new Date(data.value.playedTime).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Loading state for embed */}
          {(!data || artLoading) && (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-blue-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white mx-auto mb-4"></div>
                <p>Loading teal.fm...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Normal fullscreen mode */
        <div className="flex max-w-6xl flex-col items-center justify-center gap-8 p-8 text-center">
          {data && data.value && (
            <div className="flex w-full flex-1 min-w-2xl max-w-2xl flex-col gap-6 rounded-2xl bg-neutral-100/50 p-4 dark:bg-neutral-800/50 border-2 border-gray-500/20 md:flex-row md:gap-8">
              {/* Album Art */}
              <div className="flex-shrink-0">
                {albumArt ? (
                  <img
                    src={albumArt}
                    alt={`${data.value.releaseName || "Album"} cover art`}
                    className="h-64 w-64 rounded-lg object-cover shadow-lg"
                  />
                ) : artLoading ? (
                  <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-300 border-t-blue-600"></div>
                  </div>
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-700">
                    <svg
                      className="h-16 w-16 text-neutral-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex flex-1 flex-col gap-0 text-center md:text-left min-w-0 justify-around items-start pr-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400  font-mono">
                  Last Played
                </p>
                <div className="min-w-0 max-w-full">
                  {data.value.trackName && (
                    <div className="flex flex-col gap-1">
                      <ScrollingText
                        className="text-2xl font-semibold text-neutral-900 dark:text-white md:text-3xl"
                        text={data.value.trackName}
                      />
                    </div>
                  )}

                  {artistNames && (
                    <div className="flex flex-col gap-1">
                      <ScrollingText
                        className="text-2xl text-neutral-800 dark:text-neutral-200"
                        text={artistNames}
                      />
                    </div>
                  )}
                  {data.value.releaseName && (
                    <div className="flex flex-col gap-1">
                      <ScrollingText
                        className="text-2xl text-neutral-700 dark:text-neutral-300"
                        text={data.value.releaseName}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-row gap-2 justify-between items-center max-w-full w-full font-mono">
                  {data.value.playedTime && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {new Date(data.value.playedTime).toLocaleString()}
                    </div>
                  )}

                  {data.value.duration && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      {Math.floor(data.value.duration / 60)}:
                      {String(data.value.duration % 60).padStart(2, "0")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

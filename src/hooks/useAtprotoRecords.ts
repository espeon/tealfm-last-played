import { useState, useEffect, useCallback } from 'react';

interface AtprotoRecord {
  uri: string;
  cid: string;
  value: {
    $type: string;
    trackName?: string;
    artists?: Array<{
      artistName: string;
      artistMbId?: string;
    }>;
    releaseName?: string;
    releaseMbId?: string;
    recordingMbId?: string;
    duration?: number;
    playedTime?: string;
    submissionClientAgent?: string;
    [key: string]: any;
  };
}

interface AtprotoResponse {
  records: AtprotoRecord[];
  cursor?: string;
}

interface UseAtprotoRecordsReturn {
  data: AtprotoRecord | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAtprotoRecords(
  pdsAddress: string,
  repo: string,
  collection = 'fm.teal.alpha.feed.play',
  intervalMs = 45000
): UseAtprotoRecordsReturn {
  const [data, setData] = useState<AtprotoRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      const encodedRepo = encodeURIComponent(repo);
      const encodedCollection = encodeURIComponent(collection);
      const url = `${pdsAddress}/xrpc/com.atproto.repo.listRecords?repo=${encodedRepo}&collection=${encodedCollection}&limit=1`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: AtprotoResponse = await response.json();
      const latestRecord = result.records[0] || null;
      setData(latestRecord);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Failed to fetch AT Protocol records:', err);
    } finally {
      setLoading(false);
    }
  }, [pdsAddress, repo, collection]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, intervalMs);
    return () => clearInterval(interval);
  }, [fetchRecords, intervalMs]);

  return { data, loading, error, refetch };
}

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '@/lib/api';
import { Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultRow {
  userId: string;
  username: string;
  submissionTimeMs: number;
  runTimeMs: number;
  compileTimeMs: number;
  average: number;
  rank: number;
  topTen?: boolean;
}

const msToPretty = (ms: number) => {
  if (!Number.isFinite(ms) || ms < 0) return '0ms';
  if (ms < 1000) return `${ms} ms`;
  const s = (ms / 1000);
  if (s < 60) return `${s.toFixed(2)} s`;
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}m ${ss}s`;
};

const ContestResults: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);

  const fetchResults = async () => {
    if (!contestId) return;
    try {
      setLoading(true);
      const resp = await apiService.get<any>(`/contests/${contestId}/results`, {
        params: { search: search || undefined, page, limit: 20 },
      } as any);
      const data = (resp?.results ? resp : resp?.data) || resp;
      setRows(data?.results || []);
      setPages(data?.pages || 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    await fetchResults();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-4">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-4 text-sm text-blue-700">
          <Link to={`/contests/${contestId}`} className="hover:underline">Back to Contest</Link>
        </div>

        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">Contest Results</h1>
            <form onSubmit={onSearch} className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
                placeholder="Search username"
              />
              <Button type="submit" variant="secondary">Search</Button>
            </form>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-blue-600"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-2">Rank</th>
                    <th className="py-2 px-2">User</th>
                    <th className="py-2 px-2">Submission Time</th>
                    <th className="py-2 px-2">Avg Run Time</th>
                    <th className="py-2 px-2">Compile Time</th>
                    <th className="py-2 px-2">Average</th>
                    <th className="py-2 px-2">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-gray-500">No results yet</td></tr>
                  ) : rows.map((r, idx) => (
                    <tr key={`${r.userId}-${idx}`} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-semibold">{r.rank}</td>
                      <td className="py-2 px-2">{r.username}</td>
                      <td className="py-2 px-2">{msToPretty(r.submissionTimeMs)}</td>
                      <td className="py-2 px-2">{msToPretty(r.runTimeMs)}</td>
                      <td className="py-2 px-2">{msToPretty(r.compileTimeMs)}</td>
                      <td className="py-2 px-2">{msToPretty(r.average)}</td>
                      <td className="py-2 px-2">
                        {r.topTen ? (
                          <Star className="inline h-4 w-4 text-yellow-500 fill-yellow-400" />
                        ) : (
                          <span className="text-xs text-gray-600">Thank you for playing — best of luck next time!</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Page {page} of {pages}</div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Ranks are based on average of submission time + average run time + compile time (placeholder) divided by 3.
            Ties share the same rank. Prize on a tied rank is split equally across all users with that rank.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestResults;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, RotateCcw, Check } from 'lucide-react';
import CodeEditor from '@/components/common/CodeEditor';
import { apiService } from '@/lib/api';

// Keep language type compatible with ProblemDetail
 type Language = 'javascript' | 'python' | 'java' | 'cpp';

 interface Problem {
  _id: string;
  id?: string;
  title: string;
  description: string;
  difficulty: string;
  starterCode?: Record<string, string>;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

const getProblemId = (p: Problem | null | undefined) => {
  if (!p) return undefined;
  return (p as any)._id || (p as any).id;
};

const ContestProblemDetails: React.FC = () => {
  const { contestId, problemId } = useParams<{ contestId: string; problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('javascript');
  const [code, setCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [lastSubmitOk, setLastSubmitOk] = useState(false);

  const editorTheme = useMemo(() => {
    const t = (user as any)?.preferences?.editor?.theme;
    return t === 'vs-dark' ? 'vs-dark' : 'light';
  }, [user]);

  // Load the full problem list for this contest (supports populated or ObjectId array)
  useEffect(() => {
    const loadProblems = async () => {
      if (!contestId) return;
      try {
        const data = await apiService.get<any>(`/contests/${contestId}?populate=problems`);
        let arr: any[] = (data?.problems || (data?.contest?.problems) || []);
        // If not populated, fetch details
        const isPopulated = Array.isArray(arr) && arr[0] && (arr[0].title || arr[0].description);
        if (!isPopulated) {
          const ids = (arr || []).map((x: any) => (typeof x === 'string' ? x : (x?._id || x?.id))).filter(Boolean);
          const fetched = await Promise.all(ids.map((pid: string) => apiService.get<Problem>(`/problems/${pid}`)));
          arr = fetched.map((p: any) => p?.problem || p).filter(Boolean);
        }
        setProblems(arr as Problem[]);
      } catch (e) {
        console.error('Failed to load contest problems', e);
      }
    };
    loadProblems();
  }, [contestId]);

  // Load current problem content
  useEffect(() => {
    const load = async () => {
      if (!problemId) return;
      setLoading(true);
      try {
        const p = await apiService.get<Problem>(`/problems/${problemId}`);
        setProblem((p as any).problem || p);
        const initial = ((p as any).problem || p)?.starterCode?.[language] || '';
        setCode(initial);
        setLastSubmitOk(false);
      } catch (e) {
        console.error('Failed to load problem', e);
        toast.error('Failed to load problem');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [problemId, language]);

  const handleReset = useCallback(() => {
    if (!problem) return;
    setCode(problem.starterCode?.[language] || '');
  }, [problem, language]);

  const handleRun = useCallback(async () => {
    if (!problem) return;
    setIsBusy(true);
    try {
      // Reuse in-house execute endpoint for fast feedback
      const resp = await fetch('/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, lang: language.charAt(0).toUpperCase() + language.slice(1) }),
      });
      const data = await resp.json();
      const out = data?.output ?? data?.run?.output ?? '';
      toast.success(`Output:\n${String(out).slice(0, 400)}`);
    } catch (e) {
      console.error(e);
      toast.error('Run failed');
    } finally {
      setIsBusy(false);
    }
  }, [code, language, problem]);

  const doSubmit = useCallback(async () => {
    if (!problem) return;
    setIsBusy(true);
    try {
      const pid = String(getProblemId(problem));
      const resp = await apiService.post<any>(`/problems/${pid}/submit`, {
        code,
        language,
        contestId,
      });
      const ok = (resp as any)?.success ?? true;
      if (ok) {
        toast.success('Submitted!');
        setLastSubmitOk(true);
      } else {
        toast.error((resp as any)?.message || 'Submit failed');
        setLastSubmitOk(false);
      }
    } catch (e: any) {
      toast.error(String(e?.message || 'Submit failed'));
      setLastSubmitOk(false);
    } finally {
      setIsBusy(false);
    }
  }, [problem, code, language, contestId]);

  const handleSubmitAll = useCallback(async () => {
    await doSubmit();
    // mark contest complete flag and navigate back to contest page to show share view
    try {
      if (contestId) localStorage.setItem(`contestComplete:${contestId}`, '1');
    } catch {}
    navigate(`/contests/${contestId}`);
  }, [doSubmit, navigate, contestId]);

  if (loading || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Determine current index and next/prev availability
  const currentIndex = useMemo(() => {
    const pid = String(getProblemId(problem));
    return Math.max(0, problems.findIndex((p) => String(getProblemId(p)) === pid));
  }, [problems, problem]);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < problems.length - 1;
  const gotoIndex = (idx: number) => {
    const target = problems[idx];
    if (!target) return;
    const pid = String(getProblemId(target));
    navigate(`/contests/${contestId}/problems/${pid}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-4">
        <div className="mb-4 text-sm text-blue-700">
          <Link to={`/contests/${contestId}`} className="hover:underline">Back to Contest</Link>
        </div>

        <Card className="shadow-lg border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-xl sm:text-2xl font-bold">{problem.title}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] gap-4">
              {/* Sidebar: problem list */}
              <aside className="bg-white border rounded-lg p-3 h-max hidden lg:block">
                <h3 className="font-semibold mb-2">Problems</h3>
                <ol className="space-y-1">
                  {problems.map((p, idx) => {
                    const pid = String(getProblemId(p));
                    const active = idx === currentIndex;
                    return (
                      <li key={pid}>
                        <button
                          onClick={() => gotoIndex(idx)}
                          className={`w-full text-left px-2 py-1 rounded ${active ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
                        >
                          Problem {idx + 1}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </aside>

              {/* Left: Description */}
              <div className="order-1">
                <div className="prose max-w-none mb-4 text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div dangerouslySetInnerHTML={{ __html: problem.description }} />
                </div>
                {Array.isArray(problem.examples) && problem.examples.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Examples</h3>
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="text-sm"><b>Input:</b> <pre className="inline-block bg-white px-2 py-1 rounded border">{String(ex.input)}</pre></div>
                        <div className="text-sm"><b>Output:</b> <pre className="inline-block bg-white px-2 py-1 rounded border">{String(ex.output)}</pre></div>
                        {ex.explanation && <div className="text-sm"><b>Explanation:</b> {ex.explanation}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Editor */}
              <div className="space-y-3 order-2">
                <div className="flex items-center justify-between">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-md"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>

                <div className="border rounded-lg overflow-hidden shadow bg-white">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={language}
                    height="420px"
                    theme={editorTheme}
                    options={{ minimap: { enabled: false }, wordWrap: 'on', fontSize: 14 }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                  </Button>
                  <Button onClick={handleRun} variant="secondary" disabled={isBusy} className="flex-1">
                    {isBusy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>) : (<><Play className="mr-2 h-4 w-4" /> Run</>)}
                  </Button>
                  <Button onClick={doSubmit} disabled={isBusy} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    {isBusy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>) : (<><Check className="mr-2 h-4 w-4" /> Submit</>)}
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => gotoIndex(currentIndex + 1)}
                      disabled={!lastSubmitOk || !hasNext}
                      variant="outline"
                    >
                      Next Problem
                    </Button>
                  </div>
                  <div>
                    <Button onClick={handleSubmitAll} variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
                      Submit All & Complete Contest
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContestProblemDetails;

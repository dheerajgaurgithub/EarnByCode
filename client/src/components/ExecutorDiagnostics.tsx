import React, { useEffect, useState } from 'react';

interface ToolCheck {
  ok: boolean;
  stdout?: string;
  error?: string;
}

interface EnvCheck {
  ok: boolean;
  tools?: {
    python?: ToolCheck;
    javac?: ToolCheck;
    java?: ToolCheck;
    gxx?: ToolCheck;
  };
  executor?: {
    mode: string;
    pistonUrl: string;
  };
  error?: string;
}

const getApiBase = () => {
  const raw = (import.meta.env.VITE_API_URL as string) || '';
  return raw.replace(/\/+$/, '');
};

export const ExecutorDiagnostics: React.FC = () => {
  const [data, setData] = useState<EnvCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/env/check`);
        const json = await res.json();
        setData(json as EnvCheck);
      } catch (e: any) {
        setError(e?.message || 'Failed to check executor environment');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading) return <div className="p-4 text-sm">Checking executor environment...</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-blue-200 rounded-lg p-4">
        <h2 className="text-base font-semibold text-blue-900 mb-2">Executor</h2>
        <div className="text-sm text-blue-800">
          <div><span className="font-medium">Mode:</span> {data?.executor?.mode || 'unknown'}</div>
          <div className="break-all"><span className="font-medium">Piston URL:</span> {data?.executor?.pistonUrl || 'n/a'}</div>
          <div className="mt-1 text-xs text-blue-700">Server endpoint: {getApiBase()}/env/check</div>
        </div>
      </div>

      <div className="bg-white border border-blue-200 rounded-lg p-4">
        <h2 className="text-base font-semibold text-blue-900 mb-3">Toolchain Availability</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {(['python','javac','java','gxx'] as const).map(k => {
            const t = data?.tools?.[k];
            return (
              <div key={k} className="border border-blue-100 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-blue-900 uppercase">{k}</span>
                  <span className={t?.ok ? 'text-green-600' : 'text-red-600'}>{t?.ok ? 'OK' : 'Unavailable'}</span>
                </div>
                <div className="mt-1 text-xs text-blue-800 whitespace-pre-wrap break-all">
                  {t?.ok ? t?.stdout || '' : t?.error || ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

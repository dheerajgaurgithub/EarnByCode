import React, { useEffect, useState } from 'react';

type ToolStatus = { ok: boolean; stdout?: string; error?: string };

type EnvCheck = {
  ok: boolean;
  tools?: {
    python?: ToolStatus;
    javac?: ToolStatus;
    java?: ToolStatus;
    gxx?: ToolStatus;
  };
  error?: string;
};

function getApiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string) || 'https://algobucks.onrender.com/api';
  let base = raw.replace(/\/+$/, '');
  if (!/\/api$/.test(base)) base = `${base}/api`;
  return base;
}

const Dot: React.FC<{ ok?: boolean; label: string; title?: string }> = ({ ok, label, title }) => (
  <div className="flex items-center gap-1" title={title || ''}>
    <span
      className={
        'inline-block w-2 h-2 rounded-full ' +
        (ok === undefined ? 'bg-gray-300' : ok ? 'bg-emerald-500' : 'bg-red-500')
      }
    />
    <span className="text-[11px] text-slate-600">{label}</span>
  </div>
);

export const RuntimeStatus: React.FC = () => {
  const [data, setData] = useState<EnvCheck | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch(`${getApiBase()}/env/check`);
        const json = (await resp.json()) as EnvCheck;
        if (mounted) setData(json);
      } catch (e) {
        if (mounted) setData({ ok: false, error: String((e as any)?.message || e) });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tools = data?.tools || {};

  return (
    <div className="flex items-center gap-3 p-2 rounded-md border border-blue-200 bg-blue-50/60">
      <span className="text-[11px] font-medium text-slate-700">Runtime:</span>
      {loading ? (
        <span className="text-[11px] text-slate-500">Checking…</span>
      ) : data?.ok === false && !data?.tools ? (
        <span className="text-[11px] text-red-600" title={data?.error}>Unavailable</span>
      ) : (
        <div className="flex items-center gap-3">
          <Dot ok={tools.python?.ok} label="Py" title={tools.python?.stdout || tools.python?.error} />
          <Dot ok={tools.javac?.ok} label="Javac" title={tools.javac?.stdout || tools.javac?.error} />
          <Dot ok={tools.java?.ok} label="Java" title={tools.java?.stdout || tools.java?.error} />
          <Dot ok={tools.gxx?.ok} label="C++" title={tools.gxx?.stdout || tools.gxx?.error} />
        </div>
      )}
    </div>
  );
};

export default RuntimeStatus;

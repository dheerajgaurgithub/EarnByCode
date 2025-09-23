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

  if (loading) {
    return (
      <div className="p-3 sm:p-4 text-xs sm:text-sm bg-white dark:bg-black text-gray-900 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-gray-800 shadow-sm dark:shadow-gray-900/50 transition-all duration-500">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin transition-colors duration-500"></div>
          <span>Checking executor environment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-sm transition-all duration-500">
        <div className="flex items-center space-x-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 bg-white dark:bg-black min-h-full transition-colors duration-500">
      {/* Executor Information Card */}
      <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm dark:shadow-gray-900/50 transition-all duration-500">
        <h2 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-300 mb-2 sm:mb-3 transition-colors duration-500">
          Executor Environment
        </h2>
        <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-400 space-y-1 sm:space-y-2 transition-colors duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="font-medium min-w-[80px] text-gray-900 dark:text-blue-300">Mode:</span>
            <span className="bg-blue-100 dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-mono mt-1 sm:mt-0 sm:ml-2 transition-all duration-500">
              {data?.executor?.mode || 'unknown'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 dark:text-blue-300 mb-1">Piston URL:</span>
            <span className="break-all bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-mono transition-all duration-500">
              {data?.executor?.pistonUrl || 'n/a'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-100 dark:border-gray-700 transition-colors duration-500">
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Server endpoint:</span>
            <div className="break-all text-xs font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md mt-1 transition-all duration-500">
              {getApiBase()}/env/check
            </div>
          </div>
        </div>
      </div>

      {/* Toolchain Availability Card */}
      <div className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm dark:shadow-gray-900/50 transition-all duration-500">
        <h2 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-300 mb-3 sm:mb-4 transition-colors duration-500">
          Toolchain Availability
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          {(['python', 'javac', 'java', 'gxx'] as const).map(k => {
            const t = data?.tools?.[k];
            return (
              <div key={k} className="border border-blue-100 dark:border-gray-700 rounded-md sm:rounded-lg p-2 sm:p-3 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <span className="font-medium text-blue-900 dark:text-blue-300 uppercase text-xs tracking-wide transition-colors duration-500">
                    {k}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold transition-all duration-500 ${
                    t?.ok 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {t?.ok ? 'OK' : 'Unavailable'}
                  </span>
                </div>
                <div className="text-xs text-blue-800 dark:text-blue-400 whitespace-pre-wrap break-all bg-gray-50 dark:bg-gray-700 p-2 rounded-md transition-all duration-500 max-h-20 overflow-y-auto">
                  {t?.ok ? (t?.stdout || 'Tool available') : (t?.error || 'Tool not found')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Status Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm dark:shadow-gray-900/50 transition-all duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 transition-colors duration-500">
              Environment Status
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 transition-colors duration-500">
              Overall system health check
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {data?.ok ? (
              <>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse transition-colors duration-500"></div>
                <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 transition-colors duration-500">
                  Ready
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse transition-colors duration-500"></div>
                <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 transition-colors duration-500">
                  Issues Detected
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { apiService } from '@/lib/api';

type DayItem = { date: string; count: number };

interface ActivityResponse {
  success: boolean;
  days: number;
  start: string;
  end: string;
  activity: DayItem[];
}

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}

const shades = {
  // 0 is red scale (subtle) as requested; >0 uses green scale
  zero: ['bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300'],
  green: ['bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-700'],
};

function colorFor(count: number, thresholds: number[]): string {
  if (!count) return shades.zero[0];
  // thresholds is an ascending array e.g. [1,2,4,6]
  // 0..thresholds[0): green[0]
  // thresholds[0]..thresholds[1]): green[1], etc
  if (count >= thresholds[3]) return shades.green[3];
  if (count >= thresholds[2]) return shades.green[2];
  if (count >= thresholds[1]) return shades.green[1];
  return shades.green[0];
}

function getWeekday(dateStr: string): number {
  // Returns 0..6 (Sun..Sat) in UTC
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.getUTCDay();
}

function formatLabel(d: string, c: number) {
  return `${d} — ${c} submission${c === 1 ? '' : 's'}`;
}

interface SubmissionCalendarProps {
  days?: number;
  thresholds?: number[]; // ascending array of 4 numbers, defaults to [1,2,4,6]
}

const SubmissionCalendar: React.FC<SubmissionCalendarProps> = ({ days = 365, thresholds = [1, 2, 4, 6] }) => {
  const [data, setData] = React.useState<DayItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiService.get<ActivityResponse>(`/users/me/activity`, { params: { days } } as any);
        const payload: ActivityResponse = (res as any).data || (res as any);
        setData(payload.activity || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [days]);

  // Transform to weeks (columns)
  const weeks: DayItem[][] = React.useMemo(() => {
    if (!data?.length) return [];
    const cols: DayItem[][] = [];
    let col: DayItem[] = [];
    // Align to start on Sunday column
    const first = data[0];
    const pad = getWeekday(first.date);
    for (let i = 0; i < pad; i++) col.push({ date: '', count: -1 });
    for (const item of data) {
      col.push(item);
      if (col.length === 7) {
        cols.push(col);
        col = [];
      }
    }
    if (col.length > 0) {
      while (col.length < 7) col.push({ date: '', count: -1 });
      cols.push(col);
    }
    return cols;
  }, [data]);

  // Month labels for each column (week). Label when month changes
  const monthLabels = React.useMemo(() => {
    const labels: string[] = [];
    let lastMonth = -1;
    for (const week of weeks) {
      const firstValid = week.find(d => d.date);
      if (!firstValid) { labels.push(''); continue; }
      const dt = new Date(firstValid.date + 'T00:00:00Z');
      const m = dt.getUTCMonth();
      const label = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
      if (m !== lastMonth) {
        labels.push(label);
        lastMonth = m;
      } else {
        labels.push('');
      }
    }
    return labels;
  }, [weeks]);

  if (loading) {
    return (
      <div className="text-sm text-blue-600 dark:text-blue-400">Loading activity…</div>
    );
  }
  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-100 dark:border-green-700 p-4 sm:p-6 transition-all duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-sky-900 dark:text-green-300 flex items-center">
          <svg className="w-5 h-5 mr-2 text-sky-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Activity Heatmap
        </h3>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-sky-600 dark:text-green-400 bg-sky-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-green-600">
          <span className="font-medium">Less</span>
          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${shades.zero[0]}`}></span>
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${shades.green[0]}`}></span>
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${shades.green[1]}`}></span>
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${shades.green[2]}`}></span>
            <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded ${shades.green[3]}`}></span>
          </div>
          <span className="font-medium">More</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-sky-50 to-sky-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 sm:p-4 border border-sky-200 dark:border-green-600 shadow-inner">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-sky-300 dark:scrollbar-thumb-green-600 scrollbar-track-transparent">
          <div className="min-w-max">
            {/* Month labels row */}
            <div className="flex gap-0.5 sm:gap-1 ml-0 mb-2 pl-px select-none">
              {monthLabels.map((lbl, i) => (
                <div 
                  key={i} 
                  className="w-2.5 sm:w-3 md:w-3.5 text-[9px] sm:text-[10px] md:text-[11px] font-medium text-sky-600 dark:text-green-400 text-center"
                >
                  {lbl}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="flex gap-0.5 sm:gap-1">
              {weeks.map((week, i) => (
                <div key={i} className="flex flex-col gap-0.5 sm:gap-1">
                  {week.map((d, j) => (
                    <div 
                      key={j} 
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded transition-all duration-200 hover:scale-110 hover:shadow-md cursor-pointer ${
                        d.count === -1 
                          ? 'bg-transparent' 
                          : `${colorFor(d.count, thresholds)} hover:ring-2 hover:ring-sky-400 dark:hover:ring-green-500 hover:ring-opacity-50`
                      }`}
                      title={d.date ? formatLabel(d.date, d.count) : ''}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
            
            {/* Week day labels (mobile only) */}
            <div className="sm:hidden mt-3 flex justify-between text-[9px] text-sky-600 dark:text-green-400 font-medium">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 pt-3 border-t border-sky-200 dark:border-green-600">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-sky-200 dark:border-green-600">
              <p className="text-xs sm:text-sm font-bold text-sky-800 dark:text-green-300">
                {weeks.flat().filter(d => d.count > 0).length}
              </p>
              <p className="text-[10px] sm:text-xs text-sky-600 dark:text-green-400 font-medium">Active Days</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-sky-200 dark:border-green-600">
              <p className="text-xs sm:text-sm font-bold text-sky-800 dark:text-green-300">
                {Math.max(...weeks.flat().map(d => d.count).filter(c => c > 0), 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-sky-600 dark:text-green-400 font-medium">Best Day</p>
            </div>
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-2 border border-sky-200 dark:border-green-600">
              <p className="text-xs sm:text-sm font-bold text-sky-800 dark:text-green-300">
                {weeks.flat().reduce((sum, d) => sum + Math.max(0, d.count), 0)}
              </p>
              <p className="text-[10px] sm:text-xs text-sky-600 dark:text-green-400 font-medium">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SubmissionCalendar;

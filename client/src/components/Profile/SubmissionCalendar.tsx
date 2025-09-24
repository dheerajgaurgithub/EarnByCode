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
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-blue-200 dark:border-gray-700 p-3 sm:p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-400">Activity</h3>
        <div className="hidden sm:flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          <span>Less</span>
          <span className={classNames('w-3 h-3 rounded', shades.zero[0])}></span>
          <span className={classNames('w-3 h-3 rounded', shades.green[0])}></span>
          <span className={classNames('w-3 h-3 rounded', shades.green[1])}></span>
          <span className={classNames('w-3 h-3 rounded', shades.green[2])}></span>
          <span className={classNames('w-3 h-3 rounded', shades.green[3])}></span>
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        {/* Month labels row */}
        <div className="flex gap-1 ml-0 mb-1 pl-px select-none">
          {monthLabels.map((lbl, i) => (
            <div key={i} className="w-3 sm:w-3.5 text-[10px] sm:text-[11px] text-blue-500 dark:text-blue-400">
              {lbl}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.map((d, j) => (
                <div key={j} className={classNames('w-3 h-3 sm:w-3.5 sm:h-3.5 rounded',
                  d.count === -1 ? 'bg-transparent' : colorFor(d.count, thresholds)
                )} title={d.date ? formatLabel(d.date, d.count) : ''}></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionCalendar;

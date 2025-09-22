import React, { useEffect, useState } from 'react';
import apiService from '@/services/api';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';

interface Metrics {
  totalCollected: number;
  totalPayouts: number;
  adminBalance: number;
}

const currencyFormat = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

const WalletDashboard: React.FC = () => {
  const { t } = useI18n();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [contestId, setContestId] = useState('');
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getAdminWalletMetrics();
      setMetrics(res.metrics);
    } catch (e: any) {
      setError(e?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const onSettle = async () => {
    if (!contestId) return;
    try {
      setSettling(true);
      setError(null);
      await apiService.settleContest(contestId);
      await loadMetrics();
      setContestId('');
      alert('Contest settled');
    } catch (e: any) {
      setError(e?.message || 'Failed to settle contest');
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('admin.wallet.metrics')}</h1>
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 mb-4">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t('admin.wallet.total_collected')}</div>
          <div className="text-xl font-semibold mt-1">{loading ? '…' : currencyFormat(metrics?.totalCollected || 0)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t('admin.wallet.total_payouts')}</div>
          <div className="text-xl font-semibold mt-1">{loading ? '…' : currencyFormat(metrics?.totalPayouts || 0)}</div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="text-sm text-gray-500">{t('admin.wallet.admin_balance')}</div>
          <div className="text-xl font-semibold mt-1">{loading ? '…' : currencyFormat(metrics?.adminBalance || 0)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">{t('admin.wallet.settle_contest')}</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1" htmlFor="contestId">{t('admin.wallet.contest_id')}</label>
            <input
              id="contestId"
              className="w-full border rounded-md px-3 py-2"
              placeholder="e.g. 66f4c..."
              value={contestId}
              onChange={(e) => setContestId(e.target.value)}
            />
          </div>
          <Button className="sm:w-auto" onClick={onSettle} disabled={!contestId || settling}>
            {settling ? '...' : t('admin.wallet.settle')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;

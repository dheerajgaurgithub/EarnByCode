import React, { useCallback, useEffect, useMemo, useState, Fragment } from 'react';
import apiService from '@/services/api';
import { Dialog, Transition } from '@headlessui/react';
import { Loader2, Clock, AlertTriangle, RefreshCcw, CheckCircle2, Trash2 } from 'lucide-react';

export type PendingDeletion = {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  windowExpiresAt: string | null;
  recoveryRequested: boolean;
  recoveryRequestedAt: string | null;
  expired: boolean;
  requestedAt: string | null;
};

const RecentlyDeletedAccounts: React.FC = () => {
  const [rows, setRows] = useState<PendingDeletion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includeExpired, setIncludeExpired] = useState<boolean>(true);

  // Recovery modal state
  const [showRecoverModal, setShowRecoverModal] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [pendingEmails, setPendingEmails] = useState<string[]>([]);
  const [resultMsg, setResultMsg] = useState<string>('');

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await apiService.getAdminPendingDeletions(includeExpired);
      setRows(resp.users || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load recently deleted accounts');
    } finally {
      setLoading(false);
    }
  }, [includeExpired]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allSelected = useMemo(() => rows.length > 0 && selected.size === rows.length, [rows, selected]);
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r._id)));
  };

  const handleRecoverSelected = async () => {
    if (selected.size === 0) return;
    const selectedRows = rows.filter(r => selected.has(r._id));
    setPendingEmails(selectedRows.map(r => r.email));
    setShowRecoverModal(true);
    setProcessing(false);
    setResultMsg('');
    setProgressMsg(`Ready to recover ${selectedRows.length} account(s)`);
  };

  const performRecovery = async () => {
    const targets = rows.filter(r => selected.has(r._id));
    setProcessing(true);
    setResultMsg('');
    let ok = 0; let fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setProgressMsg(`Recovering ${t.email} (${i+1}/${targets.length})...`);
      try {
        const res = await apiService.adminRecoverUser(t._id);
        if (res?.success) ok++; else fail++;
      } catch {
        fail++;
      }
    }
    setProgressMsg('');
    setResultMsg(`Completed: ${ok} recovered, ${fail} failed`);
    setProcessing(false);
    await fetchRows();
    setSelected(new Set());
  };

  const handlePurge = async (id: string) => {
    if (!window.confirm('Permanently remove this account? This cannot be undone.')) return;
    try {
      await apiService.adminPurgeUser(id);
      await fetchRows();
    } catch (e) {
      console.error(e);
      alert('Failed to purge user');
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-900">Recently Deleted (24h window)</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 flex items-center gap-1">
            <input type="checkbox" checked={includeExpired} onChange={e => setIncludeExpired(e.target.checked)} /> Include expired
          </label>
          <button onClick={fetchRows} className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1">
            <RefreshCcw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button disabled={selected.size===0} onClick={handleRecoverSelected} className={`px-3 py-1.5 text-xs rounded-md text-white ${selected.size===0? 'bg-blue-300':'bg-blue-600 hover:bg-blue-700'}`}>Recover Selected</button>
        </div>
      </div>

      {error && <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded">{error}</div>}

      <div className="border border-blue-100 rounded-md overflow-hidden bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-2 text-left w-8"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Requested</th>
              <th className="p-2 text-left">Window Expires</th>
              <th className="p-2 text-left">Recovery Requested</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500"><Loader2 className="inline h-4 w-4 animate-spin mr-1"/>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">No recently deleted accounts</td></tr>
            ) : rows.map(r => (
              <tr key={r._id} className="border-t border-blue-50 hover:bg-blue-50/30">
                <td className="p-2"><input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleSelect(r._id)} /></td>
                <td className="p-2 font-medium">{r.username}</td>
                <td className="p-2">{r.email}</td>
                <td className="p-2">{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '-'}</td>
                <td className="p-2 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-500" />{r.windowExpiresAt ? new Date(r.windowExpiresAt).toLocaleString() : '-'}</td>
                <td className="p-2">{r.recoveryRequested ? <span className="inline-flex items-center text-green-700"><CheckCircle2 className="h-3.5 w-3.5 mr-1"/>Yes</span> : 'No'}</td>
                <td className="p-2">{r.expired ? <span className="text-red-600 inline-flex items-center"><AlertTriangle className="h-3.5 w-3.5 mr-1"/>Expired</span> : 'Active'}</td>
                <td className="p-2 flex gap-2">
                  <button disabled={r.expired} onClick={() => { setSelected(new Set([r._id])); setPendingEmails([r.email]); setShowRecoverModal(true); setProcessing(false); setResultMsg(''); setProgressMsg(`Ready to recover 1 account`); }} className={`px-2 py-1 text-xs rounded-md text-white ${r.expired? 'bg-blue-300':'bg-blue-600 hover:bg-blue-700'}`}>Recover</button>
                  <button onClick={() => handlePurge(r._id)} className="px-2 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"><Trash2 className="h-3.5 w-3.5"/>Purge</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recovery modal that stays until success */}
      <Transition show={showRecoverModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { if (!processing) setShowRecoverModal(false); }}>
          <div className="fixed inset-0 bg-black/30" />
          <div className="fixed inset-0 z-50 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-4 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-base font-medium leading-6 text-blue-900 mb-2">Recover selected account(s)</Dialog.Title>
                <p className="text-xs text-gray-700 mb-2">Email(s) to recover:</p>
                <div className="max-h-32 overflow-auto border border-blue-100 rounded p-2 text-xs mb-3 bg-gray-50">
                  {pendingEmails.map(em => (<div key={em}>{em}</div>))}
                </div>
                {progressMsg && <div className="text-xs text-gray-700 mb-2">{progressMsg}</div>}
                {resultMsg && <div className="text-xs text-gray-800 mb-2">{resultMsg}</div>}
                <div className="flex justify-end gap-2">
                  <button disabled={processing} onClick={() => setShowRecoverModal(false)} className="px-3 py-1.5 text-xs rounded-md bg-gray-100 hover:bg-gray-200">Close</button>
                  <button onClick={performRecovery} disabled={processing} className={`px-3 py-1.5 text-xs rounded-md text-white ${processing? 'bg-blue-300':'bg-blue-600 hover:bg-blue-700'} flex items-center gap-1`}>
                    {processing && <Loader2 className="h-3.5 w-3.5 animate-spin"/>}
                    {processing ? 'Recovering…' : 'Recover now'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default RecentlyDeletedAccounts;

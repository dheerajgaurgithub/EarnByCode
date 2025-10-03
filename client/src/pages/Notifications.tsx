import React from 'react';
import svcApi from '@/services/api';
import { Loader2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

type Note = {
  _id: string;
  type: 'follow_request' | 'follow_approved' | 'started_following' | 'contest_assigned';
  actor: { _id: string; username: string; fullName?: string; avatarUrl?: string } | string;
  targetUser: string;
  status: 'pending' | 'approved' | 'declined' | 'delivered';
  readAt?: string | null;
  createdAt: string;
  metadata?: {
    contestId?: string;
    title?: string;
    startTime?: string | null;
    endTime?: string | null;
    note?: string;
  };
};

const Notifications: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<Note[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await svcApi.getNotifications({ status: 'all', limit: 50 });
      setItems((res as any)?.notifications || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { load(); }, []);

  const onApprove = async (id: string) => {
    try {
      setBusy(id);
      await svcApi.approveFollowRequest(id);
      await load();
    } catch {}
    finally { setBusy(null); }
  };

  const onDecline = async (id: string) => {
    try {
      setBusy(id);
      await svcApi.declineFollowRequest(id);
      await load();
    } catch {}
    finally { setBusy(null); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 py-4">
      <h1 className="text-lg font-bold text-sky-800 dark:text-green-300 mb-3">Notifications</h1>
      {error && (
        <div className="mb-3 p-2 text-xs rounded-md border border-red-200 bg-red-50 text-red-700">{error}</div>
      )}
      {items.length === 0 ? (
        <div className="text-xs text-sky-600 dark:text-green-400">No notifications.</div>
      ) : (
        <div className="space-y-2">
          {items.map(n => {
            const actor = (n.actor as any) || {};
            const when = new Date(n.createdAt).toLocaleString();
            const meta = (n.metadata as any) || {};
            const isFollowReq = n.type === 'follow_request' && n.status === 'pending';
            return (
              <div key={n._id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 border border-sky-200 dark:border-green-800 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-sky-100 dark:bg-gray-800 border border-sky-200 dark:border-green-800 flex items-center justify-center">
                    {actor?.avatarUrl ? (
                      <img src={actor.avatarUrl} alt={actor.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sky-700 dark:text-green-400 text-xs font-bold">{(actor?.username || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-xs">
                    {n.type === 'follow_request' && (
                      <>
                        <Link to={`/u/${actor.username}`} className="font-semibold text-sky-700 dark:text-green-400 hover:underline">@{actor.username}</Link> wants to follow you
                      </>
                    )}
                    {n.type === 'follow_approved' && (
                      <>
                        <Link to={`/u/${actor.username}`} className="font-semibold text-sky-700 dark:text-green-400 hover:underline">@{actor.username}</Link> approved your follow request
                      </>
                    )}
                    {n.type === 'started_following' && (
                      <>
                        <Link to={`/u/${actor.username}`} className="font-semibold text-sky-700 dark:text-green-400 hover:underline">@{actor.username}</Link> started following you
                      </>
                    )}
                    {n.type === 'contest_assigned' && (
                      <>
                        <span className="font-semibold text-sky-700 dark:text-green-400">Admin</span> assigned a contest: {meta?.title || 'Contest'}
                        {meta?.startTime && (
                          <>
                            <span> — Starts: {new Date(meta.startTime).toLocaleString()}</span>
                          </>
                        )}
                        {meta?.endTime && (
                          <>
                            <span> — Ends: {new Date(meta.endTime).toLocaleString()}</span>
                          </>
                        )}
                        {meta?.note && (
                          <div className="mt-0.5 text-[10px] text-gray-600 dark:text-gray-400">Note: {meta.note}</div>
                        )}
                        {meta?.contestId && (
                          <div className="mt-0.5">
                            <Link to={`/contests/${meta.contestId}`} className="text-[10px] text-sky-600 dark:text-green-400 underline">View contest</Link>
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-[10px] text-gray-500 mt-0.5">{when}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isFollowReq ? (
                    <>
                      <button disabled={busy===n._id} onClick={() => onApprove(n._id)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                        {busy===n._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>} Approve
                      </button>
                      <button disabled={busy===n._id} onClick={() => onDecline(n._id)} className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-red-600 text-white hover:bg-red-700">
                        {busy===n._id ? <Loader2 className="w-3 h-3 animate-spin"/> : <X className="w-3 h-3"/>} Decline
                      </button>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;

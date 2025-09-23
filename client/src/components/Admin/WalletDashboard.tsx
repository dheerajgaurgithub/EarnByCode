import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { walletService, WalletStatus } from '@/services/walletService';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

export const WalletDashboard = () => {
  interface Wallet {
    _id: string;
    username: string;
    email: string;
    walletBalance: number;
    walletCurrency: string;
    walletStatus: WalletStatus;
    lastWalletActivity?: string;
  }

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  // Expanded bank details state
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankDetailsByUser, setBankDetailsByUser] = useState<Record<string, any>>({});

  // Bank Details directory list state (for all users)
  const [bankList, setBankList] = useState<Array<any>>([]);
  const [bankListLoading, setBankListLoading] = useState<boolean>(false);
  const [bankListPage, setBankListPage] = useState<number>(1);
  const [bankListPages, setBankListPages] = useState<number>(1);
  const [bankSearch, setBankSearch] = useState<string>('');
  const [bankSort, setBankSort] = useState<'lastUpdatedAt' | 'accountName' | 'bankName' | 'ifsc' | 'createdAt'>('lastUpdatedAt');
  const [bankOrder, setBankOrder] = useState<'asc' | 'desc'>('desc');
  const [bankMissingOnly, setBankMissingOnly] = useState<boolean>(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const data = await walletService.adminGetAllWallets(
        page,
        10,
        statusFilter || undefined
      );
      
      setWallets(data.wallets);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error('Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page, statusFilter]);

  // Fetch bank details directory (admin)
  const fetchBankDirectory = async () => {
    try {
      setBankListLoading(true);
      const resp = await api.get('/admin/users/bank-details', {
        params: {
          page: bankListPage,
          limit: 10,
          search: bankSearch || undefined,
          sort: bankSort,
          order: bankOrder,
          missing: bankMissingOnly || undefined,
        }
      });
      const data = (resp as any)?.data || resp;
      setBankList(data?.users || []);
      setBankListPages(data?.pages || 1);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch bank directory');
    } finally {
      setBankListLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDirectory();
  }, [bankListPage, bankSearch, bankSort, bankOrder, bankMissingOnly]);

  const toggleBankDetails = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (bankDetailsByUser[userId]) return; // already fetched
    try {
      setBankLoading(true);
      const resp = await api.get(`/admin/users/${userId}/bank-details`);
      const data = (resp as any)?.data || resp;
      setBankDetailsByUser((m) => ({ ...m, [userId]: data?.bankDetails || null }));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to fetch bank details');
    } finally {
      setBankLoading(false);
    }
  };

  const getStatusBadge = (status: WalletStatus) => {
    const statusMap = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      restricted: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={`${statusMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    const code = currency || 'INR';
    const locale = code === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Wallet Management</h2>
        <div className="flex space-x-4">
          <Input
            placeholder="Search users..."
            className="max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading wallets...
                  </TableCell>
                </TableRow>
              ) : wallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No wallets found
                  </TableCell>
                </TableRow>
              ) : (
                wallets.map((wallet) => (
                  <React.Fragment key={wallet._id}>
                    <TableRow>
                      <TableCell className="font-medium">{wallet.username}</TableCell>
                      <TableCell>{wallet.email}</TableCell>
                      <TableCell>
                        {formatCurrency(wallet.walletBalance, wallet.walletCurrency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(wallet.walletStatus)}</TableCell>
                      <TableCell>
                        {wallet.lastWalletActivity 
                          ? format(new Date(wallet.lastWalletActivity), 'PPpp')
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => toggleBankDetails(wallet._id)}>
                          {expandedUserId === wallet._id ? 'Hide Bank' : 'View Bank'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedUserId === wallet._id && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 border rounded-md bg-muted/30">
                            {bankLoading && !bankDetailsByUser[wallet._id] ? (
                              <div className="text-sm text-muted-foreground">Loading bank details...</div>
                            ) : bankDetailsByUser[wallet._id] ? (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Account Holder</div>
                                  <div className="font-medium">{bankDetailsByUser[wallet._id]?.bankAccountName || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Bank Name</div>
                                  <div className="font-medium">{bankDetailsByUser[wallet._id]?.bankName || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">IFSC</div>
                                  <div className="font-medium tracking-wider">{bankDetailsByUser[wallet._id]?.ifsc || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">UPI ID</div>
                                  <div className="font-medium">{bankDetailsByUser[wallet._id]?.upiId || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Account Last 4</div>
                                  <div className="font-medium">{bankDetailsByUser[wallet._id]?.bankAccountNumberLast4 || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Verified</div>
                                  <div className="font-medium">{bankDetailsByUser[wallet._id]?.verified ? 'Yes' : 'No'}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No bank details found.</div>
                            )}
                            <p className="text-xs text-muted-foreground mt-3">Handle bank data securely. Do not share outside finance workflows.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Users' Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by user/email/name/IFSC/UPI/last4"
                className="w-[280px]"
                value={bankSearch}
                onChange={(e) => {
                  setBankListPage(1);
                  setBankSearch(e.target.value);
                }}
              />
              <Button variant="outline" size="sm" onClick={() => { setBankListPage(1); fetchBankDirectory(); }}>
                Search
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={bankSort} onValueChange={(v) => { setBankListPage(1); setBankSort(v as any); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastUpdatedAt">Last Updated</SelectItem>
                  <SelectItem value="accountName">Account Name</SelectItem>
                  <SelectItem value="bankName">Bank Name</SelectItem>
                  <SelectItem value="ifsc">IFSC</SelectItem>
                  <SelectItem value="createdAt">Created At</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setBankOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}>
                {bankOrder === 'asc' ? 'Asc' : 'Desc'}
              </Button>
              <Button variant={bankMissingOnly ? 'default' : 'outline'} size="sm" onClick={() => { setBankListPage(1); setBankMissingOnly((v) => !v); }}>
                {bankMissingOnly ? 'Showing Missing' : 'Missing Only'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const resp = await api.get('/admin/users/bank-details/export', {
                      params: {
                        search: bankSearch || undefined,
                        sort: bankSort,
                        order: bankOrder,
                        missing: bankMissingOnly || undefined,
                        format: 'csv'
                      },
                      responseType: 'blob'
                    });
                    const blob = new Blob([resp as any], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `bank-details-${Date.now()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (e: any) {
                    toast.error(e?.message || 'Failed to export CSV');
                  }
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>IFSC</TableHead>
                <TableHead>UPI</TableHead>
                <TableHead>Last 4</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankListLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : bankList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">No records found</TableCell>
                </TableRow>
              ) : (
                bankList.map((u: any) => (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.bankDetails?.bankAccountName || '—'}</TableCell>
                    <TableCell>{u.bankDetails?.bankName || '—'}</TableCell>
                    <TableCell>{u.bankDetails?.ifsc || '—'}</TableCell>
                    <TableCell>{u.bankDetails?.upiId || '—'}</TableCell>
                    <TableCell>{u.bankDetails?.bankAccountNumberLast4 || '—'}</TableCell>
                    <TableCell>{u.bankDetails?.verified ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{u.bankDetails?.lastUpdatedAt ? format(new Date(u.bankDetails.lastUpdatedAt), 'PPpp') : '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {bankListPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankListPage((p) => Math.max(1, p - 1))}
                disabled={bankListPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">Page {bankListPage} of {bankListPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBankListPage((p) => Math.min(bankListPages, p + 1))}
                disabled={bankListPage === bankListPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDashboard;

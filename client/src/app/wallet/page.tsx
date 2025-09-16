'use client';

import { Suspense } from 'react';
import { WalletDashboard } from '@/components/Wallet/WalletDashboard';
import { WalletDashboardSkeleton } from '@/components/Wallet/WalletDashboardSkeleton';

export default function WalletPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Suspense fallback={<WalletDashboardSkeleton />}>
        <WalletDashboard />
      </Suspense>
    </div>
  );
}

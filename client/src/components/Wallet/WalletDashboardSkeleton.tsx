import React from 'react';

export const WalletDashboardSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-6 w-6 bg-muted rounded-full animate-pulse"></div>
            </div>
            <div className="mt-4">
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
              <div className="mt-2 h-4 w-48 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions Skeleton */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="h-6 w-48 bg-muted rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                <div className="h-6 w-20 bg-muted rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboardSkeleton;

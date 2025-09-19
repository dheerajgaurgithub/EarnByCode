import React from 'react';

export const WalletDashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="p-6 bg-white rounded-2xl shadow-xl border border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-10 w-64 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse shadow-sm"></div>
              <div className="h-5 w-96 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-28 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse shadow-sm"></div>
              <div className="h-11 w-32 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse shadow-sm"></div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-blue-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Balance Card - Blue Gradient */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-white/30 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-36 bg-white/40 rounded-xl animate-pulse"></div>
              <div className="h-3 w-24 bg-white/20 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Deposits Card - Emerald Gradient */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-white/30 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-32 bg-white/40 rounded-xl animate-pulse"></div>
              <div className="h-3 w-32 bg-white/20 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Withdrawals Card - Rose Gradient */}
          <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-32 bg-white/30 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-28 bg-white/40 rounded-xl animate-pulse"></div>
              <div className="h-3 w-36 bg-white/20 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Activity Card - Indigo Gradient */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-28 bg-white/30 rounded-lg animate-pulse"></div>
              <div className="h-10 w-10 bg-white/20 rounded-lg animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-8 bg-white/40 rounded-xl animate-pulse"></div>
              <div className="h-3 w-40 bg-white/20 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Skeleton */}
        <div className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-6">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300 rounded-lg animate-pulse"></div>
              <div className="h-4 w-64 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-md animate-pulse"></div>
            </div>
          </div>
          
          {/* Table Content */}
          <div className="p-0">
            {/* Table Header */}
            <div className="bg-blue-50/50 border-b border-blue-100 p-4">
              <div className="grid grid-cols-5 gap-4">
                <div className="h-4 w-16 bg-blue-200 rounded animate-pulse"></div>
                <div className="h-4 w-12 bg-blue-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-blue-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-blue-200 rounded animate-pulse ml-auto"></div>
                <div className="h-4 w-16 bg-blue-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y divide-blue-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 hover:bg-blue-50/30 transition-colors duration-200">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    {/* Date */}
                    <div className="h-4 w-20 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded animate-pulse"></div>
                    
                    {/* Type */}
                    <div className="h-4 w-16 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded animate-pulse"></div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded animate-pulse"></div>
                    </div>
                    
                    {/* Amount */}
                    <div className="ml-auto">
                      <div className="h-5 w-20 bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 rounded-lg animate-pulse"></div>
                    </div>
                    
                    {/* Status */}
                    <div className="h-6 w-20 bg-gradient-to-r from-green-200 via-green-100 to-green-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-6 text-center border-t border-blue-100 bg-blue-50/20">
              <div className="h-10 w-48 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-200 rounded-xl animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Additional Card Skeleton for Forms */}
        <div className="bg-white border border-blue-100 shadow-xl rounded-2xl overflow-hidden max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-blue-100 p-6">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-300 rounded-lg animate-pulse"></div>
              <div className="h-4 w-48 bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 rounded-md animate-pulse"></div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="h-5 w-24 bg-blue-200 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-xl animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-32 bg-blue-200 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100 rounded-xl animate-pulse"></div>
            </div>
            <div className="h-12 w-full bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDashboardSkeleton;
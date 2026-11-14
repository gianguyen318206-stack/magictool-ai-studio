import React, { Suspense } from 'react';
import { Sidebar } from '@/components/app-shell/sidebar';
import { Topbar } from '@/components/app-shell/topbar';
import { SupportMagicWidget } from '@/components/support-magic/support-magic-widget';

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F5FB] text-[#181D30] relative overflow-x-hidden">
      {/* Subtle Top Pastel Aura matching reference UI */}
      <div className="absolute top-[-120px] left-[280px] w-[520px] h-[260px] rounded-full bg-purple-400/15 blur-[100px] pointer-events-none" />
      <div className="absolute top-[-80px] right-[10%] w-[420px] h-[220px] rounded-full bg-indigo-400/15 blur-[90px] pointer-events-none" />

      <Suspense fallback={<div className="w-[248px] h-screen bg-[#15193B]" />}>
        <Sidebar />
      </Suspense>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Suspense fallback={<div className="h-20" />}>
          <Topbar />
        </Suspense>
        <main className="flex-1 px-8 pb-10 max-w-[1440px] w-full mx-auto">
          <Suspense fallback={<div className="text-xs text-slate-500 py-6">Đang tải...</div>}>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Floating Support Magic Assistant */}
      <SupportMagicWidget />
    </div>
  );
}

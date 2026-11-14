'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSettings } from '@/components/shared/theme-provider';
import {
  Home,
  Image as ImageIcon,
  Video,
  Wand2,
  Layers,
  FolderOpen,
  Settings,
  Crown,
  Check,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { href: '/app', label: 'Tổng quan', icon: Home },
  { href: '/app/image', label: 'Image Studio', icon: ImageIcon },
  { href: '/app/video', label: 'Video Studio', icon: Video },
  { href: '/app/support-magic', label: 'Support Magic', icon: Wand2, badge: 'AI' },
  { href: '/app/creations', label: 'Bộ sưu tập', icon: Layers },
  { href: '/app/projects', label: 'Dự án', icon: FolderOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { displayName } = useAppSettings();
  const [aiToolsOpen, setAiToolsOpen] = useState(true);

  return (
    <aside className="w-[248px] flex-shrink-0 h-screen sticky top-0 flex flex-col justify-between bg-gradient-to-b from-[#15193B] via-[#121633] to-[#0E1128] text-white select-none z-30 shadow-2xl">
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6366F1] via-[#8B5CF6] to-[#EC4899] flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
            <span className="font-black text-lg tracking-tighter text-white">M</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[16px] tracking-tight text-white">
              MagicTool AI
            </span>
            <span className="text-[11px] text-[#9BA3C7] font-medium">
              Creative Studio V1.0
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3.5 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/app' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B46F5] text-white shadow-lg shadow-purple-600/35 border border-purple-400/30'
                    : 'text-[#B4BCE0] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8F98C2]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/10" />

          {/* Collapsible AI Tools Header */}
          <button
            type="button"
            onClick={() => setAiToolsOpen(!aiToolsOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-[12px] font-semibold text-[#9BA3C7] hover:text-white transition"
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-3.5 h-3.5 text-[#8F98C2]" />
              <span>Công cụ AI & Hệ thống</span>
            </div>
            {aiToolsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {aiToolsOpen && (
            <div className="space-y-1 pl-2">
              <Link
                href="/app/settings"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] transition ${
                  pathname.startsWith('/app/settings')
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#9BA3C7] hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Cài đặt & 9Router</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Pro / 1B Token Card & User Profile */}
      <div className="px-3.5 pb-4 space-y-3">
        {/* Glowing Pro / 1B Token Card */}
        <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-b from-[#33277A] via-[#281F63] to-[#1D164B] border border-purple-400/30 shadow-xl">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />

          <div className="flex flex-col items-center text-center mb-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-400 flex items-center justify-center shadow-md shadow-cyan-400/30 mb-1.5">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-[13px] text-white">Muse AI + 9Router</h4>
          </div>

          <ul className="space-y-1.5 text-[11px] text-[#D5DAFA] mb-3">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
              <span>Quỹ 1.000.000.000 Token</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
              <span>Chất lượng cao (4K AI)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-cyan-300 flex-shrink-0" />
              <span>Support Magic (4 Argon)</span>
            </li>
          </ul>

          <Link
            href="/app/support-magic"
            className="w-full py-2 rounded-xl bg-white hover:bg-gray-100 text-[#2E1F7A] font-bold text-[11px] flex items-center justify-center gap-1.5 shadow transition"
          >
            <span>Mở Support Magic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* User Footer Card */}
        <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#6366F1] flex items-center justify-center text-xs font-bold text-white shadow flex-shrink-0">
              {displayName ? displayName.charAt(0).toUpperCase() : 'N'}
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">
                {displayName || 'Nhà Sáng Tạo'}
              </div>
              <div className="text-[10px] text-purple-300 font-medium">
                Gói 1 Tỷ Token
              </div>
            </div>
          </div>
          <Link
            href="/app/settings"
            className="p-1.5 rounded-lg text-[#9BA3C7] hover:text-white hover:bg-white/10 transition"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

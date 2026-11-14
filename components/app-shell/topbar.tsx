'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSettings } from '@/components/shared/theme-provider';
import {
  BookOpen,
  Bell,
  ChevronDown,
  Sparkles,
  Image as ImageIcon,
  Video,
  Wand2,
  X,
  CheckCircle2,
} from 'lucide-react';

const PAGE_HEADERS: Record<
  string,
  { badgeTitle: string; highlightTitle: string; subtitle: string }
> = {
  '/app': {
    badgeTitle: 'AI-Powered',
    highlightTitle: 'Creative Studio Hub',
    subtitle: 'Trung tâm sáng tạo Hình ảnh, Video AI và Trợ lý đạo diễn Support Magic.',
  },
  '/app/image': {
    badgeTitle: 'AI-Powered',
    highlightTitle: 'Image Studio Generator',
    subtitle: 'Tạo hình ảnh & mô hình 3D chất lượng cao từ mô tả văn bản hoặc hình ảnh.',
  },
  '/app/video': {
    badgeTitle: 'AI-Powered',
    highlightTitle: 'Video Motion Studio',
    subtitle: 'Tạo thước phim chuyển động mượt mà từ kịch bản văn bản hoặc ảnh gốc.',
  },
  '/app/support-magic': {
    badgeTitle: 'AI Copilot',
    highlightTitle: 'Support Magic Assistant',
    subtitle: 'Trợ lý đạo diễn kịch bản & tối ưu hóa câu lệnh chạy trên Gemini 4 Argon / Opus.',
  },
  '/app/creations': {
    badgeTitle: 'Studio Library',
    highlightTitle: 'Bộ Sưu Tập Sáng Tạo',
    subtitle: 'Quản lý, xem trước và tải xuống toàn bộ hình ảnh & video đã kết xuất.',
  },
  '/app/projects': {
    badgeTitle: 'Workspace',
    highlightTitle: 'Quản Lý Dự Án',
    subtitle: 'Gom nhóm và tổ chức các tác phẩm AI theo từng chiến dịch sáng tạo.',
  },
  '/app/settings': {
    badgeTitle: 'System Config',
    highlightTitle: 'Cài Đặt & Kết Nối 9Router',
    subtitle: 'Quản lý cấu hình giao diện, model Support Magic và tài khoản Muse AI 1 tỷ token.',
  },
};

export function Topbar() {
  const pathname = usePathname();
  const { displayName } = useAppSettings();
  const [showGuide, setShowGuide] = useState(false);

  const headerInfo =
    PAGE_HEADERS[pathname] ||
    (pathname.startsWith('/app/projects') ? PAGE_HEADERS['/app/projects'] : PAGE_HEADERS['/app']);

  return (
    <>
      <header className="w-full px-8 pt-6 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-20">
        {/* Left Title & Subtitle (Matches Reference Image) */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#181D30]">
              <span>{headerInfo.badgeTitle} </span>
              <span className="bg-gradient-to-r from-[#5B46F5] via-[#7C3AED] to-[#9333EA] bg-clip-text text-transparent">
                {headerInfo.highlightTitle}
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-[#64708D] mt-0.5">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right Actions Bar (Guide Button, Bell, User Pill) */}
        <div className="flex items-center gap-3 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50/70 border border-[#E2E6F4] text-[#434C68] text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6D35D5]" />
            <span>Hướng dẫn sử dụng</span>
          </button>

          <Link
            href="/app/support-magic"
            className="relative p-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-[#E2E6F4] text-[#434C68] shadow-sm transition"
            title="Thông báo & Trạng thái 9Router"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2" />
          </Link>

          <Link
            href="/app/settings"
            className="pl-2 pr-3 py-1.5 rounded-full bg-white hover:bg-indigo-50/60 border border-[#E2E6F4] flex items-center gap-2.5 shadow-sm transition"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-xs font-bold text-white">
              {displayName ? displayName.charAt(0).toUpperCase() : 'N'}
            </div>
            <span className="text-xs font-semibold text-[#181D30]">
              {displayName || 'Nhà Sáng Tạo'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#64708D]" />
          </Link>
        </div>
      </header>

      {/* Quick User Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E6F4] space-y-4 text-[#181D30]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E6F4]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6D35D5] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Hướng Dẫn Sử Dụng Nhanh</h3>
                  <p className="text-xs text-[#64708D]">Quy trình 3 bước kết hợp Support Magic & Muse AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-[#64708D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-[#434C68]">
              <div className="p-3.5 rounded-2xl bg-[#F5F7FF] border border-[#E2E6F4] flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-[#6D35D5] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#181D30]">Bước 1: Nhờ Support Magic viết Prompt</div>
                  <p className="mt-0.5">
                    Nhập ý tưởng tiếng Việt ngắn gọn vào ô Prompt rồi nhấn nút{' '}
                    <strong>“🪄 Support Magic viết giúp”</strong> (hoặc mở tab <strong>Support Magic</strong>) để{' '}
                    <strong>Gemini 4 Argon</strong> tự động viết câu lệnh điện ảnh chi tiết.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F7FF] border border-[#E2E6F4] flex items-start gap-3">
                <ImageIcon className="w-5 h-5 text-[#4F46E5] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#181D30]">Bước 2: Chọn Tỉ lệ & Phong cách</div>
                  <p className="mt-0.5">
                    Chọn tỉ lệ khung hình (<code>1:1</code>, <code>16:9</code> YouTube, <code>9:16</code> TikTok) và thẻ
                    Phong cách (Chân thực, Hoạt hình, Tối giản, Game 3D, Khoa học).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F7FF] border border-[#E2E6F4] flex items-start gap-3">
                <Video className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#181D30]">Bước 3: Kết xuất bằng Muse AI (1 Tỷ Token)</div>
                  <p className="mt-0.5">
                    Nhấn nút <strong>“Tạo ngay”</strong>. Yêu cầu sẽ đi qua <code>9Router</code> tới tài khoản{' '}
                    <strong>Muse AI</strong> của bạn và tự động lưu file về thư mục <code>D:\Tool tạo video\outputs</code>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã kết nối 9Router (localhost:20128) & Muse Web
              </span>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white text-xs font-bold shadow"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

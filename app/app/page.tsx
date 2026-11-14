'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  MessageSquare,
  FolderKanban,
  ArrowRight,
  Crown,
  CheckCircle2,
  Play,
  Layers,
  Zap,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import { Creation, Project } from '@/types';
import { DEMO_SAMPLE_IMAGES } from '@/lib/constants';

export default function AppHomePage() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [routerStatus, setRouterStatus] = useState<{
    online: boolean;
    museConnected: boolean;
  }>({ online: true, museConnected: true });

  useEffect(() => {
    async function load() {
      await syncCloudToLocal();
      const [allCreations, allProjects] = await Promise.all([
        db.creations.orderBy('createdAt').reverse().toArray(),
        db.projects.orderBy('updatedAt').reverse().toArray(),
      ]);
      setCreations(allCreations);
      setProjects(allProjects);
    }
    load();

    fetch('/api/router/status')
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setRouterStatus({
            online: Boolean(d.online),
            museConnected: Boolean(d.museConnected),
          });
        }
      })
      .catch(() => {});
  }, []);

  const imageCount = creations.filter((c) => c.kind === 'image').length;
  const videoCount = creations.filter((c) => c.kind === 'video').length;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {/* Studio Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#15193B] via-[#232058] to-[#3B2685] p-8 text-white shadow-[0_14px_40px_rgba(21,25,59,0.16)] border border-indigo-400/20">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-indigo-200">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {routerStatus.museConnected
                  ? 'Đã kết nối Muse AI (Quỹ 1.000.000.000 Token miễn phí qua 9Router)'
                  : 'Hệ thống 9Router AI Studio Sẵn Sàng'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Không gian sáng tạo Hình ảnh & Video AI chuyên nghiệp
            </h2>
            <p className="text-sm text-indigo-100/85 leading-relaxed">
              Biến ý tưởng tiếng Việt của bạn thành hình ảnh sắc nét và thước phim điện ảnh MP4 chỉ
              sau 3 bước. Tích hợp trợ lý <strong className="text-white">Support Magic</strong> tự
              động viết câu lệnh chuẩn studio.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/app/image"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6C47FF] to-[#9333EA] hover:from-[#5B36F5] hover:to-[#7E22CE] text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Tạo Hình Ảnh Ngay</span>
              </Link>
              <Link
                href="/app/video"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              >
                <Video className="w-4 h-4 text-cyan-300" />
                <span>Tạo Video chuyển động</span>
              </Link>
              <Link
                href="/app/support-magic"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-indigo-100 text-xs font-semibold transition-all"
              >
                <MessageSquare className="w-4 h-4 text-amber-300" />
                <span>Chat với Support Magic</span>
              </Link>
            </div>
          </div>

          {/* Right Mini Studio Badge */}
          <div className="hidden lg:flex items-center gap-4 bg-[#0B1026]/80 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <img
              src={DEMO_SAMPLE_IMAGES[0].url}
              alt="Studio Preview"
              className="w-24 h-24 rounded-xl object-cover border border-indigo-400/30"
            />
            <div className="space-y-1.5 pr-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Muse AI Active
              </span>
              <div className="text-sm font-bold text-white">Chuẩn kết xuất Ảnh & Video HD</div>
              <div className="text-xs text-indigo-200/80">
                Lưu tự động vào <code className="text-cyan-300">D:\Tool tạo video\outputs</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quick Studio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/app/image"
          className="group bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#6C47FF] bg-[#F5F2FF] px-2.5 py-1 rounded-full">
              {imageCount} đã tạo
            </span>
          </div>
          <h3 className="text-base font-bold text-[#181D30] group-hover:text-[#6C47FF] transition-colors">
            Tạo Hình Ảnh AI
          </h3>
          <p className="text-xs text-[#646B89] mt-1">
            5 tỷ lệ khung hình, 5 phong cách Chân thực / Hoạt hình / Khoa học sắc nét.
          </p>
        </Link>

        <Link
          href="/app/video"
          className="group bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full">
              {videoCount} video
            </span>
          </div>
          <h3 className="text-base font-bold text-[#181D30] group-hover:text-[#6C47FF] transition-colors">
            Tạo Video Điện Ảnh
          </h3>
          <p className="text-xs text-[#646B89] mt-1">
            Tạo video từ văn bản hoặc biến ảnh tĩnh thành chuyển động mượt mà với Muse Video.
          </p>
        </Link>

        <Link
          href="/app/support-magic"
          className="group bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              Chatbot AI
            </span>
          </div>
          <h3 className="text-base font-bold text-[#181D30] group-hover:text-[#6C47FF] transition-colors">
            Trợ Lý Support Magic
          </h3>
          <p className="text-xs text-[#646B89] mt-1">
            Lên ý tưởng kịch bản, viết câu lệnh Prompt siêu chi tiết và nạp thẳng sang Studio.
          </p>
        </Link>

        <Link
          href="/app/projects"
          className="group bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {projects.length} dự án
            </span>
          </div>
          <h3 className="text-base font-bold text-[#181D30] group-hover:text-[#6C47FF] transition-colors">
            Quản Lý Dự Án & Kho Lưu Trữ
          </h3>
          <p className="text-xs text-[#646B89] mt-1">
            Tổ chức các bộ sưu tập hình ảnh, phân cảnh storyboard và tải về máy nhanh chóng.
          </p>
        </Link>
      </div>

      {/* Recent Creations / Studio Showcase */}
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-[#181D30] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#6C47FF]" />
              <span>Tác phẩm gần đây & Mẫu Studio nổi bật</span>
            </h3>
            <p className="text-xs text-[#646B89] mt-0.5">
              Nhấn vào bất kỳ mẫu nào để mở ngay trong phòng dựng 360°
            </p>
          </div>
          <Link
            href="/app/creations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C47FF] hover:underline"
          >
            <span>Xem toàn bộ kho lưu trữ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(creations.length > 0
            ? creations.slice(0, 5).map((c) => ({
                id: c.id,
                title: c.title,
                url: c.assetUrl || DEMO_SAMPLE_IMAGES[0].url,
                kind: c.kind,
                ratio: c.settings?.ratio || '1:1',
                isReal: !c.isDemo,
              }))
            : DEMO_SAMPLE_IMAGES.map((s, idx) => ({
                id: `demo-${idx}`,
                title: s.title,
                url: s.url,
                kind: 'image' as const,
                ratio: '1:1',
                isReal: false,
              }))
          ).map((item) => (
            <Link
              key={item.id}
              href={item.kind === 'video' ? '/app/video' : '/app/image'}
              className="group relative rounded-2xl overflow-hidden border border-[#E2E6F4] bg-[#0B1026] aspect-square flex flex-col justify-end shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all"
            >
              {item.url.endsWith('.mp4') || item.url.startsWith('data:video/') ? (
                <video
                  src={item.url}
                  muted
                  loop
                  autoPlay
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <img
                  src={item.url}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1026]/90 via-[#0B1026]/20 to-transparent" />
              <div className="relative z-10 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#6C47FF] text-white">
                    {item.kind === 'video' ? 'VIDEO' : '3D / ẢNH'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white">
                    {item.ratio}
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate">{item.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

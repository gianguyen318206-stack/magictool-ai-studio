'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Image as ImageIcon,
  Video,
  Download,
  Trash2,
  Sparkles,
  Copy,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import { Creation } from '@/types';
import { DEMO_SAMPLE_IMAGES } from '@/lib/constants';

export default function CreationsPage() {
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [filterKind, setFilterKind] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    loadCreations();
  }, []);

  async function loadCreations() {
    await syncCloudToLocal();
    const items = await db.creations.orderBy('createdAt').reverse().toArray();
    setCreations(items);
  }

  async function handleDelete(id: string) {
    await db.creations.delete(id);
    await loadCreations();
    showToast('Đã xóa tác phẩm khỏi kho lưu trữ.');
  }

  function handleSendToVideo(c: Creation) {
    sessionStorage.setItem(
      'magictool_reference_image',
      JSON.stringify({
        url: c.assetUrl || DEMO_SAMPLE_IMAGES[0].url,
        prompt: c.prompt,
        title: c.title,
      })
    );
    router.push('/app/video');
  }

  function handleDownload(c: Creation) {
    if (!c.assetUrl) return;
    const a = document.createElement('a');
    a.href = c.assetUrl;
    a.download = `magictool-${c.kind}-${c.id.slice(0, 6)}.${c.kind === 'video' ? 'mp4' : 'png'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const filtered = creations.filter((c) => {
    if (filterKind !== 'all' && c.kind !== filterKind) return false;
    if (
      searchQuery.trim() &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#15193B] text-white text-sm font-medium shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterKind('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filterKind === 'all'
                ? 'bg-[#6C47FF] text-white shadow-sm'
                : 'bg-[#F3F5FB] text-[#5E6582] hover:text-[#181D30]'
            }`}
          >
            Tất cả ({creations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('image')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filterKind === 'image'
                ? 'bg-[#6C47FF] text-white shadow-sm'
                : 'bg-[#F3F5FB] text-[#5E6582] hover:text-[#181D30]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Mô hình & Ảnh</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterKind('video')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              filterKind === 'video'
                ? 'bg-[#6C47FF] text-white shadow-sm'
                : 'bg-[#F3F5FB] text-[#5E6582] hover:text-[#181D30]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video AI</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8E95B2] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm tác phẩm theo câu lệnh..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-[#DCE1F4] bg-[#FAFBFD] text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
          />
        </div>
      </div>

      {/* Grid of Creations */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E6F4] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#181D30]">
            Chưa có tác phẩm nào trong danh mục này
          </h3>
          <p className="text-xs text-[#646B89] max-w-md mx-auto">
            Hãy bắt đầu tạo mô hình 3D, hình ảnh hoặc thước phim đầu tiên của bạn với quỹ 1 tỷ Token
            Muse AI.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/app/image')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6C47FF] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo Ảnh ngay</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/app/video')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-[#DCE1F4] bg-white text-[#181D30] text-xs font-bold cursor-pointer"
            >
              <Video className="w-4 h-4 text-[#6C47FF]" />
              <span>Tạo Video AI</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((item) => {
            const url = item.assetUrl || DEMO_SAMPLE_IMAGES[0].url;
            const isVideoFile =
              url.endsWith('.mp4') ||
              url.endsWith('.webm') ||
              url.startsWith('data:video/');

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E2E6F4] overflow-hidden shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-[#0B1026] overflow-hidden">
                    {isVideoFile ? (
                      <video
                        src={url}
                        controls
                        muted
                        loop
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#6C47FF] text-white shadow">
                        {item.kind === 'video' ? 'VIDEO AI' : '3D / ẢNH'}
                      </span>
                      {!item.isDemo && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow">
                          Muse AI
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <h4 className="text-sm font-bold text-[#181D30] truncate">{item.title}</h4>
                    <p className="text-xs text-[#646B89] line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 border-t border-[#EEF1F9] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="p-2 rounded-xl bg-[#F5F2FF] hover:bg-[#E7E0FF] text-[#6C47FF] transition-colors cursor-pointer"
                      title="Tải xuống"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(item.prompt);
                        showToast('Đã sao chép Prompt!');
                      }}
                      className="p-2 rounded-xl bg-[#F3F5FB] hover:bg-[#E2E6F4] text-[#5E6582] transition-colors cursor-pointer"
                      title="Sao chép Prompt"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {item.kind === 'image' && (
                      <button
                        type="button"
                        onClick={() => handleSendToVideo(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#F5F2FF] hover:bg-[#E7E0FF] text-[11px] font-bold text-[#6C47FF] transition-colors cursor-pointer"
                      >
                        Tạo Video
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl hover:bg-rose-50 text-[#8E95B2] hover:text-rose-600 transition-colors cursor-pointer"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

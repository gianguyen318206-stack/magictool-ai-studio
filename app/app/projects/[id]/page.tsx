'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FolderKanban,
  Sparkles,
  Video,
  Download,
  Trash2,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import { Project, Creation } from '@/types';
import { DEMO_SAMPLE_IMAGES } from '@/lib/constants';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  async function loadProject() {
    await syncCloudToLocal();
    const p = await db.projects.get(projectId);
    setProject(p || null);
    const items = await db.creations.where('projectId').equals(projectId).reverse().sortBy('createdAt');
    setCreations(items);
  }

  async function handleRemoveItem(id: string) {
    await db.creations.delete(id);
    await loadProject();
  }

  if (!project) {
    return (
      <div className="max-w-[1440px] mx-auto bg-white rounded-3xl border border-[#E2E6F4] p-10 text-center space-y-4">
        <p className="text-sm font-bold text-[#181D30]">Không tìm thấy dự án này.</p>
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6C47FF] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách dự án</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/app/projects')}
            className="p-2.5 rounded-2xl border border-[#E2E6F4] bg-[#FAFBFD] hover:bg-[#F3F5FB] text-[#5E6582] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-[#181D30]">{project.name}</h2>
            <p className="text-xs text-[#646B89]">
              {project.description || 'Dự án sáng tạo'} • {creations.length} tác phẩm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/app/image"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#6C47FF] text-white text-xs font-bold shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tạo Ảnh mới</span>
          </Link>
          <Link
            href="/app/video"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#DCE1F4] bg-white text-[#181D30] text-xs font-bold"
          >
            <Video className="w-3.5 h-3.5 text-[#6C47FF]" />
            <span>Tạo Video</span>
          </Link>
        </div>
      </div>

      {creations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E6F4] p-12 text-center space-y-2">
          <p className="text-sm font-bold text-[#181D30]">Dự án này chưa có tác phẩm nào</p>
          <p className="text-xs text-[#646B89]">
            Khi tạo ảnh hoặc video, hãy chọn lưu vào dự án <strong>{project.name}</strong> ở mục Cài
            đặt nâng cao.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {creations.map((c) => {
            const url = c.assetUrl || DEMO_SAMPLE_IMAGES[0].url;
            const isVid = url.endsWith('.mp4') || url.startsWith('data:video/');
            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-[#E2E6F4] overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-[#0B1026] relative">
                    {isVid ? (
                      <video src={url} controls muted loop className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt={c.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-[#181D30] truncate">{c.title}</h4>
                    <p className="text-xs text-[#646B89] line-clamp-2 mt-1">{c.prompt}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-[#EEF1F9] flex items-center justify-between">
                  <a
                    href={url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C47FF]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải về</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(c.id)}
                    className="p-1.5 rounded-lg text-[#8E95B2] hover:text-rose-600 cursor-pointer"
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

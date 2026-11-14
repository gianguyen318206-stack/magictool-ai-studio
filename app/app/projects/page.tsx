'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderPlus,
  FolderKanban,
  Trash2,
  ArrowRight,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import { Project, Creation } from '@/types';
import { generateUUID } from '@/lib/utils';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await syncCloudToLocal();
    const [p, c] = await Promise.all([
      db.projects.orderBy('updatedAt').reverse().toArray(),
      db.creations.toArray(),
    ]);
    setProjects(p);
    setCreations(c);
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    await db.projects.add({
      id: generateUUID(),
      name: newName.trim(),
      description: newDesc.trim() || 'Dự án sáng tạo hình ảnh 3D & Video AI',
      createdAt: now,
      updatedAt: now,
    });
    setNewName('');
    setNewDesc('');
    await loadData();
    showToast('Đã tạo dự án mới thành công!');
  }

  async function handleDeleteProject(id: string) {
    await db.projects.delete(id);
    await loadData();
    showToast('Đã xóa dự án.');
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#15193B] text-white text-sm font-medium shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Create Project Card */}
      <form
        onSubmit={handleCreateProject}
        className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-end gap-4"
      >
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#181D30] mb-1.5">
            Tên dự án mới
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="VD: Chiến dịch Quảng cáo 3D Vũ Trụ 2026..."
            className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE1F4] bg-[#FAFBFD] text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#181D30] mb-1.5">
            Mô tả ngắn (Tùy chọn)
          </label>
          <input
            type="text"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Ghi chú mục tiêu, phong cách thiết kế..."
            className="w-full px-4 py-2.5 rounded-2xl border border-[#DCE1F4] bg-[#FAFBFD] text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
          />
        </div>
        <button
          type="submit"
          disabled={!newName.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Tạo dự án mới</span>
        </button>
      </form>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2E6F4] p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#181D30]">Chưa có dự án nào</h3>
          <p className="text-xs text-[#646B89] max-w-md mx-auto">
            Hãy tạo một dự án ở khung phía trên để nhóm các hình ảnh 3D và video AI theo từng chủ
            đề.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const count = creations.filter((c) => c.projectId === p.id).length;
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm hover:border-[#6C47FF] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(p.id)}
                      className="p-2 rounded-xl text-[#8E95B2] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa dự án"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-[#181D30]">{p.name}</h4>
                    <p className="text-xs text-[#646B89] mt-1 line-clamp-2">
                      {p.description || 'Không có mô tả'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-5 border-t border-[#EEF1F9] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#646B89]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#6C47FF]">
                      <Layers className="w-3.5 h-3.5" />
                      {count} tác phẩm
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <Link
                    href={`/app/projects/${p.id}`}
                    className="inline-flex items-center gap-1 font-bold text-[#6C47FF] hover:underline"
                  >
                    <span>Mở dự án</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

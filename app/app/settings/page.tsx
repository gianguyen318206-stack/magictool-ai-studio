'use client';

import React, { useEffect, useState } from 'react';
import {
  Crown,
  Server,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Download,
  Bot,
  HardDrive,
} from 'lucide-react';
import { db } from '@/lib/db';
import { SUPPORT_MAGIC_MODELS } from '@/lib/constants';
import { useTheme } from '@/components/shared/theme-provider';

export default function SettingsPage() {
  const { supportMagicModel, setSupportMagicModel } = useTheme();
  const [routerInfo, setRouterInfo] = useState<{
    online: boolean;
    museConnected: boolean;
    routerUrl: string;
    connectionName?: string;
  }>({
    online: true,
    museConnected: true,
    routerUrl: 'http://localhost:20128',
    connectionName: 'Muse Web (1.000.000.000 Token)',
  });
  const [checking, setChecking] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setChecking(true);
    try {
      const res = await fetch('/api/router/status');
      const data = await res.json();
      setRouterInfo({
        online: Boolean(data.online),
        museConnected: Boolean(data.museConnected),
        routerUrl: data.routerUrl || 'http://localhost:20128',
        connectionName: data.museAccount || 'Muse AI (Quỹ 1 Tỷ Token)',
      });
    } catch {
      // keep default
    } finally {
      setChecking(false);
    }
  }

  async function handleExportBackup() {
    const [projects, creations] = await Promise.all([
      db.projects.toArray(),
      db.creations.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), projects, creations }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `magictool-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất bản sao lưu dữ liệu thành công!');
  }

  async function handleClearAll() {
    await Promise.all([db.creations.clear(), db.jobs.clear()]);
    showToast('Đã làm sạch lịch sử tạm trong trình duyệt.');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#15193B] text-white text-sm font-medium shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Muse AI 1B Token + 9Router Connection Card */}
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C47FF] to-[#9333EA] text-white flex items-center justify-center shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181D30]">
                Kết nối Tài khoản Muse AI (1.000.000.000 Token) & 9Router
              </h2>
              <p className="text-xs text-[#646B89]">
                Tất cả yêu cầu tạo Ảnh, Video và Chatbot Support Magic được định tuyến qua cổng cục
                bộ.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={checkStatus}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-[#DCE1F4] bg-[#FAFBFD] hover:bg-[#F3F5FB] text-xs font-bold text-[#181D30] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-[#6C47FF]' : ''}`} />
            <span>Kiểm tra kết nối</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F4]">
            <div className="flex items-center gap-2 text-xs text-[#646B89] mb-1">
              <Server className="w-3.5 h-3.5 text-[#6C47FF]" />
              <span>Cổng 9Router Local</span>
            </div>
            <div className="text-sm font-extrabold text-[#181D30]">{routerInfo.routerUrl}</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">
              {routerInfo.online ? '● Đang hoạt động (Online)' : '○ Đang chờ phản hồi'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F4]">
            <div className="flex items-center gap-2 text-xs text-[#646B89] mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Phiên Web Muse AI</span>
            </div>
            <div className="text-sm font-extrabold text-[#181D30]">muse-web (Active)</div>
            <div className="text-[11px] font-semibold text-[#6C47FF] mt-1">
              Còn 1.000.000.000 Token (Không hết hạn)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F4]">
            <div className="flex items-center gap-2 text-xs text-[#646B89] mb-1">
              <HardDrive className="w-3.5 h-3.5 text-cyan-600" />
              <span>Thư mục xuất file tự động</span>
            </div>
            <div className="text-xs font-mono font-bold text-[#181D30] truncate">
              D:\Tool tạo video\outputs
            </div>
            <div className="text-[11px] text-[#646B89] mt-1">Lưu trực tiếp file .png & .mp4</div>
          </div>
        </div>
      </div>

      {/* Support Magic Default Model Card */}
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#181D30]">
              Mô hình AI mặc định cho Trợ lý Support Magic
            </h3>
            <p className="text-xs text-[#646B89]">
              Chọn mô hình ngôn ngữ dùng để tư vấn kịch bản và viết giúp câu lệnh Prompt.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUPPORT_MAGIC_MODELS.map((m) => {
            const active = supportMagicModel === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSupportMagicModel(m.id);
                  showToast(`Đã chọn mô hình: ${m.name}`);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  active
                    ? 'border-[#6C47FF] bg-[#F5F2FF] shadow-sm'
                    : 'border-[#E2E6F4] bg-[#FAFBFD] hover:bg-white'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-[#181D30]">{m.name}</div>
                  <div className="text-[11px] text-[#646B89] font-mono mt-0.5">{m.id}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#6C47FF] text-white">
                  {m.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backup & Storage Management */}
      <div className="bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#181D30]">Sao lưu & Quản lý dữ liệu</h3>
          <p className="text-xs text-[#646B89] mt-0.5">
            Xuất danh sách dự án & câu lệnh ra tệp JSON hoặc dọn dẹp bộ nhớ đệm.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#6C47FF] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất bản sao lưu (.json)</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Làm mới bộ nhớ tạm</span>
          </button>
        </div>
      </div>
    </div>
  );
}

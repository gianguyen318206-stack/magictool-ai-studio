'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSettings } from '@/components/shared/theme-provider';
import { SUPPORT_MAGIC_MODELS } from '@/lib/constants';
import {
  Wand2,
  Send,
  Sparkles,
  Image as ImageIcon,
  Video,
  Copy,
  Check,
  Loader2,
  Film,
  Camera,
  Cpu,
  Trash2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
}

const PROMPT_TEMPLATES = [
  {
    title: 'Phi hành gia 3D Studio (Chuẩn mẫu)',
    category: 'Mô hình 3D / Ảnh',
    prompt:
      'Hãy viết cho tôi một câu lệnh Prompt thật chi tiết để tạo bức ảnh: Một nhà du hành vũ trụ mặc bộ đồ không gian hiện đại, chi tiết chân thực, phong cách 3D cao cấp, đứng trên bệ phát sáng tròn 360 độ, ánh sáng điện ảnh.',
  },
  {
    title: 'Kịch bản Video Điện Ảnh Hollywood',
    category: 'Video AI',
    prompt:
      'Hãy viết kịch bản Prompt tạo video 5 giây: Cảnh quay Dolly Zoom vào một chiến binh tương lai đứng giữa thành phố Cyberpunk dưới cơn mưa neon, hiệu ứng phản chiếu mặt nước 8K.',
  },
  {
    title: 'Phân cảnh Storyboard 3 Cảnh TikTok',
    category: 'Storyboard',
    prompt:
      'Hãy lên kịch bản 3 phân cảnh liên tiếp (Cảnh 1, Cảnh 2, Cảnh 3) chủ đề khám phá đại dương phát sáng kỳ ảo, kèm cả [PROMPT_ANH] và [PROMPT_VIDEO] cho từng cảnh.',
  },
  {
    title: 'Tối ưu Góc Máy & Ánh Sáng',
    category: 'Đạo diễn AI',
    prompt:
      'Gợi ý cho tôi 5 công thức kết hợp Góc máy (Camera Angle) và Ánh sáng (Lighting) để tạo video bằng Muse AI trông chân thực như phim chiếu rạp.',
  },
];

export default function SupportMagicPage() {
  const router = useRouter();
  const { supportMagicModel, setSupportMagicModel } = useAppSettings();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content:
        'Chào mừng bạn đến với phòng đạo diễn **Support Magic** 🪄!\n\nMình đang được kết nối trực tiếp với **9Router** (chạy các model khủng như **Gemini 4 Argon, Claude Opus 5.5, Muse Spark 1.3**).\n\nBạn chỉ cần nói ý tưởng bằng tiếng Việt, mình sẽ thiết kế **Prompt tạo Ảnh** và **Prompt tạo Video** chuẩn điện ảnh để bạn đẩy sang **Muse AI (1 Tỷ Token)** chỉ với 1 cú nhấp chuột!',
      modelUsed: supportMagicModel,
    },
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const content = (textOverride ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!textOverride) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/support-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          model: supportMagicModel,
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data?.reply || 'Đã xử lý xong!',
          modelUsed: data?.modelUsed || supportMagicModel,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Không thể kết nối tới 9Router lúc này. Hãy kiểm tra cổng 20128 nhé!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const extractPrompt = (text: string, type: 'image' | 'video'): string => {
    if (type === 'image') {
      const m = text.match(/\[PROMPT_ANH\]:\s*(.+)/i);
      if (m?.[1]) return m[1].trim();
    } else {
      const m = text.match(/\[PROMPT_VIDEO\]:\s*(.+)/i);
      if (m?.[1]) return m[1].trim();
    }
    return text.replace(/\*\*/g, '').trim();
  };

  const handlePushToStudio = (type: 'image' | 'video', text: string) => {
    const clean = extractPrompt(text, type);
    if (type === 'image') {
      sessionStorage.setItem('magictool_prefill_image_prompt', clean);
      router.push('/app/image');
    } else {
      sessionStorage.setItem('magictool_prefill_video_prompt', clean);
      router.push('/app/video');
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Card: Configuration & Prompt Templates (4 Cols) */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-sm space-y-6">
        {/* Model Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#181D30] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#6D35D5]" />
              <span>Model AI Đạo Diễn (9Router)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Đã kết nối
            </span>
          </label>
          <select
            value={supportMagicModel}
            onChange={(e) => setSupportMagicModel(e.target.value)}
            className="w-full p-3 rounded-2xl bg-[#F5F7FF] border border-[#DCE2F5] text-xs font-semibold text-[#181D30] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            {SUPPORT_MAGIC_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} [{m.badge}]
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#64708D]">
            Tất cả model đều gọi trực tiếp qua trạm trung chuyển <code>9Router (localhost:20128)</code> trên máy của bạn.
          </p>
        </div>

        {/* Quick Templates */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-[#181D30] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6D35D5]" />
            <span>Mẫu Câu Lệnh Nhanh (1-Click)</span>
          </div>

          <div className="space-y-2">
            {PROMPT_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(tpl.prompt)}
                className="w-full p-3.5 rounded-2xl bg-[#F8F9FE] hover:bg-purple-50/70 border border-[#E2E6F4] hover:border-purple-400 text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#181D30] group-hover:text-[#6D35D5]">
                    {tpl.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-100 text-[#6D35D5] font-semibold">
                    {tpl.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#64708D] line-clamp-2">{tpl.prompt}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F3EFFE] to-[#EEF2FF] border border-purple-200 space-y-1.5">
          <div className="text-xs font-bold text-[#4F46E5] flex items-center gap-1.5">
            <Camera className="w-4 h-4" />
            <span>Mẹo kết hợp Muse AI 1 Tỷ Token</span>
          </div>
          <p className="text-[11px] text-[#434C68] leading-relaxed">
            Sau khi <strong>Support Magic</strong> trả về câu lệnh, bạn chỉ cần nhấn nút{' '}
            <strong>“Đẩy sang Image Studio”</strong> hoặc <strong>“Đẩy sang Video Studio”</strong> ngay bên dưới tin
            nhắn để tạo sản phẩm lập tức!
          </p>
        </div>
      </div>

      {/* Right Card: Full Chatbot Arena (8 Cols) */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E6F4] shadow-sm flex flex-col h-[74vh] overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-[#E2E6F4] flex items-center justify-between bg-[#FAF9FE]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#181D30]">
                Support Magic — Trợ Lý Sáng Tạo & Prompt AI
              </h3>
              <p className="text-[11px] text-[#64708D]">
                Đang sử dụng: <strong className="text-[#6D35D5]">{supportMagicModel}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-[#64708D] hover:text-rose-600 border border-[#E2E6F4] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Làm mới đoạn chat</span>
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F6F8FC]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B46F5] text-white rounded-br-xs'
                    : 'bg-white border border-[#E2E6F4] text-[#181D30] rounded-bl-xs'
                }`}
              >
                {msg.content}

                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-3 border-t border-[#ECEFFA] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePushToStudio('image', msg.content)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6D35D5] border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Đẩy sang Image Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePushToStudio('video', msg.content)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border border-indigo-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Đẩy sang Video Studio</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#434C68] text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs font-semibold text-[#6D35D5] bg-white px-4 py-3 rounded-2xl border border-[#E2E6F4] w-fit shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Support Magic ({supportMagicModel}) đang biênạn câu lệnh...</span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 bg-white border-t border-[#E2E6F4] flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập ý tưởng của bạn (VD: Tạo cảnh phi hành gia bước đi trên sao Hỏa, góc quay điện ảnh)..."
            className="flex-1 px-4 py-3.5 rounded-2xl bg-[#F5F7FF] border border-[#DCE2F5] text-xs sm:text-sm text-[#181D30] placeholder-[#8A94B0] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#5B46F5] hover:from-[#6D28D9] hover:to-[#4338CA] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gửi lệnh</span>
          </button>
        </form>
      </div>
    </div>
  );
}

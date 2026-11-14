'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSettings } from '@/components/shared/theme-provider';
import { SUPPORT_MAGIC_MODELS } from '@/lib/constants';
import {
  Wand2,
  X,
  Send,
  Sparkles,
  Image as ImageIcon,
  Video,
  Loader2,
  Copy,
  Check,
  Maximize2,
} from 'lucide-react';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
}

export function SupportMagicWidget() {
  const router = useRouter();
  const { supportMagicModel, setSupportMagicModel } = useAppSettings();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Mình là **Support Magic** 🪄 (chạy trên **Gemini 4 Argon** qua 9Router).\n\nBạn muốn mình viết **Prompt tạo Ảnh 4K**, **Kịch bản Video điện ảnh**, hay tư vấn góc quay cho Muse AI hôm nay?',
      modelUsed: 'ag/gemini-4-argon',
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/support-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          model: supportMagicModel,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data?.reply || 'Mình đã sẵn sàng hỗ trợ bạn!',
          modelUsed: data?.modelUsed || supportMagicModel,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Có lỗi kết nối tạm thời tới 9Router. Vui lòng thử lại nhé!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const extractBestPrompt = (content: string): string => {
    const imgMatch = content.match(/\[PROMPT_ANH\]:\s*(.+)/i);
    if (imgMatch?.[1]) return imgMatch[1].trim();
    const vidMatch = content.match(/\[PROMPT_VIDEO\]:\s*(.+)/i);
    if (vidMatch?.[1]) return vidMatch[1].trim();
    return content.replace(/\*\*/g, '').trim();
  };

  const sendToStudio = (target: 'image' | 'video', content: string) => {
    const clean = extractBestPrompt(content);
    if (target === 'image') {
      sessionStorage.setItem('magictool_prefill_image_prompt', clean);
      window.dispatchEvent(new CustomEvent('magictool:apply-prompt', { detail: { kind: 'image', prompt: clean } }));
      router.push('/app/image');
    } else {
      sessionStorage.setItem('magictool_prefill_video_prompt', clean);
      window.dispatchEvent(new CustomEvent('magictool:apply-prompt', { detail: { kind: 'video', prompt: clean } }));
      router.push('/app/video');
    }
    setOpen(false);
  };

  const copyText = (id: string, content: string) => {
    navigator.clipboard.writeText(extractBestPrompt(content));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#4F46E5] hover:from-[#6D28D9] hover:to-[#4338CA] text-white font-bold text-xs shadow-2xl shadow-purple-600/40 flex items-center gap-2.5 border border-purple-300/30 transition transform hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-extrabold">Support Magic 🪄</div>
            <div className="text-[10px] text-purple-100 font-medium">Gemini 4 Argon • 9Router</div>
          </div>
        </button>
      )}

      {/* Chat Drawer Modal */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] sm:w-[420px] max-h-[600px] h-[78vh] rounded-3xl bg-white border border-[#E2E6F4] shadow-2xl flex flex-col overflow-hidden text-[#181D30]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#15193B] via-[#251E61] to-[#3B278C] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-cyan-400 flex items-center justify-center shadow">
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>Support Magic</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Online
                  </span>
                </div>
                <select
                  value={supportMagicModel}
                  onChange={(e) => setSupportMagicModel(e.target.value)}
                  className="mt-0.5 text-[11px] bg-white/10 text-purple-100 rounded-lg px-2 py-0.5 border border-white/15 focus:outline-none"
                >
                  {SUPPORT_MAGIC_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="text-slate-900">
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push('/app/support-magic');
                }}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
                title="Mở toàn màn hình"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-[#F5F7FF] border-b border-[#E2E6F4] flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() =>
                handleSend('Hãy viết giúp tôi 1 câu lệnh Prompt tạo ảnh 3D phi hành gia vũ trụ cực nét')
              }
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 text-[#5B46F5] border border-purple-200 font-medium transition"
            >
              ✨ Prompt Phi hành gia 3D
            </button>
            <button
              type="button"
              onClick={() =>
                handleSend('Viết kịch bản Prompt tạo video điện ảnh chiến binh Cyberpunk đi dưới mưa neon')
              }
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 text-[#5B46F5] border border-purple-200 font-medium transition"
            >
              🎬 Prompt Video Cyberpunk
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FE]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#5B46F5] text-white rounded-br-none'
                      : 'bg-white border border-[#E2E6F4] text-[#181D30] rounded-bl-none'
                  }`}
                >
                  {msg.content}

                  {msg.role === 'assistant' && msg.id !== 'welcome' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => sendToStudio('image', msg.content)}
                        className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-[#6D35D5] text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Đẩy sang Tạo Ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => sendToStudio('video', msg.content)}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Video className="w-3 h-3" />
                        <span>Đẩy sang Tạo Video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(msg.id, msg.content)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-medium flex items-center gap-1 transition"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#6D35D5] font-medium px-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Support Magic đang suy nghĩ...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#E2E6F4] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhắn ý tưởng để Support Magic viết prompt..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#F3F5FB] border border-[#E2E6F4] text-xs text-[#181D30] placeholder-[#8A94B0] focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#5B46F5] text-white shadow disabled:opacity-40 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

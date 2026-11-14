import Link from 'next/link';
import { Sparkles, Video, MessageSquare, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DEMO_SAMPLE_IMAGES } from '@/lib/constants';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F5FB] text-[#181D30] flex flex-col justify-between relative overflow-hidden">
      {/* Pastel Purple Top Aura */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[360px] rounded-full bg-gradient-to-r from-indigo-400/20 via-purple-400/20 to-pink-400/15 blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6C47FF] to-[#9333EA] text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 font-black text-base">
            M
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-[#181D30]">
              MagicTool AI
            </span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F1EEFF] text-[#6C47FF] border border-[#D4C9FF]">
              STUDIO V1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/support-magic"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#DCE1F4] bg-white hover:bg-[#F3F5FB] text-xs font-bold text-[#5E6582]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#6C47FF]" />
            <span>Trợ lý Support Magic</span>
          </Link>
          <Link
            href="/app/image"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] text-white text-xs font-bold shadow-md shadow-indigo-500/25"
          >
            <span>Mở Phòng Dựng AI</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#DCE1F4] shadow-sm text-xs font-bold text-[#6C47FF]">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Đã tích hợp Muse AI (1.000.000.000 Token) & 9Router</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#181D30] leading-[1.15]">
            Tạo Sinh Hình Ảnh &{' '}
            <span className="bg-gradient-to-r from-[#6C47FF] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
              Video Điện Ảnh AI
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#5E6582] leading-relaxed">
            Giao diện Studio hiện đại hỗ trợ tiếng Việt hoàn toàn, tích hợp trợ lý ảo{' '}
            <strong>Support Magic</strong> giúp viết câu lệnh chuyên sâu và kết xuất file Ảnh / Video
            MP4 chỉ với 1 cú nhấp chuột.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/app/image"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#6C47FF] via-[#7C3AED] to-[#9333EA] text-white text-sm font-bold shadow-xl shadow-indigo-500/25 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo Hình Ảnh Ngay</span>
            </Link>

            <Link
              href="/app/video"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#DCE1F4] hover:border-[#6C47FF] text-[#181D30] text-sm font-bold shadow-sm transition-all"
            >
              <Video className="w-4 h-4 text-[#6C47FF]" />
              <span>Tạo Video AI</span>
            </Link>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#5E6582]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Hỗ trợ tiếng Việt 100%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Quỹ 1 Tỷ Token miễn phí
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Tự động lưu file về ổ đĩa
            </span>
          </div>
        </div>

        {/* Right Preview Card matching Studio Viewport */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-3xl border border-[#E2E6F4] p-5 shadow-[0_20px_50px_rgba(24,29,48,0.08)]">
            <div className="rounded-2xl bg-[#0B1026] p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[340px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(108,71,255,0.32),transparent_65%)]" />
              <img
                src={DEMO_SAMPLE_IMAGES[0].url}
                alt="AI Studio Preview"
                className="relative z-10 max-h-[260px] rounded-2xl object-contain shadow-2xl border border-white/15"
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 text-center text-xs text-[#8E95B2]">
        MagicTool AI Studio V1.0 • Powered by Muse AI (1B Token) & 9Router Local Gateway
      </footer>
    </div>
  );
}

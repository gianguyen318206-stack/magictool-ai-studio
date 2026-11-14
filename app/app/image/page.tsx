'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Wand2,
  Globe,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Video,
  Zap,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Info,
  Sliders,
  Image as ImageIcon,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import { AspectRatio, ImageStyle, Project, Creation, ProgressEvent } from '@/types';
import { ASPECT_RATIOS, IMAGE_STYLES, DEMO_SAMPLE_IMAGES } from '@/lib/constants';
import { mockGenerationProvider } from '@/features/generation/mock-provider';
import { useTheme } from '@/components/shared/theme-provider';

export default function ImageStudioPage() {
  const router = useRouter();
  const { supportMagicModel } = useTheme();

  // Form states
  const [prompt, setPrompt] = useState(
    'Một nhà du hành vũ trụ đứng trên hành tinh pha lê phát sáng, bầu trời đầy sao điện ảnh, độ phân giải 8K sắc nét.'
  );
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState<ImageStyle>('realistic');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, watermark');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);

  // Generation & AI assistant states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Right stage & gallery states
  const [activeTab, setActiveTab] = useState<'result' | 'info'>('result');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<{
    id: string;
    title: string;
    url: string;
    prompt: string;
    ratio: AspectRatio;
    style: ImageStyle;
    savedFilePath?: string;
    isReal?: boolean;
  }>({
    id: 'sample-0',
    title: DEMO_SAMPLE_IMAGES[0].title,
    url: DEMO_SAMPLE_IMAGES[0].url,
    prompt: DEMO_SAMPLE_IMAGES[0].prompt,
    ratio: '1:1',
    style: 'realistic',
  });

  // 2D Canvas viewport controls (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadInitialData();

    const prefill = sessionStorage.getItem('magictool_prefill_image_prompt');
    if (prefill) {
      setPrompt(prefill);
      sessionStorage.removeItem('magictool_prefill_image_prompt');
      showToast('Đã nạp câu lệnh từ Support Magic AI!');
    }

    const handlePrefillEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'image' && detail?.prompt) {
        setPrompt(detail.prompt);
        showToast('Đã nạp câu lệnh từ Support Magic AI!');
      }
    };

    window.addEventListener('magictool:prefill-prompt', handlePrefillEvent);
    return () => window.removeEventListener('magictool:prefill-prompt', handlePrefillEvent);
  }, []);

  async function loadInitialData() {
    try {
      await syncCloudToLocal();
      const [allProjects, allCreations] = await Promise.all([
        db.projects.orderBy('updatedAt').reverse().toArray(),
        db.creations.where('kind').equals('image').reverse().sortBy('createdAt'),
      ]);
      setProjects(allProjects);
      setCreations(allCreations);

      if (allCreations.length > 0 && allCreations[0].assetUrl) {
        const latest = allCreations[0];
        setSelectedPreview({
          id: latest.id,
          title: latest.title,
          url: latest.assetUrl!,
          prompt: latest.prompt,
          ratio: latest.settings?.ratio || '1:1',
          style: latest.settings?.imageStyle || 'realistic',
          savedFilePath: latest.savedFilePath,
          isReal: !latest.isDemo,
        });
      }
    } catch (err) {
      console.error('Failed to load initial image studio data:', err);
    }
  }

  async function handleSupportMagicEnhance() {
    if (isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/support-magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'enhance',
          targetType: 'image',
          prompt: prompt.trim() || 'Một phi hành gia trong không gian vũ trụ điện ảnh 8K',
          model: supportMagicModel,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setPrompt(data.reply.slice(0, 1000));
        showToast('🪄 Support Magic đã tối ưu hóa câu lệnh của bạn!');
      }
    } catch {
      showToast('Không thể kết nối Support Magic, vui lòng thử lại.');
    } finally {
      setIsEnhancing(false);
    }
  }

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setProgress(10);
    setStatusMessage('Đang gửi yêu cầu tạo ảnh tới AI Studio...');
    setActiveTab('result');

    try {
      const job = await mockGenerationProvider.createImageJob(
        {
          kind: 'image',
          prompt: prompt.trim(),
          projectId: selectedProjectId || undefined,
          settings: {
            ratio,
            imageStyle: style,
            negativePrompt: negativePrompt.trim() || undefined,
            model: 'muse-web/muse-image',
          },
        },
        (event: ProgressEvent) => {
          if (event.progress !== undefined) setProgress(event.progress);
          if (event.message) setStatusMessage(event.message);
        }
      );

      const checkInterval = setInterval(async () => {
        const updated = await mockGenerationProvider.getJob(job.id);
        if (!updated) return;

        if (updated.progress !== undefined) setProgress(updated.progress);

        if (
          updated.status === 'completed' ||
          updated.status === 'completed_demo' ||
          updated.status === 'failed' ||
          updated.status === 'canceled'
        ) {
          clearInterval(checkInterval);
          setIsGenerating(false);

          const refreshed = await db.creations
            .where('kind')
            .equals('image')
            .reverse()
            .sortBy('createdAt');
          setCreations(refreshed);

          if (updated.resultAssetUrl) {
            setSelectedPreview({
              id: updated.id,
              title: updated.prompt.slice(0, 42),
              url: updated.resultAssetUrl,
              prompt: updated.prompt,
              ratio: updated.settings.ratio,
              style: updated.settings.imageStyle || 'realistic',
              savedFilePath: updated.savedFilePath,
              isReal: updated.status === 'completed',
            });
            resetTransform();
            showToast('✨ Đã tạo hình ảnh hoàn tất và lưu vào máy!');
          }
        }
      }, 900);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      showToast('Đã xảy ra lỗi khi tạo hình ảnh.');
    }
  }

  function resetTransform() {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }

  function handleSendToVideoStudio() {
    sessionStorage.setItem(
      'magictool_reference_image',
      JSON.stringify({
        url: selectedPreview.url,
        prompt: selectedPreview.prompt,
        title: selectedPreview.title,
      })
    );
    router.push('/app/video');
  }

  async function handleDownload() {
    try {
      const a = document.createElement('a');
      a.href = selectedPreview.url;
      a.download = `magictool-image-${Date.now()}.png`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đang tải hình ảnh xuống máy...');
    } catch {
      showToast('Không thể tải xuống trực tiếp.');
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(selectedPreview.prompt);
    showToast('Đã sao chép câu lệnh (Prompt) vào bộ nhớ tạm!');
  }

  const thumbnailGallery = [
    ...creations
      .filter((c) => c.assetUrl)
      .map((c) => ({
        id: c.id,
        title: c.title,
        url: c.assetUrl!,
        prompt: c.prompt,
        ratio: (c.settings?.ratio || '1:1') as AspectRatio,
        style: (c.settings?.imageStyle || 'realistic') as ImageStyle,
        savedFilePath: c.savedFilePath,
        isReal: !c.isDemo,
      })),
    ...DEMO_SAMPLE_IMAGES.map((sample, idx) => ({
      id: `sample-${idx}`,
      title: sample.title,
      url: sample.url,
      prompt: sample.prompt,
      ratio: '1:1' as AspectRatio,
      style: 'realistic' as ImageStyle,
      savedFilePath: undefined,
      isReal: false,
    })),
  ].slice(0, 5);

  const currentStep = isGenerating ? 3 : prompt.trim().length > 10 ? 2 : 1;
  const activeStyleLabel =
    IMAGE_STYLES.find((s) => s.value === selectedPreview.style)?.label || 'Chân thực';

  return (
    <div className="max-w-[1440px] mx-auto">
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#15193B] text-white text-sm font-medium shadow-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT WHITE CARD: Stepper + Prompt + Ratios + Styles + Accordion + CTA */}
        <div className="xl:col-span-5 bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-[0_10px_35px_rgba(24,29,48,0.04)] flex flex-col justify-between">
          <div className="space-y-5">
            {/* 3-Step Progress Bar */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#EEF1F9]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep >= 1
                      ? 'bg-[#6C47FF] text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-[#EEF1F9] text-[#646B89]'
                  }`}
                >
                  1
                </span>
                <span className="text-xs font-semibold text-[#181D30]">Nhập yêu cầu</span>
              </div>

              <div className="flex-1 h-[2px] bg-gradient-to-r from-[#6C47FF] to-[#D5DCFA] mx-1 rounded-full" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep >= 2
                      ? 'bg-[#6C47FF] text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-[#EEF1F9] text-[#646B89]'
                  }`}
                >
                  2
                </span>
                <span className="text-xs font-semibold text-[#181D30]">Tùy chỉnh</span>
              </div>

              <div className="flex-1 h-[2px] bg-[#E2E6F4] mx-1 rounded-full" />

              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                    currentStep >= 3
                      ? 'bg-[#6C47FF] text-white shadow-sm shadow-indigo-500/30'
                      : 'bg-[#EEF1F9] text-[#646B89]'
                  }`}
                >
                  3
                </span>
                <span className="text-xs font-medium text-[#646B89]">Tạo hình ảnh</span>
              </div>
            </div>

            {/* Prompt Input Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#181D30]">
                  Mô tả hình ảnh bạn muốn tạo
                </label>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E6582] bg-[#F3F5FB] px-2.5 py-1 rounded-full border border-[#E2E6F4]">
                  <Globe className="w-3.5 h-3.5 text-[#6C47FF]" />
                  Hỗ trợ tiếng Việt
                </span>
              </div>

              <div className="relative rounded-2xl border border-[#DCE1F4] bg-[#FAFBFD] focus-within:border-[#6C47FF] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#6C47FF]/10 transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                  rows={3}
                  placeholder="Nhập mô tả chi tiết hình ảnh bạn muốn AI vẽ..."
                  className="w-full px-4 pt-3.5 pb-11 bg-transparent text-sm text-[#181D30] placeholder:text-[#8E95B2] focus:outline-none resize-none leading-relaxed"
                />
                <div className="absolute bottom-2.5 left-3.5 right-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-[#8E95B2]">
                    {prompt.length} / 1000
                  </span>
                  <button
                    type="button"
                    onClick={handleSupportMagicEnhance}
                    disabled={isEnhancing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6C47FF] bg-[#F1EEFF] hover:bg-[#E4DFFF] border border-[#D4C9FF] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isEnhancing ? 'Đang viết...' : 'AI gợi ý'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-sm font-bold text-[#181D30] mb-2.5">
                Tỷ lệ khung hình
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((item) => {
                  const isSelected = ratio === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRatio(item.value)}
                      className={`relative flex flex-col items-center justify-center py-2.5 px-1.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#6C47FF] bg-[#F5F2FF] text-[#6C47FF] shadow-sm'
                          : 'border-[#E2E6F4] bg-[#FAFBFD] text-[#5E6582] hover:border-[#C5CEEB] hover:bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#6C47FF] text-white flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                      <div className="h-5 flex items-center justify-center mb-1">
                        <div
                          className={`border-2 rounded-[3px] ${
                            isSelected ? 'border-[#6C47FF] bg-[#6C47FF]/15' : 'border-[#8E95B2]'
                          } ${
                            item.value === '1:1'
                              ? 'w-4 h-4'
                              : item.value === '16:9'
                              ? 'w-5 h-3'
                              : item.value === '9:16'
                              ? 'w-3 h-5'
                              : item.value === '4:3'
                              ? 'w-4.5 h-3.5'
                              : 'w-3.5 h-4.5'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-bold leading-tight">{item.value}</span>
                      <span className="text-[10px] opacity-80 leading-tight mt-0.5">
                        {item.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5 Style Cards */}
            <div>
              <label className="block text-sm font-bold text-[#181D30] mb-2.5">Phong cách</label>
              <div className="grid grid-cols-5 gap-2.5">
                {IMAGE_STYLES.map((item) => {
                  const isSelected = style === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStyle(item.value)}
                      className={`group relative flex flex-col items-center p-1.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#6C47FF] bg-[#F5F2FF] ring-2 ring-[#6C47FF]/20 shadow-sm'
                          : 'border-[#E2E6F4] bg-[#FAFBFD] hover:border-[#C5CEEB] hover:bg-white'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-[#6C47FF] text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#15193B] mb-1.5 relative">
                        <img
                          src={item.thumb}
                          alt={item.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      </div>
                      <span
                        className={`text-[11px] font-bold leading-tight ${
                          isSelected ? 'text-[#6C47FF]' : 'text-[#181D30]'
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessible Native Accordion (<details>/<summary>) */}
            <details className="studio-accordion group">
              <summary className="flex items-center justify-between text-xs font-semibold text-[#5E6582]">
                <span className="inline-flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#6C47FF]" />
                  Cài đặt nâng cao
                </span>
                <ChevronDown className="w-4 h-4 text-[#8E95B2] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#EEF1F9]">
                <div>
                  <label className="block text-xs font-semibold text-[#5E6582] mb-1">
                    Từ khóa loại trừ (Negative Prompt)
                  </label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, low quality, deformed..."
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE1F4] bg-white text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#5E6582] mb-1">
                      Lưu vào dự án
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCE1F4] bg-white text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
                    >
                      <option value="">Mặc định (Tất cả)</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5E6582] mb-1">
                      Engine tạo ảnh
                    </label>
                    <div className="px-2.5 py-2 rounded-xl border border-[#DCE1F4] bg-[#F5F2FF] text-xs font-semibold text-[#6C47FF] truncate">
                      Muse AI + Flux HD
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* CTA Button & Cost Footer */}
          <div className="pt-5 mt-4 border-t border-[#EEF1F9]">
            {isGenerating && (
              <div className="mb-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#6C47FF]">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {statusMessage}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EEF1F9] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C47FF] via-[#8B5CF6] to-[#EC4899] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#6C47FF] via-[#7C3AED] to-[#9333EA] hover:from-[#5B36F5] hover:to-[#7E22CE] text-white font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo hình ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo hình ảnh ngay</span>
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[#646B89]">
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Dự kiến: <strong className="text-[#181D30]">5 – 15 giây</strong>
              </span>
              <span className="text-[#CBD2EC]">|</span>
              <span>
                Chi phí: <strong className="text-[#6C47FF]">2 Credit</strong> (Quỹ 1 Tỷ Token)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT WHITE CARD: Clean Image Studio Canvas + Bottom Strip */}
        <div
          className={`xl:col-span-7 bg-white rounded-3xl border border-[#E2E6F4] p-6 shadow-[0_10px_35px_rgba(24,29,48,0.04)] flex flex-col justify-between ${
            isFullscreen ? 'fixed inset-4 z-50 xl:col-span-12' : ''
          }`}
        >
          {/* Top Tabs & Fullscreen Button */}
          <div className="flex items-center justify-between pb-4">
            <div className="inline-flex items-center p-1 rounded-2xl bg-[#F3F5FB] border border-[#E2E6F4]">
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'result'
                    ? 'bg-[#6C47FF] text-white shadow-sm'
                    : 'text-[#5E6582] hover:text-[#181D30]'
                }`}
              >
                Kết quả hình ảnh
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-[#6C47FF] text-white shadow-sm'
                    : 'text-[#5E6582] hover:text-[#181D30]'
                }`}
              >
                Chi tiết & Câu lệnh
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#E2E6F4] bg-white hover:bg-[#F3F5FB] text-xs font-semibold text-[#5E6582] transition-all cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Thu nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>
          </div>

          {/* Clean Dark Image Studio Canvas (NO 3D 360 ring or XYZ gizmo) */}
          {activeTab === 'result' ? (
            <div className="relative flex-1 min-h-[420px] rounded-2xl bg-gradient-to-b from-[#111736] via-[#0B1026] to-[#080B1A] overflow-hidden flex items-center justify-center border border-[#1E2756] select-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,71,255,0.22),transparent_70%)] pointer-events-none" />

              {/* Left 2D Image Canvas Toolbar */}
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#151C42]/90 backdrop-blur-md border border-white/10 shadow-xl">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-[#6C47FF] hover:text-white transition-all cursor-pointer"
                  title="Phóng to ảnh"
                >
                  <ZoomIn className="w-4 h-4 mb-0.5" />
                  <span>Phóng to</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-[#6C47FF] hover:text-white transition-all cursor-pointer"
                  title="Thu nhỏ ảnh"
                >
                  <ZoomOut className="w-4 h-4 mb-0.5" />
                  <span>Thu nhỏ</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPanOffset((p) => ({
                      x: p.x === 0 ? 18 : p.x > 0 ? -18 : 0,
                      y: 0,
                    }))
                  }
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-[#6C47FF] hover:text-white transition-all cursor-pointer"
                  title="Di chuyển khung nhìn"
                >
                  <Move className="w-4 h-4 mb-0.5" />
                  <span>Di chuyển</span>
                </button>

                <button
                  type="button"
                  onClick={resetTransform}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-[#6C47FF] hover:text-white transition-all cursor-pointer"
                  title="Đặt lại khung hình chuẩn"
                >
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span>Đặt lại</span>
                </button>
              </div>

              {/* Top-Right Resolution & Ratio Badge */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#151C42]/90 text-indigo-200 border border-white/15 shadow">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {selectedPreview.ratio} • {activeStyleLabel}
                  </span>
                </span>
              </div>

              {/* Main Generated Image Display */}
              <div className="relative z-10 flex items-center justify-center px-16 py-6 w-full h-full">
                <div
                  className="relative transition-transform duration-300 ease-out"
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  }}
                >
                  <img
                    src={selectedPreview.url}
                    alt={selectedPreview.title}
                    className="max-h-[350px] w-auto rounded-2xl object-contain shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/15"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[420px] rounded-2xl bg-[#F8F9FE] border border-[#E2E6F4] p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F1EEFF] text-[#6C47FF] flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#181D30]">
                      Thông số Hình ảnh & Nguồn AI
                    </h3>
                    <p className="text-xs text-[#646B89]">
                      Kết xuất trực tiếp qua cổng AI Studio • Muse AI (Quỹ 1.000.000.000 Token)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Engine xử lý</span>
                    <strong className="text-[#181D30]">Muse AI Image / Flux HD</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Tỷ lệ & Phong cách</span>
                    <strong className="text-[#181D30]">
                      {selectedPreview.ratio} • {activeStyleLabel}
                    </strong>
                  </div>
                  <div className="col-span-2 p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Câu lệnh (Prompt)</span>
                    <p className="text-[#181D30] font-medium leading-relaxed">
                      {selectedPreview.prompt}
                    </p>
                  </div>
                  <div className="col-span-2 p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Đường dẫn lưu trữ tự động</span>
                    <code className="text-[#6C47FF] font-mono text-[11px]">
                      {selectedPreview.savedFilePath ||
                        'D:\\Tool tạo video\\outputs\\muse-image-output.png'}
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E2E6F4] text-xs text-[#646B89]">
                <span className="inline-flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-[#6C47FF]" />
                  Tự động đồng bộ vào Kho Sáng Tạo
                </span>
                <span className="font-semibold text-emerald-600">● Đã kết nối 1 Tỷ Token</span>
              </div>
            </div>
          )}

          {/* Bottom Strip: 5 Thumbnails + Send to Video + Download + Share */}
          <div className="pt-4 mt-4 border-t border-[#EEF1F9] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {thumbnailGallery.map((item) => {
                const isCurrent = selectedPreview.url === item.url;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreview(item);
                      resetTransform();
                    }}
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-[#6C47FF] ring-2 ring-[#6C47FF]/25 scale-105 shadow-md'
                        : 'border-[#E2E6F4] opacity-80 hover:opacity-100 hover:border-[#6C47FF]/50'
                    }`}
                    title={item.title}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSendToVideoStudio}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[#D4C9FF] bg-[#F5F2FF] hover:bg-[#EBE5FF] text-xs font-bold text-[#6C47FF] transition-all cursor-pointer"
                title="Biến ảnh này thành Video chuyển động"
              >
                <Video className="w-4 h-4" />
                <span>Tạo Video từ ảnh</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] hover:from-[#5B36F5] hover:to-[#7C3AED] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải xuống</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80 border-l border-white/25 pl-1 box-content" />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#E2E6F4] bg-white hover:bg-[#F3F5FB] text-xs font-bold text-[#181D30] transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#5E6582]" />
                <span>Chia sẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

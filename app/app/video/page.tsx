'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Globe,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Share2,
  Zap,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Info,
  Sliders,
  Upload,
  Image as ImageIcon,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Mic,
  Type,
} from 'lucide-react';
import { db, syncCloudToLocal } from '@/lib/db';
import {
  AspectRatio,
  ImageStyle,
  MotionPreset,
  VideoMode,
  Project,
  Creation,
  ProgressEvent,
} from '@/types';
import {
  ASPECT_RATIOS,
  IMAGE_STYLES,
  MOTION_PRESETS,
  DEMO_SAMPLE_VIDEOS,
  VOICE_OPTIONS,
  SUBTITLE_STYLES,
} from '@/lib/constants';
import { mockGenerationProvider } from '@/features/generation/mock-provider';
import { useTheme } from '@/components/shared/theme-provider';

export default function VideoStudioPage() {
  const { supportMagicModel } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Form states
  const [videoMode, setVideoMode] = useState<VideoMode>('text-to-video');
  const [prompt, setPrompt] = useState(
    'Phi hành gia bước đi chậm rãi trên bề mặt hành tinh pha lê phát sáng, các hạt ánh sáng lơ lửng, máy quay Dolly Zoom điện ảnh 8K.'
  );
  const [ratio, setRatio] = useState<AspectRatio>('16:9');
  const [style, setStyle] = useState<ImageStyle>('realistic');
  const [motionPreset, setMotionPreset] = useState<MotionPreset>('dolly');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>('');
  const [referenceTitle, setReferenceTitle] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);

  // Voiceover & Subtitles states (Shorts / TikTok Studio)
  const [enableVoiceover, setEnableVoiceover] = useState(true);
  const [voiceId, setVoiceId] = useState('vi-VN-HoaiMyNeural');
  const [voiceScript, setVoiceScript] = useState('');
  const [enableSubtitles, setEnableSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<'tiktok-yellow' | 'modern-white' | 'neon-cyan'>(
    'tiktok-yellow'
  );

  // Generation & AI assistant states
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Right stage & video player states
  const [activeTab, setActiveTab] = useState<'result' | 'info'>('result');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<{
    id: string;
    title: string;
    url: string;
    thumb?: string;
    prompt: string;
    ratio: AspectRatio;
    style: ImageStyle;
    motion: MotionPreset;
    duration: 5 | 10;
    savedFilePath?: string;
    isVideoFile: boolean;
    isReal?: boolean;
  }>({
    id: 'sample-vid-0',
    title: DEMO_SAMPLE_VIDEOS[0].title,
    url: DEMO_SAMPLE_VIDEOS[0].url,
    thumb: DEMO_SAMPLE_VIDEOS[0].thumb,
    prompt: DEMO_SAMPLE_VIDEOS[0].prompt,
    ratio: '16:9',
    style: 'realistic',
    motion: 'dolly',
    duration: 5,
    isVideoFile: true,
    isReal: false,
  });

  // 2D Video stage zoom control
  const [zoom, setZoom] = useState(1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    loadInitialData();

    const prefill = sessionStorage.getItem('magictool_prefill_video_prompt');
    if (prefill) {
      setPrompt(prefill);
      sessionStorage.removeItem('magictool_prefill_video_prompt');
      showToast('Đã nạp kịch bản video từ Support Magic AI!');
    }

    const refImgRaw = sessionStorage.getItem('magictool_reference_image');
    if (refImgRaw) {
      try {
        const parsed = JSON.parse(refImgRaw);
        if (parsed?.url) {
          setVideoMode('image-to-video');
          setReferenceImageUrl(parsed.url);
          setReferenceTitle(parsed.title || 'Ảnh từ Tạo Ảnh AI');
          if (parsed.prompt) setPrompt(parsed.prompt);
          showToast('Đã nạp ảnh gốc từ Tạo Ảnh AI để chuyển thành Video!');
        }
      } catch {
        // ignore
      }
      sessionStorage.removeItem('magictool_reference_image');
    }

    const handlePrefillEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type === 'video' && detail?.prompt) {
        setPrompt(detail.prompt);
        showToast('Đã nạp kịch bản video từ Support Magic AI!');
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
        db.creations.where('kind').equals('video').reverse().sortBy('createdAt'),
      ]);
      setProjects(allProjects);

      // Filter only real video files (.mp4 / .webm / data:video) so old static demo images don't clutter the video player
      const validVideos = allCreations.filter(
        (c) =>
          c.assetUrl &&
          (c.assetUrl.endsWith('.mp4') ||
            c.assetUrl.endsWith('.webm') ||
            c.assetUrl.startsWith('data:video/') ||
            c.assetUrl.includes('/outputs/'))
      );
      setCreations(validVideos);

      if (validVideos.length > 0 && validVideos[0].assetUrl) {
        const latest = validVideos[0];
        setSelectedPreview({
          id: latest.id,
          title: latest.title,
          url: latest.assetUrl!,
          prompt: latest.prompt,
          ratio: latest.settings?.ratio || '16:9',
          style: latest.settings?.imageStyle || 'realistic',
          motion: latest.settings?.motionPreset || 'dolly',
          duration: latest.settings?.videoDurationSeconds || 5,
          savedFilePath: latest.savedFilePath,
          isVideoFile: true,
          isReal: !latest.isDemo,
        });
      }
    } catch (err) {
      console.error('Failed to load initial video studio data:', err);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReferenceImageUrl(reader.result);
        setReferenceTitle(file.name);
        setVideoMode('image-to-video');
        showToast(`Đã tải ảnh tham chiếu: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
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
          targetType: 'video',
          prompt:
            prompt.trim() ||
            'Cảnh quay điện ảnh phi hành gia bước đi trên hành tinh ánh sáng 8K',
          model: supportMagicModel,
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setPrompt(data.reply.slice(0, 1000));
        showToast('🪄 Support Magic đã tối ưu hóa kịch bản chuyển động Video!');
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
    setProgress(12);
    setStatusMessage('Đang khởi tạo cảnh quay & render chuyển động Video MP4...');
    setActiveTab('result');

    try {
      const styleInfo = IMAGE_STYLES.find((s) => s.value === style);
      const fullPrompt = styleInfo
        ? `${prompt.trim()}, ${styleInfo.promptSuffix}`
        : prompt.trim();

      const job = await mockGenerationProvider.createVideoJob(
        {
          kind: 'video',
          videoMode,
          prompt: fullPrompt,
          referenceImageUrl:
            videoMode === 'image-to-video' && referenceImageUrl
              ? referenceImageUrl
              : undefined,
          projectId: selectedProjectId || undefined,
          settings: {
            ratio,
            imageStyle: style,
            motionPreset,
            videoDurationSeconds: duration,
            model: 'muse-web/muse-video',
            enableVoiceover,
            voiceId,
            voiceScript: voiceScript.trim() || undefined,
            enableSubtitles,
            subtitleStyle,
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
            .equals('video')
            .reverse()
            .sortBy('createdAt');
          const validVideos = refreshed.filter(
            (c) =>
              c.assetUrl &&
              (c.assetUrl.endsWith('.mp4') ||
                c.assetUrl.endsWith('.webm') ||
                c.assetUrl.startsWith('data:video/') ||
                c.assetUrl.includes('/outputs/'))
          );
          setCreations(validVideos);

          if (updated.resultAssetUrl) {
            setSelectedPreview({
              id: updated.id,
              title: prompt.slice(0, 42),
              url: updated.resultAssetUrl,
              prompt: prompt.trim(),
              ratio: updated.settings.ratio,
              style: updated.settings.imageStyle || 'realistic',
              motion: updated.settings.motionPreset || 'dolly',
              duration: updated.settings.videoDurationSeconds || 5,
              savedFilePath: updated.savedFilePath,
              isVideoFile: true,
              isReal: updated.status === 'completed',
            });
            setZoom(1);
            setIsPlaying(true);
            showToast('🎬 Đã tạo Video MP4 thành công và lưu vào máy!');
          }
        }
      }, 900);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      showToast('Đã xảy ra lỗi khi tạo video.');
    }
  }

  function togglePlayPause() {
    const vid = videoPlayerRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }

  function toggleMute() {
    const vid = videoPlayerRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setIsMuted(vid.muted);
  }

  function handleDownload() {
    try {
      const a = document.createElement('a');
      a.href = selectedPreview.url;
      a.download = `magictool-video-${Date.now()}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đang tải file Video MP4 xuống máy...');
    } catch {
      showToast('Không thể tải xuống trực tiếp.');
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(selectedPreview.prompt);
    showToast('Đã sao chép kịch bản Video vào bộ nhớ tạm!');
  }

  const thumbnailGallery = [
    ...creations
      .filter((c) => c.assetUrl)
      .map((c) => ({
        id: c.id,
        title: c.title,
        url: c.assetUrl!,
        thumb: undefined,
        prompt: c.prompt,
        ratio: (c.settings?.ratio || '16:9') as AspectRatio,
        style: (c.settings?.imageStyle || 'realistic') as ImageStyle,
        motion: (c.settings?.motionPreset || 'dolly') as MotionPreset,
        duration: (c.settings?.videoDurationSeconds || 5) as 5 | 10,
        savedFilePath: c.savedFilePath,
        isVideoFile: true,
        isReal: !c.isDemo,
      })),
    ...DEMO_SAMPLE_VIDEOS.map((sample, idx) => ({
      id: `sample-vid-${idx}`,
      title: sample.title,
      url: sample.url,
      thumb: sample.thumb,
      prompt: sample.prompt,
      ratio: '16:9' as AspectRatio,
      style: 'realistic' as ImageStyle,
      motion: 'dolly' as MotionPreset,
      duration: 5 as 5 | 10,
      savedFilePath: undefined,
      isVideoFile: true,
      isReal: false,
    })),
  ].slice(0, 5);

  const currentStep = isGenerating ? 3 : prompt.trim().length > 10 ? 2 : 1;

  return (
    <div className="max-w-[1440px] mx-auto">
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#15193B] text-white text-sm font-medium shadow-xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT WHITE CARD */}
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
                <span className="text-xs font-medium text-[#646B89]">Tạo Video AI</span>
              </div>
            </div>

            {/* Mode Switcher: Text-to-Video vs Image-to-Video */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#F3F5FB] border border-[#E2E6F4]">
              <button
                type="button"
                onClick={() => setVideoMode('text-to-video')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  videoMode === 'text-to-video'
                    ? 'bg-white text-[#6C47FF] shadow-sm border border-[#E2E6F4]'
                    : 'text-[#5E6582] hover:text-[#181D30]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Từ văn bản (Text)</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('image-to-video')}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  videoMode === 'image-to-video'
                    ? 'bg-white text-[#6C47FF] shadow-sm border border-[#E2E6F4]'
                    : 'text-[#5E6582] hover:text-[#181D30]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Từ hình ảnh (Img2Vid)</span>
              </button>
            </div>

            {/* Optional Reference Image Box when in Image-to-Video mode */}
            {videoMode === 'image-to-video' && (
              <div className="p-3 rounded-2xl border border-dashed border-[#B8A7FF] bg-[#F8F6FF]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {referenceImageUrl ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={referenceImageUrl}
                        alt="Reference"
                        className="w-12 h-12 rounded-xl object-cover border border-[#6C47FF]/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#181D30] truncate">
                          {referenceTitle || 'Ảnh tham chiếu đã chọn'}
                        </p>
                        <p className="text-[11px] text-[#6C47FF]">
                          Sẵn sàng kết xuất thành Video MP4
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReferenceImageUrl('');
                        setReferenceTitle('');
                      }}
                      className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-[#5E6582] hover:text-rose-600 border border-[#E2E6F4] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-[#6C47FF] hover:underline cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Tải ảnh gốc lên để làm chuyển động Video</span>
                  </button>
                )}
              </div>
            )}

            {/* Prompt Input Box */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[#181D30]">
                  Mô tả cảnh quay & chuyển động bạn muốn tạo
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
                  placeholder="Mô tả bối cảnh, hành động của nhân vật, góc máy quay..."
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

            {/* 5 Aspect Ratio Cards */}
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
                  Cài đặt nâng cao (Chuyển động Camera & Thời lượng)
                </span>
                <ChevronDown className="w-4 h-4 text-[#8E95B2] transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#EEF1F9]">
                <div>
                  <label className="block text-xs font-semibold text-[#5E6582] mb-1.5">
                    Chuyển động máy quay (Camera Motion)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MOTION_PRESETS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setMotionPreset(m.value)}
                        className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          motionPreset === m.value
                            ? 'border-[#6C47FF] bg-[#F5F2FF] text-[#6C47FF]'
                            : 'border-[#DCE1F4] bg-white text-[#181D30]'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                        <div className="text-[10px] text-[#646B89] truncate">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#5E6582] mb-1">
                      Thời lượng Video
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value) as 5 | 10)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#DCE1F4] bg-white text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
                    >
                      <option value={5}>5 giây (Tiêu chuẩn)</option>
                      <option value={10}>10 giây (Mở rộng)</option>
                    </select>
                  </div>
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
                </div>
              </div>
            </details>

            {/* TikTok & Shorts Audio/Subtitles Studio Card */}
            <div className="p-4 rounded-2xl border border-[#DCE1F4] bg-[#F8F9FE] space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#6C47FF] to-[#FF4785] text-white flex items-center justify-center shadow-sm">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#181D30]">
                      Lồng tiếng AI & Phụ đề TikTok
                    </h4>
                    <p className="text-[10px] text-[#5E6582]">
                      Tự động ghép giọng đọc truyền cảm & chữ chạy theo nhịp video
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#6C47FF] bg-[#EDE9FE] px-2 py-0.5 rounded-full">
                  Shorts / Reels Pro
                </span>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E2E6F4] cursor-pointer hover:border-[#6C47FF]">
                  <input
                    type="checkbox"
                    checked={enableVoiceover}
                    onChange={(e) => setEnableVoiceover(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6C47FF] accent-[#6C47FF]"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#181D30]">Giọng đọc AI</div>
                    <div className="text-[10px] text-[#5E6582]">Thuyết minh kịch bản</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-[#E2E6F4] cursor-pointer hover:border-[#6C47FF]">
                  <input
                    type="checkbox"
                    checked={enableSubtitles}
                    onChange={(e) => setEnableSubtitles(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6C47FF] accent-[#6C47FF]"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#181D30]">Phụ đề động</div>
                    <div className="text-[10px] text-[#5E6582]">Chữ nhảy chuẩn TikTok</div>
                  </div>
                </label>
              </div>

              {/* Voice selection & style controls if enabled */}
              {enableVoiceover && (
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-[#181D30]">
                    Chọn giọng thuyết minh
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VOICE_OPTIONS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVoiceId(v.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          voiceId === v.id
                            ? 'border-[#6C47FF] bg-[#F5F2FF] text-[#6C47FF]'
                            : 'border-[#E2E6F4] bg-white text-[#181D30]'
                        }`}
                      >
                        <div className="text-xs font-bold">{v.name}</div>
                        <div className="text-[10px] text-[#5E6582] truncate">{v.desc}</div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#181D30] mb-1">
                      Kịch bản thuyết minh riêng (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={voiceScript}
                      onChange={(e) => setVoiceScript(e.target.value)}
                      placeholder="Mặc định đọc theo mô tả kịch bản ở trên..."
                      className="w-full px-3 py-1.5 rounded-xl border border-[#DCE1F4] bg-white text-xs text-[#181D30] focus:outline-none focus:border-[#6C47FF]"
                    />
                  </div>
                </div>
              )}

              {enableSubtitles && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-[#181D30]">
                    Màu sắc & Phong cách phụ đề
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SUBTITLE_STYLES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSubtitleStyle(s.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          subtitleStyle === s.id
                            ? 'border-[#6C47FF] bg-[#F5F2FF] text-[#6C47FF]'
                            : 'border-[#E2E6F4] bg-white text-[#181D30]'
                        }`}
                      >
                        <div className="text-xs font-bold">{s.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                  <span>Đang kết xuất Video MP4...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tạo Video ngay</span>
                </>
              )}
            </button>

            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-[#646B89]">
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Dự kiến: <strong className="text-[#181D30]">10 – 25 giây</strong>
              </span>
              <span className="text-[#CBD2EC]">|</span>
              <span>
                Chi phí: <strong className="text-[#6C47FF]">5 Credit</strong> (Quỹ 1 Tỷ Token)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT WHITE CARD: Dedicated Cinema Video Player + Bottom Strip */}
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
                Trình phát Video
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
                Chi tiết & Kịch bản
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

          {activeTab === 'result' ? (
            <div className="relative flex-1 min-h-[420px] rounded-2xl bg-gradient-to-b from-[#111736] via-[#0B1026] to-[#080B1A] overflow-hidden flex items-center justify-center border border-[#1E2756] select-none">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,71,255,0.22),transparent_70%)] pointer-events-none" />

              {/* Left Video Controls Toolbar (Play/Pause, Mute, Zoom, Reset) */}
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 p-1.5 rounded-2xl bg-[#151C42]/90 backdrop-blur-md border border-white/10 shadow-xl">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium bg-[#6C47FF] text-white shadow transition-all cursor-pointer"
                  title="Phát / Tạm dừng Video"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mb-0.5" />
                      <span>Tạm dừng</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mb-0.5" />
                      <span>Phát</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                  title="Bật / Tắt âm thanh"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 mb-0.5" />
                      <span>Tắt tiếng</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mb-0.5" />
                      <span>Bật tiếng</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4 mb-0.5" />
                  <span>Phóng to</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4 mb-0.5" />
                  <span>Thu nhỏ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="flex flex-col items-center justify-center w-12 py-2 rounded-xl text-[10px] font-medium text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span>Đặt lại</span>
                </button>
              </div>

              {/* Top-Right Video Spec Badge */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#151C42]/90 text-indigo-200 border border-white/15 shadow">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    MP4 HD • {selectedPreview.duration}s • {selectedPreview.motion.toUpperCase()}
                  </span>
                </span>
              </div>

              {/* Center HTML5 Video Player (NO 360 ring, NO static image placeholder) */}
              <div className="relative z-10 flex items-center justify-center px-16 py-6 w-full h-full">
                <div
                  className="relative transition-transform duration-300 ease-out"
                  style={{
                    transform: `scale(${zoom})`,
                  }}
                >
                  <video
                    ref={videoPlayerRef}
                    key={selectedPreview.url}
                    src={selectedPreview.url}
                    controls
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="max-h-[340px] w-auto rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] border border-white/15 bg-black"
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
                      Thông số kỹ thuật Video AI
                    </h3>
                    <p className="text-xs text-[#646B89]">
                      Kết xuất Video MP4 qua hệ thống AI Studio • Muse AI (Quỹ 1.000.000.000 Token)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Định dạng & Engine</span>
                    <strong className="text-[#181D30]">MP4 H.264 60FPS • Muse Video AI</strong>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Cấu hình quay</span>
                    <strong className="text-[#181D30]">
                      {selectedPreview.ratio} • {selectedPreview.duration}s •{' '}
                      {selectedPreview.motion.toUpperCase()}
                    </strong>
                  </div>
                  <div className="col-span-2 p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Kịch bản (Prompt)</span>
                    <p className="text-[#181D30] font-medium leading-relaxed">
                      {selectedPreview.prompt}
                    </p>
                  </div>
                  <div className="col-span-2 p-3.5 rounded-2xl bg-white border border-[#E2E6F4]">
                    <span className="text-[#8E95B2] block mb-1">Đường dẫn lưu trữ tự động</span>
                    <code className="text-[#6C47FF] font-mono text-[11px]">
                      {selectedPreview.savedFilePath ||
                        'D:\\Tool tạo video\\outputs\\muse-video-output.mp4'}
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

          {/* Bottom Strip: 5 Video Thumbnails + Download + Share */}
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
                      setZoom(1);
                      setIsPlaying(true);
                    }}
                    className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-[#0B1026] ${
                      isCurrent
                        ? 'border-[#6C47FF] ring-2 ring-[#6C47FF]/25 scale-105 shadow-md'
                        : 'border-[#E2E6F4] opacity-80 hover:opacity-100 hover:border-[#6C47FF]/50'
                    }`}
                    title={item.title}
                  >
                    {item.thumb ? (
                      <img
                        src={item.thumb}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        muted
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#6C47FF]/90 text-white flex items-center justify-center shadow">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#6C47FF] to-[#8B5CF6] hover:from-[#5B36F5] hover:to-[#7C3AED] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải xuống MP4</span>
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

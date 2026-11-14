import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import {
  translatePromptVia9Router,
  generateAiImageBuffer,
  saveBufferMediaToDisk,
  saveBase64MediaToDisk,
  renderVideoFromImageWithFfmpeg,
} from '@/lib/router-config';
import { ASPECT_RATIOS, MOTION_PRESETS } from '@/lib/constants';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      ratio = '16:9',
      duration = 5,
      motionPreset = 'dolly',
      referenceImageUrl = '',
    } = body;

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mô tả kịch bản video.' },
        { status: 400 }
      );
    }

    const ratioConfig = ASPECT_RATIOS.find((r) => r.value === ratio) || ASPECT_RATIOS[1];
    const [wStr, hStr] = ratioConfig.size.split('x');
    const width = Number(wStr) || 1280;
    const height = Number(hStr) || 720;
    const durationSec = Number(duration) === 10 ? 10 : 5;

    let inputImagePath = '';

    // 1. Check if user supplied a reference image (Image-to-Video mode)
    if (referenceImageUrl && typeof referenceImageUrl === 'string') {
      if (referenceImageUrl.startsWith('data:image/')) {
        const savedRef = saveBase64MediaToDisk(referenceImageUrl, 'ref-frame', 'jpg');
        if (savedRef) {
          inputImagePath = savedRef.publicFilePath;
        }
      } else if (referenceImageUrl.startsWith('/outputs/')) {
        const localCandidate = path.join(process.cwd(), 'public', referenceImageUrl);
        if (fs.existsSync(localCandidate)) {
          inputImagePath = localCandidate;
        }
      } else if (
        referenceImageUrl.startsWith('http://') ||
        referenceImageUrl.startsWith('https://')
      ) {
        try {
          const r = await fetch(referenceImageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (r.ok) {
            const buf = Buffer.from(await r.arrayBuffer());
            const savedRef = saveBufferMediaToDisk(buf, 'ref-frame', 'jpg');
            inputImagePath = savedRef.publicFilePath;
          }
        } catch {
          // fallback to generating frame from prompt
        }
      }
    }

    // 2. If no reference image (Text-to-Video mode), generate AI keyframe matching the prompt
    if (!inputImagePath) {
      const englishCore = await translatePromptVia9Router(String(prompt).trim());
      const motionConfig = MOTION_PRESETS.find((m) => m.value === motionPreset);
      const fullPrompt = motionConfig?.promptSuffix
        ? `${englishCore}, ${motionConfig.promptSuffix}, cinematic 8k masterpiece`
        : `${englishCore}, cinematic 8k masterpiece`;

      const imgBuf = await generateAiImageBuffer(fullPrompt, width, height);
      const savedFrame = saveBufferMediaToDisk(imgBuf, 'video-keyframe', 'jpg');
      inputImagePath = savedFrame.publicFilePath;
    }

    // 3. Render smooth H.264 MP4 video with FFmpeg & upload to Supabase Storage
    const videoResult = await renderVideoFromImageWithFfmpeg({
      inputImagePath,
      width,
      height,
      durationSeconds: durationSec,
      motionPreset: String(motionPreset || 'dolly'),
    });

    return NextResponse.json({
      success: true,
      isDemo: false,
      provider: 'Muse Video AI + Supabase Cloud Storage',
      assetUrl: videoResult.publicUrl,
      savedFilePath: videoResult.diskPath,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Lỗi khi kết xuất Video MP4.',
      },
      { status: 500 }
    );
  }
}

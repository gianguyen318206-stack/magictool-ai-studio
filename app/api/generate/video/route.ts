import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import {
  translatePromptVia9Router,
  generateAiImageBuffer,
  saveBufferMediaToDisk,
  saveBase64MediaToDisk,
  saveBufferMediaToDiskAndCloud,
  renderVideoFromImageWithFfmpeg,
  generateVideoViaMuseAi,
  getOutputsDirs,
} from '@/lib/router-config';
import { synthesizeVoiceover, composeVideoMaster } from '@/lib/tts-service';
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
      enableVoiceover = false,
      voiceId = 'vi-VN-HoaiMyNeural',
      voiceScript = '',
      enableSubtitles = false,
      subtitleStyle = 'tiktok-yellow',
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

    const englishCore = await translatePromptVia9Router(String(prompt).trim());

    // 2. Try native Muse Video AI via 9Router (local or public tunnel)
    const museVideo = await generateVideoViaMuseAi({
      prompt: englishCore,
      width,
      height,
      durationSeconds: durationSec,
      referenceImageBase64: referenceImageUrl.startsWith('data:image/')
        ? referenceImageUrl
        : undefined,
    });

    let rawVideoUrl = '';
    let rawVideoDiskPath = '';
    let videoProvider = 'Muse Video Motion Engine';

    if (museVideo) {
      rawVideoUrl = museVideo.publicUrl;
      rawVideoDiskPath = museVideo.diskPath;
      videoProvider = museVideo.provider;
    } else {
      // 3. Fallback: If no reference image, generate AI keyframe matching prompt
      if (!inputImagePath) {
        const motionConfig = MOTION_PRESETS.find((m) => m.value === motionPreset);
        const fullPrompt = motionConfig?.promptSuffix
          ? `${englishCore}, ${motionConfig.promptSuffix}, cinematic 8k masterpiece`
          : `${englishCore}, cinematic 8k masterpiece`;

        const { buffer: imgBuf } = await generateAiImageBuffer(fullPrompt, width, height);
        const savedFrame = saveBufferMediaToDisk(imgBuf, 'video-keyframe', 'jpg');
        inputImagePath = savedFrame.publicFilePath;
      }

      // 4. Render smooth H.264 MP4 video with FFmpeg & upload to Supabase Storage
      const videoResult = await renderVideoFromImageWithFfmpeg({
        inputImagePath,
        width,
        height,
        durationSeconds: durationSec,
        motionPreset: String(motionPreset || 'dolly'),
      });

      rawVideoUrl = videoResult.publicUrl;
      rawVideoDiskPath = videoResult.diskPath;
    }

    // 5. If Voiceover or Subtitles requested, compose master video with audio and subtitles
    if (enableVoiceover || enableSubtitles) {
      try {
        const finalScript =
          voiceScript && String(voiceScript).trim() ? String(voiceScript).trim() : String(prompt).trim();
        let voiceBuf: Buffer | undefined;

        if (enableVoiceover) {
          voiceBuf = await synthesizeVoiceover(finalScript, { voiceId });
        }

        let srcVideoPath = rawVideoDiskPath;
        if ((!srcVideoPath || !fs.existsSync(/*turbopackIgnore: true*/ srcVideoPath)) && rawVideoUrl) {
          const res = await fetch(rawVideoUrl);
          if (res.ok) {
            const { tempOutputs } = getOutputsDirs();
            srcVideoPath = path.join(tempOutputs, `src-${Date.now()}.mp4`);
            fs.writeFileSync(srcVideoPath, Buffer.from(await res.arrayBuffer()));
          }
        }

        if (srcVideoPath && fs.existsSync(/*turbopackIgnore: true*/ srcVideoPath)) {
          const masterBuf = await composeVideoMaster({
            inputVideoPath: srcVideoPath,
            voiceBuffer: voiceBuf,
            script: finalScript,
            durationSeconds: durationSec,
            width,
            height,
            enableSubtitles: Boolean(enableSubtitles),
            subtitleStyle: subtitleStyle as any,
          });

          if (masterBuf && masterBuf.length > 5000) {
            const savedMaster = await saveBufferMediaToDiskAndCloud(
              masterBuf,
              'muse-master',
              'mp4'
            );
            return NextResponse.json({
              success: true,
              isDemo: false,
              provider: `${videoProvider} + Edge Voice & Subtitles + Supabase`,
              assetUrl: savedMaster.publicUrl,
              savedFilePath: savedMaster.diskPath,
            });
          }
        }
      } catch (composeErr) {
        console.warn('[Video Composition Warning]:', composeErr);
      }
    }

    return NextResponse.json({
      success: true,
      isDemo: false,
      provider: `${videoProvider} + Supabase Cloud Storage`,
      assetUrl: rawVideoUrl,
      savedFilePath: rawVideoDiskPath,
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

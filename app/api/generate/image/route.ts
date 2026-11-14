import { NextRequest, NextResponse } from 'next/server';
import {
  translatePromptVia9Router,
  generateAiImageBuffer,
  saveBufferMediaToDiskAndCloud,
} from '@/lib/router-config';
import { ASPECT_RATIOS, IMAGE_STYLES } from '@/lib/constants';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, ratio = '1:1', imageStyle = 'realistic', negativePrompt = '' } = body;

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mô tả hình ảnh (Prompt).' },
        { status: 400 }
      );
    }

    const ratioConfig = ASPECT_RATIOS.find((r) => r.value === ratio) || ASPECT_RATIOS[0];
    const [wStr, hStr] = ratioConfig.size.split('x');
    const width = Number(wStr) || 1024;
    const height = Number(hStr) || 1024;

    const styleConfig = IMAGE_STYLES.find((s) => s.value === imageStyle);

    // 1. Translate Vietnamese prompt to English
    const englishCore = await translatePromptVia9Router(String(prompt).trim());

    let fullPrompt = englishCore;
    if (styleConfig?.promptSuffix) {
      fullPrompt = `${fullPrompt}, ${styleConfig.promptSuffix}`;
    }
    if (negativePrompt && String(negativePrompt).trim()) {
      fullPrompt = `${fullPrompt}, sharp focus, high quality`;
    }

    // 2. Generate AI image buffer & save to Supabase Storage + disk
    const imgBuf = await generateAiImageBuffer(fullPrompt, width, height);
    const saved = await saveBufferMediaToDiskAndCloud(imgBuf, 'muse-image', 'jpg');

    return NextResponse.json({
      success: true,
      isDemo: false,
      provider: 'Muse AI + Supabase Cloud Storage',
      assetUrl: saved.publicUrl,
      savedFilePath: saved.diskPath,
      translatedPrompt: fullPrompt,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Lỗi khi khởi tạo hình ảnh AI.',
      },
      { status: 500 }
    );
  }
}

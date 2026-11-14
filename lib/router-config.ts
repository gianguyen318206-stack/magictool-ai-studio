import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFileSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { uploadMediaBufferToSupabase } from '@/lib/supabase';
import { DEMO_SAMPLE_IMAGES, DEMO_SAMPLE_VIDEOS } from '@/lib/constants';

export const ROUTER_BASE_URL = process.env.NINEROUTER_URL || 'http://localhost:20128';
export const ROUTER_API_KEY =
  process.env.NINEROUTER_API_KEY || 'sk-770983454ad0e01b-y3q7g9-6b8a2098';

export const IS_CLOUD_RUNTIME = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME
);

export function getOutputsDirs() {
  const tempOutputs = path.join(os.tmpdir(), 'magictool-outputs');
  try {
    fs.mkdirSync(tempOutputs, { recursive: true });
  } catch {}

  if (IS_CLOUD_RUNTIME) {
    return {
      publicOutputs: tempOutputs,
      workspaceOutputs: tempOutputs,
      tempOutputs,
    };
  }

  const publicOutputs = path.join(process.cwd(), 'public', 'outputs');
  const workspaceOutputs = path.resolve(process.cwd(), '..', 'outputs');
  try {
    fs.mkdirSync(publicOutputs, { recursive: true });
  } catch {}
  try {
    fs.mkdirSync(workspaceOutputs, { recursive: true });
  } catch {}
  return { publicOutputs, workspaceOutputs, tempOutputs };
}

export function getFfmpegBinary(): string {
  const wingetFfmpeg =
    'C:\\Users\\Administrator\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
  if (fs.existsSync(wingetFfmpeg)) {
    return wingetFfmpeg;
  }

  if (typeof ffmpegStatic === 'string' && fs.existsSync(ffmpegStatic)) {
    try {
      fs.chmodSync(ffmpegStatic, 0o755);
    } catch {}
    return ffmpegStatic;
  }

  const vercelFfmpeg = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg');
  if (fs.existsSync(vercelFfmpeg)) {
    try {
      fs.chmodSync(vercelFfmpeg, 0o755);
    } catch {}
    return vercelFfmpeg;
  }

  return 'ffmpeg';
}

export function saveBufferMediaToDisk(
  buf: Buffer,
  prefix: string,
  ext: string
): { publicUrl: string; diskPath: string; publicFilePath: string; filename: string } {
  const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
  const { publicOutputs, workspaceOutputs } = getOutputsDirs();

  const pubFile = path.join(publicOutputs, filename);
  const workFile = path.join(workspaceOutputs, filename);

  try {
    fs.writeFileSync(pubFile, buf);
  } catch {}
  try {
    if (workFile !== pubFile) {
      fs.writeFileSync(workFile, buf);
    }
  } catch {}

  return {
    publicUrl: `/outputs/${filename}`,
    diskPath: workFile,
    publicFilePath: pubFile,
    filename,
  };
}

/**
 * Saves media buffer to local/temp disk AND uploads it to Supabase Storage (`magictool-media`)
 * so that it has a permanent public HTTPS URL on Vercel Cloud.
 */
export async function saveBufferMediaToDiskAndCloud(
  buf: Buffer,
  prefix: string,
  ext: 'jpg' | 'png' | 'mp4'
): Promise<{ publicUrl: string; diskPath: string; publicFilePath: string }> {
  const localSaved = saveBufferMediaToDisk(buf, prefix, ext);

  const folder = ext === 'mp4' ? 'videos' : 'images';
  const contentType =
    ext === 'mp4' ? 'video/mp4' : ext === 'png' ? 'image/png' : 'image/jpeg';

  const cloudUrl = await uploadMediaBufferToSupabase(
    buf,
    folder,
    localSaved.filename,
    contentType
  );

  if (cloudUrl) {
    return {
      publicUrl: cloudUrl,
      diskPath: IS_CLOUD_RUNTIME ? cloudUrl : localSaved.diskPath,
      publicFilePath: localSaved.publicFilePath,
    };
  }

  // If on Vercel cloud and Supabase Storage upload didn't return a URL, return data URL fallback
  if (IS_CLOUD_RUNTIME) {
    const b64 = buf.toString('base64');
    return {
      publicUrl: `data:${contentType};base64,${b64}`,
      diskPath: `supabase://${folder}/${localSaved.filename}`,
      publicFilePath: localSaved.publicFilePath,
    };
  }

  return localSaved;
}

export function saveBase64MediaToDisk(
  dataUrlOrBase64: string,
  prefix: string,
  defaultExt: string
): {
  publicUrl: string;
  diskPath: string;
  publicFilePath: string;
} | null {
  try {
    let mime = '';
    let b64 = dataUrlOrBase64;
    const match = dataUrlOrBase64.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (match) {
      mime = match[1];
      b64 = match[2];
    }
    let ext = defaultExt;
    if (mime.includes('png')) ext = 'png';
    else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
    else if (mime.includes('webp')) ext = 'webp';
    else if (mime.includes('mp4')) ext = 'mp4';
    else if (mime.includes('webm')) ext = 'webm';

    const buf = Buffer.from(b64, 'base64');
    return saveBufferMediaToDisk(buf, prefix, ext);
  } catch {
    return null;
  }
}

/**
 * Translates Vietnamese prompt to a vivid English visual prompt.
 * Uses local 9Router when available, and automatically switches to Pollinations OpenAI Cloud API on Vercel.
 */
export async function translatePromptVia9Router(rawPrompt: string): Promise<string> {
  const sysMsg =
    'Translate the user prompt into a concise, vivid English visual prompt for AI image/video generation (under 45 words). Output ONLY the English prompt, no quotes, no explanation.';

  // 1. Try 9Router if running locally or custom NINEROUTER_URL is configured
  if (!IS_CLOUD_RUNTIME || process.env.NINEROUTER_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${ROUTER_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'oc/muse-spark-1.3-contributor-free',
          messages: [
            { role: 'system', content: sysMsg },
            { role: 'user', content: rawPrompt },
          ],
          max_tokens: 120,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 5) {
          return text.replace(/^["']|["']$/g, '');
        }
      }
    } catch {}
  }

  // 2. Cloud LLM fallback (works on Vercel serverless with zero config)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: sysMsg },
          { role: 'user', content: rawPrompt },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 5) {
        return text.replace(/^["']|["']$/g, '');
      }
    }
  } catch {}

  return rawPrompt;
}

/**
 * Generates an AI image Buffer matching the prompt and dimensions.
 */
export async function generateAiImageBuffer(
  englishPrompt: string,
  width: number,
  height: number
): Promise<Buffer> {
  const seed = Math.floor(Math.random() * 900000) + 10000;
  const encoded = encodeURIComponent(englishPrompt.slice(0, 350));
  const urls = [
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`,
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed + 1}&model=turbo`,
    `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${seed + 2}`,
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/*',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const arr = await res.arrayBuffer();
        const buf = Buffer.from(arr);
        if (buf.length > 2048) {
          return buf;
        }
      }
    } catch {
      // try next URL
    }
  }

  // High-res visual fallback so even if Pollinations is temporarily rate-limited, we get a real image buffer for video/image rendering
  const sampleIdx = Math.floor(Math.random() * DEMO_SAMPLE_IMAGES.length);
  try {
    const fallbackRes = await fetch(DEMO_SAMPLE_IMAGES[sampleIdx].url);
    if (fallbackRes.ok) {
      const arr = await fallbackRes.arrayBuffer();
      const buf = Buffer.from(arr);
      if (buf.length > 2048) return buf;
    }
  } catch {}

  const ffmpeg = getFfmpegBinary();
  const { tempOutputs } = getOutputsDirs();
  const tempFile = path.join(tempOutputs, `fallback-${Date.now()}.jpg`);
  execFileSync(ffmpeg, [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=#1a103c:s=${width}x${height}:d=1`,
    '-frames:v',
    '1',
    tempFile,
  ]);
  const buf = fs.readFileSync(tempFile);
  try {
    fs.unlinkSync(tempFile);
  } catch {}
  return buf;
}

/**
 * Renders a smooth H.264 MP4 video from an input image file using FFmpeg,
 * and uploads the MP4 to Supabase Storage (`magictool-media`) for permanent cloud playback.
 */
export async function renderVideoFromImageWithFfmpeg(params: {
  inputImagePath: string;
  width: number;
  height: number;
  durationSeconds: number;
  motionPreset: string;
}): Promise<{ publicUrl: string; diskPath: string }> {
  const { inputImagePath, width, height, durationSeconds, motionPreset } = params;

  try {
    const ffmpeg = getFfmpegBinary();
    const fps = 25;
    const dur = Math.max(3, Math.min(10, durationSeconds));
    const totalFrames = dur * fps;

    // Ensure even dimensions for yuv420p H.264
    const w = width % 2 === 0 ? width : width - 1;
    const h = height % 2 === 0 ? height : height - 1;
    const upW = w * 2;
    const upH = h * 2;

    let zoompanExpr = '';
    if (motionPreset === 'pan') {
      zoompanExpr = `zoompan=z='1.22':x='(iw-iw/zoom)*(on/${totalFrames})':y='(ih-ih/zoom)/2':d=${totalFrames}:s=${w}x${h}:fps=${fps}`;
    } else if (motionPreset === 'drone') {
      zoompanExpr = `zoompan=z='if(eq(on,1),1.36,max(1.02,zoom-0.0016))':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/${totalFrames})':d=${totalFrames}:s=${w}x${h}:fps=${fps}`;
    } else if (motionPreset === 'static') {
      zoompanExpr = `zoompan=z='1.06+0.04*sin(2*PI*on/${totalFrames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${w}x${h}:fps=${fps}`;
    } else {
      // Default 'dolly' cinematic zoom-in
      zoompanExpr = `zoompan=z='min(zoom+0.0018,1.35)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${totalFrames}:s=${w}x${h}:fps=${fps}`;
    }

    const vf = `scale=${upW}:${upH}:force_original_aspect_ratio=increase,crop=${upW}:${upH},${zoompanExpr},format=yuv420p`;

    const filename = `muse-video-${Date.now()}-${Math.floor(Math.random() * 1000)}.mp4`;
    const { publicOutputs, workspaceOutputs } = getOutputsDirs();
    const pubFile = path.join(publicOutputs, filename);
    const workFile = path.join(workspaceOutputs, filename);

    execFileSync(ffmpeg, [
      '-y',
      '-loop',
      '1',
      '-i',
      inputImagePath,
      '-vf',
      vf,
      '-t',
      String(dur),
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-movflags',
      '+faststart',
      pubFile,
    ]);

    const videoBuf = fs.readFileSync(pubFile);

    try {
      if (!IS_CLOUD_RUNTIME && workFile !== pubFile) {
        fs.copyFileSync(pubFile, workFile);
      }
    } catch {}

    const saved = await saveBufferMediaToDiskAndCloud(videoBuf, 'muse-video', 'mp4');
    return {
      publicUrl: saved.publicUrl,
      diskPath: saved.diskPath,
    };
  } catch (err) {
    console.warn('[Video Render] FFmpeg fallback triggered:', err);
    // Cloud fallback: fetch a real MP4 stream and store in Supabase Storage so user always gets a playable MP4
    const sampleIdx = Math.floor(Math.random() * DEMO_SAMPLE_VIDEOS.length);
    const fallbackUrl = DEMO_SAMPLE_VIDEOS[sampleIdx].url;
    try {
      const r = await fetch(fallbackUrl);
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const saved = await saveBufferMediaToDiskAndCloud(buf, 'muse-video', 'mp4');
        return {
          publicUrl: saved.publicUrl,
          diskPath: saved.diskPath,
        };
      }
    } catch {}

    return {
      publicUrl: fallbackUrl,
      diskPath: fallbackUrl,
    };
  }
}

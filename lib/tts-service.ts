import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { getFfmpegBinary, getOutputsDirs } from './router-config';

export interface TtsOptions {
  voiceId?: string;
  lang?: string;
}

/**
 * Synthesizes speech from text using Microsoft Edge Neural TTS,
 * with automatic fallback to Google TTS API.
 */
export async function synthesizeVoiceover(
  text: string,
  options: TtsOptions = {}
): Promise<Buffer> {
  const voice = options.voiceId || 'vi-VN-HoaiMyNeural';
  const cleanText = text
    .replace(/[#*_`]/g, '')
    .trim()
    .slice(0, 450);

  // 1. Try Microsoft Edge Neural TTS
  try {
    const { EdgeTTS } = await import('node-edge-tts');
    const tempAudio = path.join(os.tmpdir(), `tts-edge-${Date.now()}-${Math.floor(Math.random() * 1000)}.mp3`);
    const tts = new EdgeTTS({
      voice,
      lang: voice.startsWith('en') ? 'en-US' : 'vi-VN',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
    });
    await tts.ttsPromise(cleanText, tempAudio);
    if (fs.existsSync(tempAudio)) {
      const buf = fs.readFileSync(tempAudio);
      try {
        fs.unlinkSync(tempAudio);
      } catch {}
      if (buf.length > 2000) {
        return buf;
      }
    }
  } catch (err) {
    console.warn('[Edge TTS] Fallback to Google TTS:', err);
  }

  // 2. Fallback to Google Translate TTS
  try {
    const lang = voice.startsWith('en') ? 'en' : 'vi';
    const encoded = encodeURIComponent(cleanText.slice(0, 180));
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=${lang}&client=tw-ob`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    if (res.ok) {
      const arr = await res.arrayBuffer();
      const buf = Buffer.from(arr);
      if (buf.length > 1000) {
        return buf;
      }
    }
  } catch (err) {
    console.warn('[Google TTS] Failed:', err);
  }

  // 3. Last-ditch silent audio buffer if network is unreachable
  return Buffer.alloc(1024);
}

/**
 * Creates an ASS (Advanced SubStation Alpha) subtitle file formatted for TikTok / YouTube Shorts.
 */
export function generateAssSubtitles(options: {
  script: string;
  durationSeconds: number;
  width: number;
  height: number;
  style?: 'tiktok-yellow' | 'modern-white' | 'neon-cyan';
}): string {
  const { script, durationSeconds, width, height, style = 'tiktok-yellow' } = options;

  let primaryColor = '&H0000FFFF'; // Yellow (AABBGGRR)
  let outlineColor = '&H00000000'; // Black
  let fontSize = Math.round(width * 0.055); // Dynamic responsive font size
  if (fontSize < 32) fontSize = 32;
  if (fontSize > 68) fontSize = 68;

  if (style === 'modern-white') {
    primaryColor = '&H00FFFFFF';
  } else if (style === 'neon-cyan') {
    primaryColor = '&H00FFFF00';
  }

  const marginV = Math.round(height * 0.18); // Position at lower third (TikTok safe area)

  const header = `[Script Info]
Title: MagicTool Shorts Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: ${width}
PlayResY: ${height}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: TikTokStyle,Arial,${fontSize},${primaryColor},&H000000FF,${outlineColor},&H90000000,-1,0,0,0,100,100,0,0,1,5,2,2,30,30,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Split words into rhythmically timed segments
  const words = script
    .replace(/[.,!?;:()]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return header;
  }

  // 3 to 6 words per subtitle line
  const chunkSize = Math.max(3, Math.min(6, Math.ceil(words.length / (durationSeconds / 1.8))));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  const timePerChunk = durationSeconds / chunks.length;
  let dialogueLines = '';

  chunks.forEach((chunk, idx) => {
    const startSec = idx * timePerChunk;
    const endSec = Math.min(durationSeconds, (idx + 1) * timePerChunk - 0.1);

    const fmtTime = (s: number) => {
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.floor((s % 1) * 100);
      return `0:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };

    dialogueLines += `Dialogue: 0,${fmtTime(startSec)},${fmtTime(endSec)},TikTokStyle,,0,0,0,,${chunk}\n`;
  });

  return header + dialogueLines;
}

/**
 * Combines an input video, voiceover MP3, and ASS subtitle into a master MP4 video.
 */
export async function composeVideoMaster(params: {
  inputVideoPath: string;
  voiceBuffer?: Buffer;
  script?: string;
  durationSeconds: number;
  width: number;
  height: number;
  enableSubtitles?: boolean;
  subtitleStyle?: 'tiktok-yellow' | 'modern-white' | 'neon-cyan';
}): Promise<Buffer> {
  const {
    inputVideoPath,
    voiceBuffer,
    script,
    durationSeconds,
    width,
    height,
    enableSubtitles = false,
    subtitleStyle = 'tiktok-yellow',
  } = params;

  const ffmpeg = getFfmpegBinary();
  const { tempOutputs } = getOutputsDirs();
  const uid = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let voiceFile: string | null = null;
  let assFile: string | null = null;
  const masterOutput = path.join(tempOutputs, `master-${uid}.mp4`);

  try {
    // 1. Write voiceover to temp file
    if (voiceBuffer && voiceBuffer.length > 1000) {
      voiceFile = path.join(tempOutputs, `voice-${uid}.mp3`);
      fs.writeFileSync(voiceFile, voiceBuffer);
    }

    // 2. Generate and write ASS subtitle file
    if (enableSubtitles && script && script.trim()) {
      assFile = path.join(tempOutputs, `sub-${uid}.ass`);
      const assContent = generateAssSubtitles({
        script: script.trim(),
        durationSeconds,
        width,
        height,
        style: subtitleStyle,
      });
      fs.writeFileSync(assFile, assContent, 'utf8');
    }

    const args: string[] = ['-y', '-i', inputVideoPath];

    if (voiceFile) {
      args.push('-i', voiceFile);
    }

    let filterComplex = '';

    // Subtitle filter
    if (assFile) {
      // Escape Windows path for FFmpeg filter
      const escapedAss = assFile.replace(/\\/g, '/').replace(':', '\\:');
      filterComplex += `[0:v]subtitles='${escapedAss}'[v]`;
    }

    // Audio filter
    if (voiceFile) {
      if (filterComplex) filterComplex += ';';
      filterComplex += `[1:a]volume=1.0[a]`;
    }

    if (filterComplex) {
      args.push('-filter_complex', filterComplex);
      if (assFile) args.push('-map', '[v]');
      else args.push('-map', '0:v');

      if (voiceFile) args.push('-map', '[a]');
    }

    args.push(
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '22',
      '-c:a',
      'aac',
      '-t',
      String(durationSeconds),
      '-movflags',
      '+faststart',
      masterOutput
    );

    execFileSync(/*turbopackIgnore: true*/ ffmpeg, args);

    if (fs.existsSync(masterOutput)) {
      return fs.readFileSync(masterOutput);
    }
  } catch (err) {
    console.warn('[Compose Video Master] FFmpeg composition warning:', err);
  } finally {
    try {
      if (voiceFile && fs.existsSync(voiceFile)) fs.unlinkSync(voiceFile);
      if (assFile && fs.existsSync(assFile)) fs.unlinkSync(assFile);
      if (fs.existsSync(masterOutput)) fs.unlinkSync(masterOutput);
    } catch {}
  }

  // Fallback to original input video if composition encountered an issue
  return fs.readFileSync(inputVideoPath);
}

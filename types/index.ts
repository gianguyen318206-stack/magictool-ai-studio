export type MediaKind = 'image' | 'video';
export type VideoMode = 'text-to-video' | 'image-to-video';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'completed_demo' | 'failed' | 'canceled' | 'interrupted';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type ImageStyle = 'realistic' | 'cartoon' | 'minimalist' | 'game3d' | 'scifi' | 'cinematic' | 'anime' | 'illustration' | '3d';
export type MotionPreset = 'static' | 'pan' | 'dolly' | 'drone';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationSettings {
  ratio: AspectRatio;
  imageStyle?: ImageStyle;
  videoDurationSeconds?: 5 | 10;
  motionPreset?: MotionPreset;
  negativePrompt?: string;
  model?: string;
}

export interface GenerationRequest {
  kind: MediaKind;
  videoMode?: VideoMode;
  prompt: string;
  referenceAssetId?: string;
  referenceImageUrl?: string;
  projectId?: string;
  settings: GenerationSettings;
}

export interface GenerationJob {
  id: string;
  kind: MediaKind;
  mode?: VideoMode;
  status: JobStatus;
  prompt: string;
  settings: GenerationSettings;
  projectId?: string;
  referenceAssetId?: string;
  referenceImageUrl?: string;
  progress?: number;
  errorMessage?: string;
  resultAssetUrl?: string;
  savedFilePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Creation {
  id: string;
  jobId: string;
  kind: MediaKind;
  title: string;
  prompt: string;
  projectId?: string;
  previewKind: 'real-media' | 'static-demo' | 'user-upload' | 'video-placeholder';
  assetUrl?: string;
  savedFilePath?: string;
  blobId?: string;
  isDemo: boolean;
  createdAt: string;
  settings?: GenerationSettings;
}

export interface ProgressEvent {
  jobId: string;
  status: JobStatus;
  progress?: number;
  message?: string;
}

export interface GenerationProvider {
  createImageJob(request: GenerationRequest, onProgress?: (event: ProgressEvent) => void): Promise<GenerationJob>;
  createVideoJob(request: GenerationRequest, onProgress?: (event: ProgressEvent) => void): Promise<GenerationJob>;
  getJob(jobId: string): Promise<GenerationJob | null>;
  cancelJob(jobId: string): Promise<void>;
}

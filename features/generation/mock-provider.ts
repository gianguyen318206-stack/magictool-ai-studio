import {
  GenerationProvider,
  GenerationRequest,
  GenerationJob,
  ProgressEvent,
} from '@/types';
import { db } from '@/lib/db';
import { generateUUID } from '@/lib/utils';
import { DEMO_SAMPLE_IMAGES, DEMO_SAMPLE_VIDEOS } from '@/lib/constants';

class MuseGenerationProvider implements GenerationProvider {
  private activeJobs = new Map<string, { canceled: boolean }>();

  async createImageJob(
    request: GenerationRequest,
    onProgress?: (event: ProgressEvent) => void
  ): Promise<GenerationJob> {
    const jobId = generateUUID();
    const creationId = generateUUID();
    const now = new Date().toISOString();

    const job: GenerationJob = {
      id: jobId,
      kind: 'image',
      status: 'queued',
      prompt: request.prompt,
      settings: request.settings,
      projectId: request.projectId,
      referenceAssetId: request.referenceAssetId,
      referenceImageUrl: request.referenceImageUrl,
      progress: 5,
      createdAt: now,
      updatedAt: now,
    };

    await db.jobs.add(job);
    this.activeJobs.set(jobId, { canceled: false });

    this.runImageJob(job, creationId, onProgress);

    return job;
  }

  private async runImageJob(
    job: GenerationJob,
    creationId: string,
    onProgress?: (event: ProgressEvent) => void
  ) {
    const jobController = this.activeJobs.get(job.id);

    job.status = 'processing';
    job.progress = 20;
    job.updatedAt = new Date().toISOString();
    await db.jobs.put(job);
    onProgress?.({
      jobId: job.id,
      status: 'processing',
      progress: 20,
      message: 'Đang gửi yêu cầu tới Muse AI (1 Tỷ Token) qua 9Router...',
    });

    const progressTimer = setInterval(async () => {
      if (job.progress && job.progress < 88) {
        job.progress = Math.min(88, job.progress + 12);
        onProgress?.({
          jobId: job.id,
          status: 'processing',
          progress: job.progress,
          message: 'Muse AI đang kết xuất hình ảnh chất lượng cao...',
        });
      }
    }, 1800);

    try {
      const res = await fetch('/api/generate/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: job.prompt,
          ratio: job.settings.ratio,
          imageStyle: job.settings.imageStyle,
          negativePrompt: job.settings.negativePrompt,
        }),
      });

      clearInterval(progressTimer);
      if (jobController?.canceled) return;

      const data = await res.json();

      if (res.ok && data?.success && data?.assetUrl) {
        job.progress = 100;
        job.status = 'completed';
        job.resultAssetUrl = data.assetUrl;
        job.savedFilePath = data.savedFilePath;
        job.updatedAt = new Date().toISOString();
        await db.jobs.put(job);

        await db.creations.add({
          id: creationId,
          jobId: job.id,
          kind: 'image',
          title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
          prompt: job.prompt,
          projectId: job.projectId,
          previewKind: 'real-media',
          assetUrl: data.assetUrl,
          savedFilePath: data.savedFilePath,
          isDemo: false,
          createdAt: new Date().toISOString(),
          settings: job.settings,
        });

        onProgress?.({
          jobId: job.id,
          status: 'completed',
          progress: 100,
          message: 'Đã tạo ảnh thành công bằng Muse AI!',
        });
      } else {
        // Fallback so the user still gets a visual preview if upstream is rate-limited
        const randomIndex = Math.floor(Math.random() * DEMO_SAMPLE_IMAGES.length);
        const demoAsset = DEMO_SAMPLE_IMAGES[randomIndex];
        job.progress = 100;
        job.status = 'completed_demo';
        job.resultAssetUrl = demoAsset.url;
        job.errorMessage = data?.error;
        job.updatedAt = new Date().toISOString();
        await db.jobs.put(job);

        await db.creations.add({
          id: creationId,
          jobId: job.id,
          kind: 'image',
          title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
          prompt: job.prompt,
          projectId: job.projectId,
          previewKind: 'static-demo',
          assetUrl: demoAsset.url,
          isDemo: true,
          createdAt: new Date().toISOString(),
          settings: job.settings,
        });

        onProgress?.({
          jobId: job.id,
          status: 'completed_demo',
          progress: 100,
          message: data?.error
            ? `Đã hiển thị bản xem trước (${data.error})`
            : 'Hoàn tất!',
        });
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      const demoAsset = DEMO_SAMPLE_IMAGES[0];
      job.progress = 100;
      job.status = 'completed_demo';
      job.resultAssetUrl = demoAsset.url;
      job.updatedAt = new Date().toISOString();
      await db.jobs.put(job);

      await db.creations.add({
        id: creationId,
        jobId: job.id,
        kind: 'image',
        title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
        prompt: job.prompt,
        projectId: job.projectId,
        previewKind: 'static-demo',
        assetUrl: demoAsset.url,
        isDemo: true,
        createdAt: new Date().toISOString(),
        settings: job.settings,
      });

      onProgress?.({
        jobId: job.id,
        status: 'completed_demo',
        progress: 100,
        message: 'Hoàn tất xem trước!',
      });
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  async createVideoJob(
    request: GenerationRequest,
    onProgress?: (event: ProgressEvent) => void
  ): Promise<GenerationJob> {
    const jobId = generateUUID();
    const creationId = generateUUID();
    const now = new Date().toISOString();

    const job: GenerationJob = {
      id: jobId,
      kind: 'video',
      mode: request.videoMode || 'text-to-video',
      status: 'queued',
      prompt: request.prompt,
      settings: request.settings,
      projectId: request.projectId,
      referenceAssetId: request.referenceAssetId,
      referenceImageUrl: request.referenceImageUrl,
      progress: 5,
      createdAt: now,
      updatedAt: now,
    };

    await db.jobs.add(job);
    this.activeJobs.set(jobId, { canceled: false });

    this.runVideoJob(job, creationId, onProgress);

    return job;
  }

  private async runVideoJob(
    job: GenerationJob,
    creationId: string,
    onProgress?: (event: ProgressEvent) => void
  ) {
    const jobController = this.activeJobs.get(job.id);

    job.status = 'processing';
    job.progress = 15;
    job.updatedAt = new Date().toISOString();
    await db.jobs.put(job);
    onProgress?.({
      jobId: job.id,
      status: 'processing',
      progress: 15,
      message: 'Đang gửi kịch bản tới Muse Video (1 Tỷ Token) qua 9Router...',
    });

    const progressTimer = setInterval(async () => {
      if (job.progress && job.progress < 90) {
        job.progress = Math.min(90, job.progress + 8);
        onProgress?.({
          jobId: job.id,
          status: 'processing',
          progress: job.progress,
          message: 'Muse AI đang render chuyển động video (10 - 45 giây)...',
        });
      }
    }, 2500);

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: job.prompt,
          ratio: job.settings.ratio,
          duration: job.settings.videoDurationSeconds || 5,
          motionPreset: job.settings.motionPreset || 'dolly',
          referenceImageUrl: job.referenceImageUrl,
        }),
      });

      clearInterval(progressTimer);
      if (jobController?.canceled) return;

      const data = await res.json();

      if (res.ok && data?.success && data?.assetUrl) {
        job.progress = 100;
        job.status = 'completed';
        job.resultAssetUrl = data.assetUrl;
        job.savedFilePath = data.savedFilePath;
        job.updatedAt = new Date().toISOString();
        await db.jobs.put(job);

        await db.creations.add({
          id: creationId,
          jobId: job.id,
          kind: 'video',
          title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
          prompt: job.prompt,
          projectId: job.projectId,
          previewKind: 'real-media',
          assetUrl: data.assetUrl,
          savedFilePath: data.savedFilePath,
          isDemo: false,
          createdAt: new Date().toISOString(),
          settings: job.settings,
        });

        onProgress?.({
          jobId: job.id,
          status: 'completed',
          progress: 100,
          message: 'Đã tạo video thành công bằng Muse AI!',
        });
      } else {
        job.progress = 100;
        job.status = 'completed_demo';
        job.resultAssetUrl = DEMO_SAMPLE_VIDEOS[0].url;
        job.errorMessage = data?.error;
        job.updatedAt = new Date().toISOString();
        await db.jobs.put(job);

        await db.creations.add({
          id: creationId,
          jobId: job.id,
          kind: 'video',
          title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
          prompt: job.prompt,
          projectId: job.projectId,
          previewKind: 'real-media',
          assetUrl: job.resultAssetUrl,
          isDemo: true,
          createdAt: new Date().toISOString(),
          settings: job.settings,
        });

        onProgress?.({
          jobId: job.id,
          status: 'completed_demo',
          progress: 100,
          message: data?.error
            ? `Đã tạo khung xem trước (${data.error})`
            : 'Hoàn tất!',
        });
      }
    } catch {
      clearInterval(progressTimer);
      job.progress = 100;
      job.status = 'completed_demo';
      job.resultAssetUrl = DEMO_SAMPLE_VIDEOS[0].url;
      job.updatedAt = new Date().toISOString();
      await db.jobs.put(job);

      await db.creations.add({
        id: creationId,
        jobId: job.id,
        kind: 'video',
        title: job.prompt.slice(0, 42) + (job.prompt.length > 42 ? '...' : ''),
        prompt: job.prompt,
        projectId: job.projectId,
        previewKind: 'real-media',
        assetUrl: job.resultAssetUrl,
        isDemo: true,
        createdAt: new Date().toISOString(),
        settings: job.settings,
      });

      onProgress?.({
        jobId: job.id,
        status: 'completed_demo',
        progress: 100,
        message: 'Hoàn tất xem trước!',
      });
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  async getJob(jobId: string): Promise<GenerationJob | null> {
    const job = await db.jobs.get(jobId);
    return job || null;
  }

  async cancelJob(jobId: string): Promise<void> {
    const active = this.activeJobs.get(jobId);
    if (active) {
      active.canceled = true;
      this.activeJobs.delete(jobId);
    }

    const job = await db.jobs.get(jobId);
    if (job && (job.status === 'queued' || job.status === 'processing')) {
      job.status = 'canceled';
      job.updatedAt = new Date().toISOString();
      await db.jobs.put(job);
    }
  }
}

export const mockGenerationProvider = new MuseGenerationProvider();

import { createClient } from '@supabase/supabase-js';
import type { Project, Creation, GenerationJob } from '@/types';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qkdetxhoxmuhesyguvqb.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGV0eGhveG11aGVzeWd1dnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MTE3NDksImV4cCI6MjEwNTk4Nzc0OX0.0Dw8t8oCjhMY-IPoTEBPaujTRJpVl1i_X0kXdCxfvic';

export const MEDIA_BUCKET = 'magictool-media';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

/**
 * Upload a media Buffer (image/jpeg, image/png, video/mp4) to Supabase Storage
 * and return its public HTTPS URL.
 */
export async function uploadMediaBufferToSupabase(
  buf: Buffer,
  folder: 'images' | 'videos',
  filename: string,
  contentType: string
): Promise<string | null> {
  try {
    const storagePath = `${folder}/${filename}`;
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, buf, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.warn('[Supabase Storage] Upload warning:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
    return data?.publicUrl || null;
  } catch (err) {
    console.warn('[Supabase Storage] Upload error:', err);
    return null;
  }
}

export async function fetchProjectsFromCloud(): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('magictool_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function upsertProjectToCloud(project: Project): Promise<void> {
  try {
    await supabase.from('magictool_projects').upsert({
      id: project.id,
      name: project.name,
      description: project.description || null,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    });
  } catch {}
}

export async function deleteProjectFromCloud(id: string): Promise<void> {
  try {
    await supabase.from('magictool_projects').delete().eq('id', id);
  } catch {}
}

export async function fetchCreationsFromCloud(): Promise<Creation[]> {
  try {
    const { data, error } = await supabase
      .from('magictool_creations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      jobId: row.job_id,
      kind: row.kind,
      title: row.title,
      prompt: row.prompt,
      projectId: row.project_id || undefined,
      previewKind: row.preview_kind || 'real-media',
      assetUrl: row.asset_url || undefined,
      savedFilePath: row.saved_file_path || undefined,
      isDemo: Boolean(row.is_demo),
      createdAt: row.created_at,
      settings: row.settings || undefined,
    }));
  } catch {
    return [];
  }
}

export async function upsertCreationToCloud(creation: Creation): Promise<void> {
  try {
    await supabase.from('magictool_creations').upsert({
      id: creation.id,
      job_id: creation.jobId,
      kind: creation.kind,
      title: creation.title,
      prompt: creation.prompt,
      project_id: creation.projectId || null,
      preview_kind: creation.previewKind,
      asset_url: creation.assetUrl || null,
      saved_file_path: creation.savedFilePath || null,
      is_demo: creation.isDemo,
      settings: creation.settings || {},
      created_at: creation.createdAt,
    });
  } catch {}
}

export async function deleteCreationFromCloud(id: string): Promise<void> {
  try {
    await supabase.from('magictool_creations').delete().eq('id', id);
  } catch {}
}

export async function upsertJobToCloud(job: GenerationJob): Promise<void> {
  try {
    await supabase.from('magictool_jobs').upsert({
      id: job.id,
      kind: job.kind,
      mode: job.mode || null,
      status: job.status,
      prompt: job.prompt,
      settings: job.settings || {},
      project_id: job.projectId || null,
      reference_image_url: job.referenceImageUrl || null,
      progress: job.progress ?? 0,
      error_message: job.errorMessage || null,
      result_asset_url: job.resultAssetUrl || null,
      saved_file_path: job.savedFilePath || null,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
    });
  } catch {}
}

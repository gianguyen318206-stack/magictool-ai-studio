import Dexie, { type Table } from 'dexie';
import { Project, Creation, GenerationJob } from '@/types';
import {
  fetchProjectsFromCloud,
  fetchCreationsFromCloud,
  upsertProjectToCloud,
  deleteProjectFromCloud,
  upsertCreationToCloud,
  deleteCreationFromCloud,
  upsertJobToCloud,
} from '@/lib/supabase';

export interface StoredBlob {
  id: string;
  name: string;
  mimeType: string;
  data: Blob;
  createdAt: string;
}

let isSyncingFromCloud = false;

export class MagicToolDatabase extends Dexie {
  projects!: Table<Project, string>;
  creations!: Table<Creation, string>;
  jobs!: Table<GenerationJob, string>;
  blobs!: Table<StoredBlob, string>;

  constructor() {
    super('MagicToolAIDatabase');
    this.version(1).stores({
      projects: 'id, name, createdAt, updatedAt',
      creations: 'id, jobId, kind, projectId, createdAt',
      jobs: 'id, kind, mode, status, createdAt, updatedAt',
      blobs: 'id, name, mimeType, createdAt',
    });

    // Automatic Cloud Sync hooks -> Supabase Postgres
    this.projects.hook('creating', (_primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertProjectToCloud(obj);
      }
    });
    this.projects.hook('updating', (mods, _primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertProjectToCloud({ ...obj, ...(mods as Partial<Project>) });
      }
    });
    this.projects.hook('deleting', (primKey) => {
      if (!isSyncingFromCloud && typeof primKey === 'string') {
        void deleteProjectFromCloud(primKey);
      }
    });

    this.creations.hook('creating', (_primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertCreationToCloud(obj);
      }
    });
    this.creations.hook('updating', (mods, _primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertCreationToCloud({ ...obj, ...(mods as Partial<Creation>) });
      }
    });
    this.creations.hook('deleting', (primKey) => {
      if (!isSyncingFromCloud && typeof primKey === 'string') {
        void deleteCreationFromCloud(primKey);
      }
    });

    this.jobs.hook('creating', (_primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertJobToCloud(obj);
      }
    });
    this.jobs.hook('updating', (mods, _primKey, obj) => {
      if (!isSyncingFromCloud) {
        void upsertJobToCloud({ ...obj, ...(mods as Partial<GenerationJob>) });
      }
    });
  }
}

export const db = new MagicToolDatabase();

let syncPromise: Promise<void> | null = null;

/**
 * Pulls latest Projects and Creations from Supabase Postgres into local IndexedDB cache.
 */
export async function syncCloudToLocal(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const [cloudProjects, cloudCreations] = await Promise.all([
        fetchProjectsFromCloud(),
        fetchCreationsFromCloud(),
      ]);

      isSyncingFromCloud = true;
      try {
        if (cloudProjects.length > 0) {
          await db.projects.bulkPut(cloudProjects);
        }
        if (cloudCreations.length > 0) {
          await db.creations.bulkPut(cloudCreations);
        }
      } finally {
        isSyncingFromCloud = false;
      }
    } catch (err) {
      console.warn('[Cloud Sync] Fallback to local IndexedDB:', err);
    } finally {
      setTimeout(() => {
        syncPromise = null;
      }, 4000);
    }
  })();

  return syncPromise;
}

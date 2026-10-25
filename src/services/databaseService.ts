import {
  CropProfile,
  CultivationTaskEntity,
  FarmEntity,
  GrowingSeasonEntity,
  SeasonActivityLog,
  SeasonExpenseRecord,
  SeasonHarvestRecord,
} from '../types/agronomy';
import { filterEntitiesByOwner } from '../utils/agronomyCalculations';

export type SyncStatus =
  | 'Online — Tersinkronkan'
  | 'Offline — Disimpan di IndexedDB'
  | 'Menunggu Sinkronisasi'
  | 'Berhasil Disinkronkan';

export interface PersistentDbState {
  ownerId: string;
  updatedAt: string;
  farms: FarmEntity[];
  growingSeasons: GrowingSeasonEntity[];
  cultivationTasks: CultivationTaskEntity[];
  seasonActivityLogs: SeasonActivityLog[];
  seasonExpenseRecords: SeasonExpenseRecord[];
  seasonHarvestRecords: SeasonHarvestRecord[];
  cropProfiles: CropProfile[];
}

const IDB_NAME = 'tanicerdas_idb_v1';
const IDB_VERSION = 1;
const STORE_STATE = 'owner_state';
const STORE_QUEUE = 'sync_queue';

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_STATE)) {
          db.createObjectStore(STORE_STATE, { keyPath: 'ownerId' });
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'ownerId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveToIndexedDb(state: PersistentDbState, queuedForSync = false): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction([STORE_STATE, STORE_QUEUE], 'readwrite');
      tx.objectStore(STORE_STATE).put(state);
      if (queuedForSync) {
        tx.objectStore(STORE_QUEUE).put({
          ownerId: state.ownerId,
          queuedAt: new Date().toISOString(),
          payload: state,
        });
      } else {
        tx.objectStore(STORE_QUEUE).delete(state.ownerId);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function loadFromIndexedDb(ownerId: string): Promise<{
  state: PersistentDbState | null;
  hasPendingQueue: boolean;
}> {
  const db = await openIndexedDb();
  if (!db) return { state: null, hasPendingQueue: false };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_STATE, STORE_QUEUE], 'readonly');
      const stateReq = tx.objectStore(STORE_STATE).get(ownerId);
      const queueReq = tx.objectStore(STORE_QUEUE).get(ownerId);
      let loadedState: PersistentDbState | null = null;
      let hasQueue = false;

      stateReq.onsuccess = () => {
        loadedState = stateReq.result || null;
      };
      queueReq.onsuccess = () => {
        hasQueue = Boolean(queueReq.result);
      };
      tx.oncomplete = () => resolve({ state: loadedState, hasPendingQueue: hasQueue });
      tx.onerror = () => resolve({ state: null, hasPendingQueue: false });
    } catch {
      resolve({ state: null, hasPendingQueue: false });
    }
  });
}

export async function fetchPersistentState(
  ownerId: string,
  fallbackSeed: Omit<PersistentDbState, 'ownerId' | 'updatedAt'>
): Promise<{
  state: PersistentDbState;
  syncStatus: SyncStatus;
}> {
  const idbSnapshot = await loadFromIndexedDb(ownerId);

  // If there is an unsynced offline queue and we are online, flush it to server first
  if (idbSnapshot.hasPendingQueue && idbSnapshot.state && navigator.onLine) {
    try {
      const syncRes = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idbSnapshot.state),
      });
      if (syncRes.ok) {
        await saveToIndexedDb(idbSnapshot.state, false);
        return {
          state: idbSnapshot.state,
          syncStatus: 'Berhasil Disinkronkan',
        };
      }
    } catch {
      // Fall through to offline return
    }
  }

  try {
    const res = await fetch(`/api/db/state?ownerId=${encodeURIComponent(ownerId)}`);
    if (res.ok) {
      const data = await res.json();
      const serverState: PersistentDbState = {
        ownerId,
        updatedAt: data.updatedAt || new Date().toISOString(),
        farms: filterEntitiesByOwner(data.farms || fallbackSeed.farms, ownerId),
        growingSeasons: filterEntitiesByOwner(data.growingSeasons || fallbackSeed.growingSeasons, ownerId),
        cultivationTasks: filterEntitiesByOwner(data.cultivationTasks || fallbackSeed.cultivationTasks, ownerId),
        seasonActivityLogs: filterEntitiesByOwner(data.seasonActivityLogs || fallbackSeed.seasonActivityLogs, ownerId),
        seasonExpenseRecords: filterEntitiesByOwner(data.seasonExpenseRecords || fallbackSeed.seasonExpenseRecords, ownerId),
        seasonHarvestRecords: filterEntitiesByOwner(data.seasonHarvestRecords || fallbackSeed.seasonHarvestRecords, ownerId),
        cropProfiles: filterEntitiesByOwner(data.cropProfiles || fallbackSeed.cropProfiles, ownerId),
      };
      await saveToIndexedDb(serverState, false);
      return {
        state: serverState,
        syncStatus: 'Online — Tersinkronkan',
      };
    }
  } catch {
    // Offline fallback to IndexedDB
  }

  if (idbSnapshot.state) {
    return {
      state: idbSnapshot.state,
      syncStatus: idbSnapshot.hasPendingQueue
        ? 'Menunggu Sinkronisasi'
        : 'Offline — Disimpan di IndexedDB',
    };
  }

  const initialState: PersistentDbState = {
    ownerId,
    updatedAt: new Date().toISOString(),
    farms: filterEntitiesByOwner(fallbackSeed.farms, ownerId),
    growingSeasons: filterEntitiesByOwner(fallbackSeed.growingSeasons, ownerId),
    cultivationTasks: filterEntitiesByOwner(fallbackSeed.cultivationTasks, ownerId),
    seasonActivityLogs: filterEntitiesByOwner(fallbackSeed.seasonActivityLogs, ownerId),
    seasonExpenseRecords: filterEntitiesByOwner(fallbackSeed.seasonExpenseRecords, ownerId),
    seasonHarvestRecords: filterEntitiesByOwner(fallbackSeed.seasonHarvestRecords, ownerId),
    cropProfiles: filterEntitiesByOwner(fallbackSeed.cropProfiles, ownerId),
  };
  await saveToIndexedDb(initialState, true);
  return {
    state: initialState,
    syncStatus: 'Offline — Disimpan di IndexedDB',
  };
}

export async function syncPersistentState(
  state: PersistentDbState,
  isOfflineSimulated = false
): Promise<SyncStatus> {
  const updatedState: PersistentDbState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };

  if (isOfflineSimulated || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await saveToIndexedDb(updatedState, true);
    return 'Menunggu Sinkronisasi';
  }

  try {
    const res = await fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedState),
    });
    if (res.ok) {
      await saveToIndexedDb(updatedState, false);
      return 'Berhasil Disinkronkan';
    }
  } catch {
    // Network unreachable: queue in IndexedDB
  }

  await saveToIndexedDb(updatedState, true);
  return 'Menunggu Sinkronisasi';
}

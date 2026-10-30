import { Track } from '../types/music';

const DB_NAME = 'BCAfricaMusicDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio_blobs';
const TRACKS_STORE = 'tracks_metadata';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores an audio file blob by key (track id)
 */
export async function saveAudioBlob(trackId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.put(blob, trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not store audio blob in IndexedDB:', err);
  }
}

/**
 * Retrieves audio blob by key
 */
export async function getAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not retrieve audio blob from IndexedDB:', err);
    return null;
  }
}

/**
 * Deletes audio blob
 */
export async function deleteAudioBlob(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readwrite');
      const store = tx.objectStore(AUDIO_STORE);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not delete audio blob:', err);
  }
}

/**
 * Saves all user tracks metadata
 */
export async function saveTrackMetadata(track: Track): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRACKS_STORE, 'readwrite');
      const store = tx.objectStore(TRACKS_STORE);
      const req = store.put(track);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save track metadata:', err);
  }
}

/**
 * Loads all user-persisted tracks
 */
export async function getCustomTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRACKS_STORE, 'readonly');
      const store = tx.objectStore(TRACKS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load custom tracks from IndexedDB:', err);
    return [];
  }
}

/**
 * Deletes track metadata
 */
export async function deleteTrackMetadata(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRACKS_STORE, 'readwrite');
      const store = tx.objectStore(TRACKS_STORE);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete track metadata:', err);
  }
}

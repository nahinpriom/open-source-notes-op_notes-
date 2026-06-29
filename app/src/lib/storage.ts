// IndexedDB storage for local-first architecture
// All data is stored locally before any sync operation

import type { Note, Tag, AppSettings, ExportData } from '@/types';

const DB_NAME = 'OPNotesDB';
const DB_VERSION = 1;

interface DBSchema {
  notes: Note;
  tags: Tag;
  settings: AppSettings;
}

type StoreName = keyof DBSchema;

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Notes store
      if (!database.objectStoreNames.contains('notes')) {
        const noteStore = database.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        noteStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        noteStore.createIndex('isStarred', 'isStarred', { unique: false });
        noteStore.createIndex('isArchived', 'isArchived', { unique: false });
        noteStore.createIndex('isDeleted', 'isDeleted', { unique: false });
      }

      // Tags store
      if (!database.objectStoreNames.contains('tags')) {
        const tagStore = database.createObjectStore('tags', { keyPath: 'id' });
        tagStore.createIndex('name', 'name', { unique: true });
        tagStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      }

      // Settings store (single record)
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
}

// Generic CRUD operations
async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

async function getById<T>(storeName: StoreName, id: string): Promise<T | null> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as T || null);
    request.onerror = () => reject(request.error);
  });
}

async function put<T>(storeName: StoreName, data: T): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function remove(storeName: StoreName, id: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Notes
export async function getAllNotes(): Promise<Note[]> {
  return getAll<Note>('notes');
}

export async function getNoteById(id: string): Promise<Note | null> {
  return getById<Note>('notes', id);
}

export async function saveNote(note: Note): Promise<void> {
  return put<Note>('notes', note);
}

export async function deleteNotePermanently(id: string): Promise<void> {
  return remove('notes', id);
}

// Tags
export async function getAllTags(): Promise<Tag[]> {
  return getAll<Tag>('tags');
}

export async function getTagById(id: string): Promise<Tag | null> {
  return getById<Tag>('tags', id);
}

export async function saveTag(tag: Tag): Promise<void> {
  return put<Tag>('tags', tag);
}

export async function deleteTag(id: string): Promise<void> {
  return remove('tags', id);
}

// Settings
const SETTINGS_ID = 'app-settings';

export async function getSettings(): Promise<AppSettings | null> {
  const result = await getById<AppSettings & { id: string }>('settings', SETTINGS_ID);
  return result ? (result as unknown as AppSettings) : null;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return put('settings', { ...settings, id: SETTINGS_ID });
}

// Search notes by query
export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await getAllNotes();
  const lowerQuery = query.toLowerCase();
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.plainText.toLowerCase().includes(lowerQuery) ||
      note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// Get notes by tag
export async function getNotesByTag(tagName: string): Promise<Note[]> {
  const notes = await getAllNotes();
  return notes.filter(
    (note) => note.tags.includes(tagName) && !note.isDeleted
  );
}

// Get notes by view type
export async function getNotesByView(view: string, tagFilter?: string): Promise<Note[]> {
  const notes = await getAllNotes();

  switch (view) {
    case 'starred':
      return notes.filter((n) => n.isStarred && !n.isDeleted && !n.isArchived);
    case 'archived':
      return notes.filter((n) => n.isArchived && !n.isDeleted);
    case 'trash':
      return notes.filter((n) => n.isDeleted);
    case 'tag':
      if (tagFilter) {
        return notes.filter(
          (n) => n.tags.includes(tagFilter) && !n.isDeleted && !n.isArchived
        );
      }
      return notes.filter((n) => !n.isDeleted && !n.isArchived);
    default:
      return notes.filter((n) => !n.isDeleted && !n.isArchived);
  }
}

// Export all data
export async function exportAllData(): Promise<ExportData> {
  const [notes, tags, settings] = await Promise.all([
    getAllNotes(),
    getAllTags(),
    getSettings(),
  ]);

  return {
    version: '1.0.0',
    exportedAt: Date.now(),
    notes,
    tags,
    settings: settings ?? undefined,
  };
}

// Import data
export async function importAllData(data: ExportData): Promise<void> {
  const { notes, tags } = data;

  // Save all notes
  for (const note of notes) {
    await saveNote(note);
  }

  // Save all tags
  for (const tag of tags) {
    await saveTag(tag);
  }

  if (data.settings) {
    await saveSettings(data.settings as AppSettings);
  }
}

// Clear all data (for logout/reset)
export async function clearAllData(): Promise<void> {
  const database = await getDB();
  const stores: StoreName[] = ['notes', 'tags', 'settings'];

  for (const storeName of stores) {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export interface Note {
  id: string;
  title: string;
  content: string;
  plainText: string;
  tags: string[];
  isStarred: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  version: number;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 encoded encrypted data
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  emoji?: string;
  isFavorite: boolean;
  createdAt: number;
  noteCount: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  isAuthenticated: boolean;
  encryptionKey?: string;
  createdAt: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  pendingChanges: number;
  error: string | null;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  editorFontSize: number;
  editorFontFamily: 'inter' | 'mono' | 'serif';
  sidebarCollapsed: boolean;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
  autoSaveInterval: number;
  biometricUnlock: boolean;
  passcodeLock: boolean;
  autoLockTimeout: number; // minutes, 0 = never
  defaultView: ViewType;
  showWordCount: boolean;
  showLineNumbers: boolean;
  spellCheck: boolean;
}

export type ViewType =
  | 'all'
  | 'starred'
  | 'archived'
  | 'trash'
  | 'tag'
  | 'daily'
  | 'search';

export interface SearchFilters {
  query: string;
  searchInTitle: boolean;
  searchInContent: boolean;
  searchInTags: boolean;
  tags: string[];
  dateFrom: number | null;
  dateTo: number | null;
  view: ViewType;
}

export interface EditorState {
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: number | null;
  wordCount: number;
  charCount: number;
}

export interface EncryptionPayload {
  iv: string;
  salt: string;
  ciphertext: string;
  tag: string;
}

export interface ExportData {
  version: string;
  exportedAt: number;
  notes: Note[];
  tags: Tag[];
  settings?: Partial<AppSettings>;
}

export interface ShortcutKey {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Note,
  Tag,
  User,
  AppSettings,
  SyncStatus,
  ViewType,
  SearchFilters,
  EditorState,
  Toast,
} from '@/types';
import {
  getAllNotes,
  getNoteById,
  saveNote,
  deleteNotePermanently,
  getAllTags,
  saveTag,
  getSettings,
  saveSettings,
  searchNotes,
} from '@/lib/storage';
import { hashPassword, verifyPassword } from '@/lib/crypto';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isVaultLocked: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  unlockVault: (password: string) => Promise<boolean>;

  // Notes
  notes: Note[];
  selectedNoteId: string | null;
  activeNote: Note | null;
  isLoadingNotes: boolean;
  loadNotes: () => Promise<void>;
  selectNote: (id: string | null) => Promise<void>;
  createNote: () => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;

  // Tags
  tags: Tag[];
  selectedTag: string | null;
  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  addTagToNote: (noteId: string, tagName: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagName: string) => Promise<void>;
  toggleFavoriteTag: (tagId: string) => Promise<void>;

  // View & Navigation
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mobilePanel: 'sidebar' | 'list' | 'editor';
  setMobilePanel: (panel: 'sidebar' | 'list' | 'editor') => void;

  // Search
  searchFilters: SearchFilters;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  searchResults: Note[];
  isSearching: boolean;
  performSearch: () => Promise<void>;

  // Editor
  editorState: EditorState;
  setEditorState: (state: Partial<EditorState>) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  loadSettings: () => Promise<void>;

  // Sync
  syncStatus: SyncStatus;
  setSyncStatus: (status: Partial<SyncStatus>) => void;

  // Toast notifications
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Import/Export
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;

  // Stats
  getStats: () => { totalNotes: number; totalTags: number; starredNotes: number; archivedNotes: number; trashedNotes: number };
}

const defaultSettings: AppSettings = {
  theme: 'system',
  editorFontSize: 16,
  editorFontFamily: 'inter',
  sidebarCollapsed: false,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  autoSaveInterval: 1000,
  biometricUnlock: false,
  passcodeLock: false,
  autoLockTimeout: 0,
  defaultView: 'all',
  showWordCount: true,
  showLineNumbers: false,
  spellCheck: true,
};

const defaultSyncStatus: SyncStatus = {
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncedAt: null,
  pendingChanges: 0,
  error: null,
};

const defaultEditorState: EditorState = {
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  wordCount: 0,
  charCount: 0,
};

let toastCounter = 0;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isVaultLocked: false,

      login: async (email: string, password: string) => {
        // Check stored credentials
        const storedHash = localStorage.getItem('opnotes_password_hash');
        const storedEmail = localStorage.getItem('opnotes_email');

        if (!storedHash || !storedEmail) {
          get().addToast({ type: 'error', message: 'No account found. Please sign up.', duration: 4000 });
          return false;
        }

        if (storedEmail !== email) {
          get().addToast({ type: 'error', message: 'Invalid email or password.', duration: 4000 });
          return false;
        }

        const isValid = await verifyPassword(password, storedHash);
        if (!isValid) {
          get().addToast({ type: 'error', message: 'Invalid email or password.', duration: 4000 });
          return false;
        }

        const user: User = {
          id: storedEmail,
          email: storedEmail,
          displayName: localStorage.getItem('opnotes_display_name') || storedEmail.split('@')[0],
          isAuthenticated: true,
          createdAt: parseInt(localStorage.getItem('opnotes_created_at') || '0'),
        };

        set({ user, isAuthenticated: true, isVaultLocked: false });
        await get().loadNotes();
        await get().loadTags();
        await get().loadSettings();
        get().addToast({ type: 'success', message: 'Welcome back!', duration: 3000 });
        return true;
      },

      signup: async (email: string, password: string, displayName: string) => {
        const existingEmail = localStorage.getItem('opnotes_email');
        if (existingEmail) {
          get().addToast({ type: 'error', message: 'An account already exists. Please sign in.', duration: 4000 });
          return false;
        }

        const passwordHash = await hashPassword(password);
        const now = Date.now();

        localStorage.setItem('opnotes_email', email);
        localStorage.setItem('opnotes_password_hash', passwordHash);
        localStorage.setItem('opnotes_display_name', displayName);
        localStorage.setItem('opnotes_created_at', now.toString());

        const user: User = {
          id: email,
          email,
          displayName,
          isAuthenticated: true,
          createdAt: now,
        };

        set({ user, isAuthenticated: true, isVaultLocked: false });

        // Save default settings
        await saveSettings(defaultSettings);

        get().addToast({ type: 'success', message: 'Account created successfully!', duration: 3000 });
        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isVaultLocked: false,
          notes: [],
          tags: [],
          selectedNoteId: null,
          activeNote: null,
        });
        get().addToast({ type: 'info', message: 'Signed out successfully.', duration: 3000 });
      },

      unlockVault: async (password: string) => {
        const storedHash = localStorage.getItem('opnotes_password_hash');
        if (!storedHash) return false;

        const isValid = await verifyPassword(password, storedHash);
        if (isValid) {
          set({ isVaultLocked: false });
          return true;
        }
        return false;
      },

      // Notes
      notes: [],
      selectedNoteId: null,
      activeNote: null,
      isLoadingNotes: false,

      loadNotes: async () => {
        set({ isLoadingNotes: true });
        try {
          const notes = await getAllNotes();
          const { sortBy, sortOrder } = get().settings;
          const sorted = sortNotes(notes, sortBy, sortOrder);
          set({ notes: sorted, isLoadingNotes: false });
        } catch {
          set({ isLoadingNotes: false });
          get().addToast({ type: 'error', message: 'Failed to load notes', duration: 4000 });
        }
      },

      selectNote: async (id: string | null) => {
        if (!id) {
          set({ selectedNoteId: null, activeNote: null });
          return;
        }
        const note = await getNoteById(id);
        set({ selectedNoteId: id, activeNote: note });
      },

      createNote: async () => {
        const now = Date.now();
        const newNote: Note = {
          id: crypto.randomUUID(),
          title: '',
          content: '<p></p>',
          plainText: '',
          tags: [],
          isStarred: false,
          isArchived: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
          attachments: [],
        };

        await saveNote(newNote);
        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          selectedNoteId: newNote.id,
          activeNote: newNote,
          editorState: { ...defaultEditorState },
        });

        get().addToast({ type: 'success', message: 'New note created', duration: 2000 });
        return newNote;
      },

      updateNote: async (id: string, updates: Partial<Note>) => {
        const note = await getNoteById(id);
        if (!note) return;

        const updated: Note = {
          ...note,
          ...updates,
          updatedAt: Date.now(),
          version: note.version + 1,
        };

        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          activeNote: updated,
          editorState: {
            ...get().editorState,
            isDirty: false,
            isSaving: false,
            lastSavedAt: Date.now(),
          },
        });
      },

      deleteNote: async (id: string) => {
        const note = await getNoteById(id);
        if (!note) return;

        const updated = { ...note, isDeleted: true, deletedAt: Date.now() };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          selectedNoteId: get().selectedNoteId === id ? null : get().selectedNoteId,
          activeNote: get().selectedNoteId === id ? null : get().activeNote,
        });

        get().addToast({ type: 'success', message: 'Note moved to trash', duration: 3000 });
      },

      permanentlyDeleteNote: async (id: string) => {
        await deleteNotePermanently(id);
        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          selectedNoteId: get().selectedNoteId === id ? null : get().selectedNoteId,
          activeNote: get().selectedNoteId === id ? null : get().activeNote,
        });

        get().addToast({ type: 'success', message: 'Note permanently deleted', duration: 3000 });
      },

      restoreNote: async (id: string) => {
        const note = await getNoteById(id);
        if (!note) return;

        const updated = { ...note, isDeleted: false, deletedAt: null, isArchived: false };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({ notes: sorted });
        get().addToast({ type: 'success', message: 'Note restored', duration: 3000 });
      },

      toggleStar: async (id: string) => {
        const note = await getNoteById(id);
        if (!note) return;

        const updated = { ...note, isStarred: !note.isStarred };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          activeNote: get().selectedNoteId === id ? updated : get().activeNote,
        });
      },

      toggleArchive: async (id: string) => {
        const note = await getNoteById(id);
        if (!note) return;

        const updated = { ...note, isArchived: !note.isArchived };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          activeNote: get().selectedNoteId === id ? updated : get().activeNote,
        });

        get().addToast({
          type: 'success',
          message: updated.isArchived ? 'Note archived' : 'Note unarchived',
          duration: 3000,
        });
      },

      duplicateNote: async (id: string) => {
        const note = await getNoteById(id);
        if (!note) return;

        const now = Date.now();
        const duplicated: Note = {
          ...note,
          id: crypto.randomUUID(),
          title: `${note.title || 'Untitled'} (Copy)`,
          isStarred: false,
          isArchived: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
        };

        await saveNote(duplicated);
        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({ notes: sorted });
        get().addToast({ type: 'success', message: 'Note duplicated', duration: 3000 });
      },

      // Tags
      tags: [],
      selectedTag: null,

      loadTags: async () => {
        try {
          const tags = await getAllTags();
          set({ tags });
        } catch {
          get().addToast({ type: 'error', message: 'Failed to load tags', duration: 4000 });
        }
      },

      createTag: async (name: string, color?: string) => {
        const existing = get().tags.find(
          (t) => t.name.toLowerCase() === name.toLowerCase()
        );
        if (existing) return existing;

        const newTag: Tag = {
          id: crypto.randomUUID(),
          name,
          color: color || getRandomColor(),
          isFavorite: false,
          createdAt: Date.now(),
          noteCount: 0,
        };

        await saveTag(newTag);
        await get().loadTags();
        return newTag;
      },

      addTagToNote: async (noteId: string, tagName: string) => {
        const note = await getNoteById(noteId);
        if (!note) return;

        if (note.tags.includes(tagName)) return;

        // Create tag if it doesn't exist
        const existingTag = get().tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
        if (!existingTag) {
          await get().createTag(tagName);
        }

        const updated = { ...note, tags: [...note.tags, tagName] };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          activeNote: get().selectedNoteId === noteId ? updated : get().activeNote,
        });

        await get().loadTags();
      },

      removeTagFromNote: async (noteId: string, tagName: string) => {
        const note = await getNoteById(noteId);
        if (!note) return;

        const updated = { ...note, tags: note.tags.filter((t) => t !== tagName) };
        await saveNote(updated);

        const notes = await getAllNotes();
        const { sortBy, sortOrder } = get().settings;
        const sorted = sortNotes(notes, sortBy, sortOrder);

        set({
          notes: sorted,
          activeNote: get().selectedNoteId === noteId ? updated : get().activeNote,
        });
      },

      toggleFavoriteTag: async (tagId: string) => {
        const tag = get().tags.find((t) => t.id === tagId);
        if (!tag) return;

        const updated = { ...tag, isFavorite: !tag.isFavorite };
        await saveTag(updated);
        await get().loadTags();
      },

      // View & Navigation
      activeView: 'all',
      sidebarOpen: false,
      mobilePanel: 'list',

      setActiveView: (view: ViewType) => {
        set({ activeView: view, selectedTag: null });
        get().loadNotes();
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      setMobilePanel: (panel: 'sidebar' | 'list' | 'editor') => {
        set({ mobilePanel: panel });
      },

      // Search
      searchFilters: {
        query: '',
        searchInTitle: true,
        searchInContent: true,
        searchInTags: true,
        tags: [],
        dateFrom: null,
        dateTo: null,
        view: 'all',
      },
      searchResults: [],
      isSearching: false,

      setSearchFilters: (filters: Partial<SearchFilters>) => {
        set({ searchFilters: { ...get().searchFilters, ...filters } });
      },

      performSearch: async () => {
        const { query } = get().searchFilters;
        if (!query.trim()) {
          set({ searchResults: [], isSearching: false });
          return;
        }

        set({ isSearching: true });
        try {
          const results = await searchNotes(query);
          set({ searchResults: results, isSearching: false });
        } catch {
          set({ isSearching: false });
        }
      },

      // Editor
      editorState: defaultEditorState,

      setEditorState: (state: Partial<EditorState>) => {
        set({ editorState: { ...get().editorState, ...state } });
      },

      // Settings
      settings: defaultSettings,

      updateSettings: async (updates: Partial<AppSettings>) => {
        const newSettings = { ...get().settings, ...updates };
        await saveSettings(newSettings);
        set({ settings: newSettings });
      },

      loadSettings: async () => {
        try {
          const settings = await getSettings();
          if (settings) {
            set({ settings: { ...defaultSettings, ...settings } });
          }
        } catch {
          // Use defaults
        }
      },

      // Sync
      syncStatus: defaultSyncStatus,

      setSyncStatus: (status: Partial<SyncStatus>) => {
        set({ syncStatus: { ...get().syncStatus, ...status } });
      },

      // Toast notifications
      toasts: [],

      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${++toastCounter}`;
        const newToast: Toast = { ...toast, id };
        set({ toasts: [...get().toasts, newToast] });

        // Auto remove
        setTimeout(() => {
          get().removeToast(id);
        }, toast.duration);
      },

      removeToast: (id: string) => {
        set({ toasts: get().toasts.filter((t) => t.id !== id) });
      },

      // Import/Export
      exportData: async () => {
        const data = {
          version: '1.0.0',
          exportedAt: Date.now(),
          notes: await getAllNotes(),
          tags: await getAllTags(),
          settings: get().settings,
        };
        return JSON.stringify(data, null, 2);
      },

      importData: async (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);

          if (data.notes) {
            for (const note of data.notes) {
              await saveNote(note);
            }
          }
          if (data.tags) {
            for (const tag of data.tags) {
              await saveTag(tag);
            }
          }

          await get().loadNotes();
          await get().loadTags();

          get().addToast({ type: 'success', message: 'Data imported successfully!', duration: 4000 });
        } catch {
          get().addToast({ type: 'error', message: 'Failed to import data. Invalid format.', duration: 4000 });
        }
      },

      // Stats
      getStats: () => {
        const notes = get().notes;
        return {
          totalNotes: notes.filter((n) => !n.isDeleted).length,
          totalTags: get().tags.length,
          starredNotes: notes.filter((n) => n.isStarred && !n.isDeleted).length,
          archivedNotes: notes.filter((n) => n.isArchived && !n.isDeleted).length,
          trashedNotes: notes.filter((n) => n.isDeleted).length,
        };
      },
    }),
    {
      name: 'opnotes-storage-v3',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
      }),
    }
  )
);

// Helper functions
function sortNotes(notes: Note[], sortBy: string, sortOrder: string): Note[] {
  const sorted = [...notes];
  const multiplier = sortOrder === 'asc' ? 1 : -1;

  switch (sortBy) {
    case 'title':
      sorted.sort((a, b) => multiplier * (a.title || 'Untitled').localeCompare(b.title || 'Untitled'));
      break;
    case 'createdAt':
      sorted.sort((a, b) => multiplier * (a.createdAt - b.createdAt));
      break;
    case 'updatedAt':
    default:
      sorted.sort((a, b) => multiplier * (a.updatedAt - b.updatedAt));
      break;
  }

  return sorted;
}

function getRandomColor(): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16',
    '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
    '#8B5CF6', '#D946EF', '#F43F5E', '#78716C',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Online/offline detection
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().setSyncStatus({ isOnline: true });
    useStore.getState().addToast({ type: 'success', message: 'Back online', duration: 3000 });
  });

  window.addEventListener('offline', () => {
    useStore.getState().setSyncStatus({ isOnline: false });
    useStore.getState().addToast({ type: 'warning', message: 'You are offline. Changes saved locally.', duration: 4000 });
  });
}
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Note, Tag, User, AppSettings, SyncStatus, ViewType, SearchFilters, EditorState, Toast,
} from '@/types';
import {
  getAllNotes, getNoteById, saveNote, deleteNotePermanently,
  getAllTags, saveTag, getSettings, saveSettings, searchNotes,
} from '@/lib/storage';
import { hashPassword, verifyPassword } from '@/lib/crypto';

// ... (keep all existing interfaces the same)

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isVaultLocked: boolean;
  guestMode: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName: string) => Promise<boolean>;
  logout: () => void;
  unlockVault: (password: string) => Promise<boolean>;
  enableGuestMode: () => void;

  // ... (keep rest of interfaces same)
}

// ... (defaultSettings, defaultSyncStatus, defaultEditorState same)

let toastCounter = 0;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      isVaultLocked: false,
      guestMode: false,
      _hasHydrated: false,

      login: async (email: string, password: string) => {
        const storedHash = localStorage.getItem('opnotes_password_hash');
        const storedEmail = localStorage.getItem('opnotes_email');

        if (!storedHash || !storedEmail) {
          get().addToast({ type: 'error', message: 'No account found. Please sign up.', duration: 4000 });
          return false;
        }

        if (storedEmail !== email) {
          get().addToast({ type: 'error', message: 'Invalid email or password.', duration: 4000 });
          return false;
        }

        const isValid = await verifyPassword(password, storedHash);
        if (!isValid) {
          get().addToast({ type: 'error', message: 'Invalid email or password.', duration: 4000 });
          return false;
        }

        const user: User = {
          id: storedEmail,
          email: storedEmail,
          displayName: localStorage.getItem('opnotes_display_name') || storedEmail.split('@')[0],
          isAuthenticated: true,
          createdAt: parseInt(localStorage.getItem('opnotes_created_at') || '0'),
        };

        set({ user, isAuthenticated: true, isVaultLocked: false, guestMode: false });
        await get().loadNotes();
        await get().loadTags();
        await get().loadSettings();
        get().addToast({ type: 'success', message: 'Welcome back!', duration: 3000 });
        return true;
      },

      signup: async (email: string, password: string, displayName: string) => {
        const existingEmail = localStorage.getItem('opnotes_email');
        if (existingEmail) {
          get().addToast({ type: 'error', message: 'An account already exists. Please sign in.', duration: 4000 });
          return false;
        }

        const passwordHash = await hashPassword(password);
        const now = Date.now();

        localStorage.setItem('opnotes_email', email);
        localStorage.setItem('opnotes_password_hash', passwordHash);
        localStorage.setItem('opnotes_display_name', displayName);
        localStorage.setItem('opnotes_created_at', now.toString());

        const user: User = {
          id: email,
          email,
          displayName,
          isAuthenticated: true,
          createdAt: now,
        };

        set({ user, isAuthenticated: true, isVaultLocked: false, guestMode: false });
        await saveSettings(defaultSettings);
        await get().loadNotes();
        await get().loadTags();
        await get().loadSettings();

        get().addToast({ type: 'success', message: 'Account created successfully!', duration: 3000 });
        return true;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isVaultLocked: false,
          guestMode: false,
          notes: [],
          tags: [],
          selectedNoteId: null,
          activeNote: null,
        });
        get().addToast({ type: 'info', message: 'Signed out successfully.', duration: 3000 });
      },

      unlockVault: async (password: string) => {
        const storedHash = localStorage.getItem('opnotes_password_hash');
        if (!storedHash) return false;

        const isValid = await verifyPassword(password, storedHash);
        if (isValid) {
          set({ isVaultLocked: false });
          return true;
        }
        return false;
      },

      enableGuestMode: () => {
        const guestUser: User = {
          id: 'guest',
          email: 'guest@local',
          displayName: 'Guest User',
          isAuthenticated: true,
          createdAt: Date.now(),
        };
        
        set({ 
          user: guestUser, 
          isAuthenticated: true, 
          isVaultLocked: false, 
          guestMode: true 
        });
        
        // Load any existing local notes
        get().loadNotes();
        get().loadTags();
        get().loadSettings();
        
        get().addToast({ 
          type: 'success', 
          message: 'Guest mode enabled. Your notes are stored locally.', 
          duration: 4000 
        });
      },

      // ... (keep ALL the rest of the store exactly the same: notes, tags, view, search, editor, settings, sync, toast, import/export, stats)
      
      // Just make sure to include _hasHydrated: false in the state object above
    }),
    {
      name: 'opnotes-storage-v3',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        settings: state.settings,
        guestMode: state.guestMode,
      }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete
        useStore.setState({ _hasHydrated: true } as any);
      },
    }
  )
);

// ... (keep helper functions: sortNotes, getRandomColor, online/offline listeners same)
import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Star,
  Trash2,
  MoreVertical,
  Clock,
  RotateCcw,
  Copy,
  FileText,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/date-utils';
import type { Note } from '@/types';

export function NoteList() {
  const {
    notes,
    selectedNoteId,
    activeView,
    selectedTag,
    searchResults,
    selectNote,
    setMobilePanel,
    createNote,
    toggleStar,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    duplicateNote,
  } = useStore();

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (activeView === 'search' && searchResults.length > 0) {
      filtered = searchResults;
    } else if (activeView === 'starred') {
      filtered = notes.filter((n) => n.isStarred && !n.isDeleted && !n.isArchived);
    } else if (activeView === 'archived') {
      filtered = notes.filter((n) => n.isArchived && !n.isDeleted);
    } else if (activeView === 'trash') {
      filtered = notes.filter((n) => n.isDeleted);
    } else if (activeView === 'tag' && selectedTag) {
      filtered = notes.filter(
        (n) => n.tags.includes(selectedTag) && !n.isDeleted && !n.isArchived
      );
    } else {
      filtered = notes.filter((n) => !n.isDeleted && !n.isArchived);
    }

    return filtered;
  }, [notes, activeView, selectedTag, searchResults]);

  const getViewTitle = () => {
    switch (activeView) {
      case 'starred':
        return 'Starred';
      case 'archived':
        return 'Archived';
      case 'trash':
        return 'Trash';
      case 'tag':
        return selectedTag ? `Tag: ${selectedTag}` : 'All Tags';
      case 'search':
        return 'Search Results';
      default:
        return 'All Notes';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5] dark:border-[#333]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-white">
            {getViewTitle()}
          </h2>
          <span className="text-xs text-[#A3A3A3] dark:text-[#666]">
            {filteredNotes.length}
          </span>
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <FileText className="w-12 h-12 text-[#E5E5E5] dark:text-[#333] mb-3" />
            <p className="text-sm text-[#A3A3A3] dark:text-[#666] mb-1">
              {activeView === 'trash'
                ? 'Trash is empty'
                : activeView === 'search'
                ? 'No results found'
                : 'No notes yet'}
            </p>
            <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
              {activeView === 'trash'
                ? 'Deleted notes appear here'
                : activeView === 'search'
                ? 'Try a different search term'
                : 'Click "New Note" to get started'}
            </p>
            {activeView !== 'trash' && activeView !== 'search' && (
              <button
                onClick={() => {
                  createNote();
                  if (window.innerWidth < 1024) {
                    setMobilePanel('editor');
                  }
                }}
                className="mt-4 px-4 py-2 bg-[#E06B4D] hover:bg-[#D1583D] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Note
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F2F2F2] dark:divide-[#2a2a2a]">
            {filteredNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isSelected={selectedNoteId === note.id}
                onSelect={() => {
                  selectNote(note.id);
                  if (window.innerWidth < 1024) {
                    setMobilePanel('editor');
                  }
                }}
                onStar={() => toggleStar(note.id)}
                onDelete={() => deleteNote(note.id)}
                onRestore={() => restoreNote(note.id)}
                onPermanentDelete={() => permanentlyDeleteNote(note.id)}
                onDuplicate={() => duplicateNote(note.id)}
                isTrashView={activeView === 'trash'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onStar: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
  onDuplicate: () => void;
  isTrashView: boolean;
}

function NoteListItem({
  note,
  isSelected,
  onSelect,
  onStar,
  onDelete,
  onRestore,
  onPermanentDelete,
  onDuplicate,
  isTrashView,
}: NoteListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = note.title || 'Untitled';
  const preview = note.plainText?.slice(0, 120) || '';
  const timeAgo = formatDistanceToNow(note.updatedAt);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative px-4 py-3 cursor-pointer transition-colors',
        isSelected
          ? 'bg-[#E06B4D]/5 dark:bg-[#E06B4D]/10 border-l-[3px] border-[#E06B4D]'
          : 'border-l-[3px] border-transparent hover:bg-[#F9F9F9] dark:hover:bg-[#252525]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-sm font-medium truncate',
              isSelected
                ? 'text-[#E06B4D]'
                : 'text-[#1A1A1A] dark:text-white'
            )}
          >
            {title}
          </h3>
          {preview && (
            <p className="mt-0.5 text-xs text-[#6B6B6B] dark:text-[#999] line-clamp-2">
              {preview}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1 text-[#A3A3A3] dark:text-[#666]">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">{timeAgo}</span>
            </div>
            {note.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {note.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-[#F2F2F2] dark:bg-[#333] rounded text-[10px] text-[#6B6B6B] dark:text-[#999]"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-[10px] text-[#A3A3A3] dark:text-[#666]">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isTrashView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar();
              }}
              className={cn(
                'p-1 rounded transition-colors',
                note.isStarred
                  ? 'text-amber-400'
                  : 'text-[#A3A3A3] dark:text-[#666] hover:text-amber-400'
              )}
            >
              <Star
                className={cn('w-3.5 h-3.5', note.isStarred && 'fill-amber-400')}
              />
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded text-[#A3A3A3] dark:text-[#666] hover:text-[#6B6B6B] dark:hover:text-[#999] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 z-50 w-44 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-[#E5E5E5] dark:border-[#444] py-1">
                {isTrashView ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPermanentDelete();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Forever
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Move to Trash
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

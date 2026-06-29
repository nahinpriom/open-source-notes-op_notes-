import { useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Undo,
  Redo,
  Tag,
  Star,
  Archive,
  Trash2,
  MoreHorizontal,
  Clock,
  Type,
  Hash,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/date-utils';

export function NoteEditor() {
  const {
    activeNote,
    settings,
    editorState,
    updateNote,
    createNote,
    toggleStar,
    toggleArchive,
    deleteNote,
    addTagToNote,
    removeTagFromNote,
    setEditorState,
    setMobilePanel,
  } = useStore();

  const [title, setTitle] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showToolbar] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your thoughts...',
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
    ],
    content: activeNote?.content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

      setEditorState({
        isDirty: true,
        wordCount,
        charCount: text.length,
      });

      // Auto-save with debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (activeNote) {
          const autoTitle = text.split('\n')[0].slice(0, 100) || 'Untitled';
          setEditorState({ isSaving: true });
          updateNote(activeNote.id, {
            content: html,
            plainText: text,
            title: title || autoTitle,
          });
        }
      }, settings.autoSaveInterval);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
  });

  // Sync editor content when note changes
  useEffect(() => {
    if (editor && activeNote) {
      if (editor.getHTML() !== activeNote.content) {
        editor.commands.setContent(activeNote.content);
      }
      setTitle(activeNote.title || '');
    }
  }, [activeNote, editor]);

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus tag input when shown
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (activeNote) {
        setEditorState({ isSaving: true });
        updateNote(activeNote.id, { title: newTitle });
      }
    }, settings.autoSaveInterval);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim() || !activeNote) return;
    await addTagToNote(activeNote.id, tagInput.trim());
    setTagInput('');
    setShowTagInput(false);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), isActive: () => editor?.isActive('bold') },
    { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), isActive: () => editor?.isActive('italic') },
    { icon: UnderlineIcon, action: () => editor?.chain().focus().toggleUnderline().run(), isActive: () => editor?.isActive('underline') },
    { icon: Strikethrough, action: () => editor?.chain().focus().toggleStrike().run(), isActive: () => editor?.isActive('strike') },
    { separator: true },
    { icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor?.isActive('heading', { level: 1 }) },
    { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor?.isActive('heading', { level: 2 }) },
    { icon: Heading3, action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), isActive: () => editor?.isActive('heading', { level: 3 }) },
    { separator: true },
    { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), isActive: () => editor?.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor?.chain().focus().toggleOrderedList().run(), isActive: () => editor?.isActive('orderedList') },
    { icon: CheckSquare, action: () => editor?.chain().focus().toggleTaskList().run(), isActive: () => editor?.isActive('taskList') },
    { separator: true },
    { icon: Quote, action: () => editor?.chain().focus().toggleBlockquote().run(), isActive: () => editor?.isActive('blockquote') },
    { icon: Code, action: () => editor?.chain().focus().toggleCodeBlock().run(), isActive: () => editor?.isActive('codeBlock') },
    { separator: true },
    { icon: Undo, action: () => editor?.chain().focus().undo().run() },
    { icon: Redo, action: () => editor?.chain().focus().redo().run() },
  ];

  // Empty state
  if (!activeNote) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#1e1e1e]">
        <div className="w-24 h-24 rounded-2xl bg-[#F2F2F2] dark:bg-[#252525] flex items-center justify-center mb-4">
          <Type className="w-10 h-10 text-[#A3A3A3] dark:text-[#666]" />
        </div>
        <h3 className="text-lg font-medium text-[#1A1A1A] dark:text-white mb-2">
          Select a note to view
        </h3>
        <p className="text-sm text-[#A3A3A3] dark:text-[#666] mb-6">
          Choose a note from the list or create a new one
        </p>
        <button
          onClick={() => createNote()}
          className="px-6 py-2.5 bg-[#E06B4D] hover:bg-[#D1583D] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Create New Note
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E5E5] dark:border-[#333]">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile back button */}
          <button
            onClick={() => setMobilePanel('list')}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#6B6B6B] dark:text-[#999]" />
          </button>

          {/* Note metadata */}
          <div className="flex items-center gap-2 text-xs text-[#A3A3A3] dark:text-[#666]">
            <Clock className="w-3 h-3" />
            <span>Edited {formatDateTime(activeNote.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Word count */}
          {settings.showWordCount && (
            <span className="text-xs text-[#A3A3A3] dark:text-[#666] mr-2">
              {editorState.wordCount} words
            </span>
          )}

          {/* Star */}
          <button
            onClick={() => toggleStar(activeNote.id)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              activeNote.isStarred
                ? 'text-amber-400'
                : 'text-[#A3A3A3] dark:text-[#666] hover:text-amber-400'
            )}
          >
            <Star className={cn('w-4 h-4', activeNote.isStarred && 'fill-amber-400')} />
          </button>

          {/* Archive */}
          <button
            onClick={() => toggleArchive(activeNote.id)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              activeNote.isArchived
                ? 'text-[#E06B4D]'
                : 'text-[#A3A3A3] dark:text-[#666] hover:text-[#6B6B6B]'
            )}
          >
            <Archive className="w-4 h-4" />
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-[#A3A3A3] dark:text-[#666] hover:text-[#6B6B6B] hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-50 w-44 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-[#E5E5E5] dark:border-[#444] py-1">
                <button
                  onClick={() => {
                    toggleStar(activeNote.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                >
                  <Star className={cn('w-3.5 h-3.5', activeNote.isStarred && 'fill-amber-400 text-amber-400')} />
                  {activeNote.isStarred ? 'Unstar' : 'Star'}
                </button>
                <button
                  onClick={() => {
                    toggleArchive(activeNote.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {activeNote.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <div className="my-1 border-t border-[#E5E5E5] dark:border-[#444]" />
                <button
                  onClick={() => {
                    deleteNote(activeNote.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#DC2626] hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Move to Trash
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-[#E5E5E5] dark:border-[#333] overflow-x-auto">
          {toolbarButtons.map((button, index) => {
            if ('separator' in button) {
              return (
                <div
                  key={index}
                  className="w-px h-5 bg-[#E5E5E5] dark:bg-[#444] mx-1 flex-shrink-0"
                />
              );
            }

            const Icon = button.icon;
            const isActive = button.isActive?.();

            return (
              <button
                key={index}
                onClick={button.action}
                className={cn(
                  'p-1.5 rounded transition-colors flex-shrink-0',
                  isActive
                    ? 'bg-[#E06B4D]/10 text-[#E06B4D]'
                    : 'text-[#6B6B6B] dark:text-[#999] hover:bg-[#F2F2F2] dark:hover:bg-[#333]'
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="w-full text-2xl font-semibold text-[#1A1A1A] dark:text-white placeholder:text-[#A3A3A3] dark:placeholder:text-[#666] bg-transparent border-none focus:outline-none mb-4"
          />

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeNote.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2F2F2] dark:bg-[#333] rounded-full text-xs text-[#6B6B6B] dark:text-[#999]"
              >
                <Hash className="w-3 h-3" />
                {tag}
                <button
                  onClick={() => removeTagFromNote(activeNote.id, tag)}
                  className="ml-0.5 text-[#A3A3A3] hover:text-[#DC2626] transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {showTagInput ? (
              <div className="flex items-center gap-1">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') {
                      setShowTagInput(false);
                      setTagInput('');
                    }
                  }}
                  placeholder="Add tag..."
                  className="px-2 py-1 bg-[#F2F2F2] dark:bg-[#333] rounded-full text-xs text-[#1A1A1A] dark:text-white placeholder:text-[#A3A3A3] focus:outline-none focus:ring-1 focus:ring-[#E06B4D] w-24"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-[#E5E5E5] dark:border-[#555] rounded-full text-xs text-[#A3A3A3] dark:text-[#666] hover:text-[#E06B4D] hover:border-[#E06B4D] transition-colors"
              >
                <Tag className="w-3 h-3" />
                Add tag
              </button>
            )}
          </div>

          {/* TipTap Editor */}
          <EditorContent
            editor={editor}
            className="min-h-[400px]"
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#E5E5E5] dark:border-[#333] bg-[#FAFAFA] dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-3 text-[10px] text-[#A3A3A3] dark:text-[#666]">
          <span>{editorState.charCount} characters</span>
          <span>{editorState.wordCount} words</span>
        </div>
        <div className="flex items-center gap-1">
          {editorState.isSaving && (
            <span className="text-[10px] text-[#16A34A]">Saving...</span>
          )}
          {editorState.lastSavedAt && !editorState.isSaving && (
            <span className="text-[10px] text-[#A3A3A3] dark:text-[#666]">
              Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

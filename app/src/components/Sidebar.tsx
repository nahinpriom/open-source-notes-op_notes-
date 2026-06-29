import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  FileText,
  Star,
  Archive,
  Trash2,
  Settings,
  Plus,
  Hash,
  ChevronDown,
  ChevronRight,
  LogOut,
  Shield,
  Cloud,
  CloudOff,
  Menu,
  Search,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import type { ViewType } from '@/types';

export function Sidebar() {
  const navigate = useNavigate();
  const {
    user,
    tags,
    activeView,
    setActiveView,
    selectedTag,
    toggleSidebar,
    setMobilePanel,
    syncStatus,
    createNote,
    logout,
    createTag,
    toggleFavoriteTag,
  } = useStore();

  const [showTags, setShowTags] = useState(true);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setSearchFocused] = useState(false);

  const stats = useStore((s) => s.getStats());

  const navItems: { id: ViewType; label: string; icon: typeof FileText; count?: number }[] = [
    { id: 'all', label: 'All Notes', icon: FileText, count: stats.totalNotes },
    { id: 'starred', label: 'Starred', icon: Star, count: stats.starredNotes },
    { id: 'archived', label: 'Archived', icon: Archive, count: stats.archivedNotes },
    { id: 'trash', label: 'Trash', icon: Trash2, count: stats.trashedNotes },
  ];

  const handleNavClick = (view: ViewType) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      setMobilePanel('list');
    }
  };

  const handleTagClick = (tagName: string) => {
    useStore.setState({ selectedTag: tagName, activeView: 'tag' as ViewType });
    useStore.getState().loadNotes();
    if (window.innerWidth < 1024) {
      setMobilePanel('list');
    }
  };

  const handleCreateTag = async () => {
    if (!tagInput.trim()) return;
    await createTag(tagInput.trim());
    setTagInput('');
    setShowTagInput(false);
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] dark:bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5] dark:border-[#333]">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#333] transition-colors"
          >
            <Menu className="w-5 h-5 text-[#6B6B6B] dark:text-[#999]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E06B4D] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1A1A1A] dark:text-white text-sm">
              OP Notes
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) {
                useStore.setState({
                  searchFilters: { ...useStore.getState().searchFilters, query: e.target.value },
                  activeView: 'search' as ViewType,
                });
                useStore.getState().performSearch();
              } else {
                useStore.setState({ activeView: 'all' as ViewType, searchResults: [] });
                useStore.getState().loadNotes();
              }
            }}
            onFocus={() => setSearchFocused(true)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#252525] border border-[#E5E5E5] dark:border-[#333] rounded-lg text-sm text-[#1A1A1A] dark:text-white placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#E06B4D] dark:focus:border-[#E06B4D] transition-colors"
          />
        </div>
      </div>

      {/* New Note Button */}
      <div className="px-3 pb-2">
        <button
          onClick={() => {
            createNote();
            if (window.innerWidth < 1024) {
              setMobilePanel('editor');
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#E06B4D] hover:bg-[#D1583D] text-white rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <nav className="space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                activeView === item.id
                  ? 'bg-[#E06B4D]/10 text-[#E06B4D] dark:bg-[#E06B4D]/20 dark:text-[#E06B4D]'
                  : 'text-[#6B6B6B] dark:text-[#999] hover:bg-[#E5E5E5] dark:hover:bg-[#333]'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs text-[#A3A3A3] dark:text-[#666]">{item.count}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Tags Section */}
        <div className="mt-4">
          <button
            onClick={() => setShowTags(!showTags)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#A3A3A3] dark:text-[#666] uppercase tracking-wider hover:text-[#6B6B6B] dark:hover:text-[#999] transition-colors"
          >
            {showTags ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Tags
          </button>

          {showTags && (
            <div className="mt-1 space-y-0.5">
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag.name)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors group',
                    selectedTag === tag.name && activeView === 'tag'
                      ? 'bg-[#E06B4D]/10 text-[#E06B4D] dark:bg-[#E06B4D]/20'
                      : 'text-[#6B6B6B] dark:text-[#999] hover:bg-[#E5E5E5] dark:hover:bg-[#333]'
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <Hash className="w-3 h-3 text-[#A3A3A3]" />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteTag(tag.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star
                      className={cn(
                        'w-3 h-3',
                        tag.isFavorite
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-[#A3A3A3]'
                      )}
                    />
                  </button>
                </button>
              ))}

              {showTagInput ? (
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTag();
                      if (e.key === 'Escape') {
                        setShowTagInput(false);
                        setTagInput('');
                      }
                    }}
                    placeholder="Tag name..."
                    autoFocus
                    className="flex-1 text-sm bg-white dark:bg-[#252525] border border-[#E5E5E5] dark:border-[#333] rounded px-2 py-1 text-[#1A1A1A] dark:text-white focus:outline-none focus:border-[#E06B4D]"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowTagInput(true)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[#A3A3A3] dark:text-[#666] hover:text-[#6B6B6B] dark:hover:text-[#999] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Tag
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#E5E5E5] dark:border-[#333] px-3 py-2">
        {/* Sync Status */}
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
          {syncStatus.isOnline ? (
            <Cloud className="w-3.5 h-3.5 text-[#16A34A]" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-[#DC2626]" />
          )}
          <span className="text-xs text-[#A3A3A3] dark:text-[#666]">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
          {syncStatus.pendingChanges > 0 && (
            <span className="text-xs text-[#E06B4D]">
              ({syncStatus.pendingChanges} pending)
            </span>
          )}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#E06B4D] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">
                  {(user.displayName || user.email).charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-[#6B6B6B] dark:text-[#999] truncate">
                {user.displayName || user.email}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  navigate('/settings');
                }}
                className="p-1.5 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#333] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#A3A3A3] dark:text-[#666]" />
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-[#E5E5E5] dark:hover:bg-[#333] transition-colors"
              >
                <LogOut className="w-4 h-4 text-[#A3A3A3] dark:text-[#666]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

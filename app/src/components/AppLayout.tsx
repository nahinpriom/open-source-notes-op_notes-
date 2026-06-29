import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { NoteList } from './NoteList';
import { useStore } from '@/store/useStore';

export function AppLayout() {
  const { mobilePanel } = useStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F2F2F2] dark:bg-[#1a1a1a]">
      {/* Desktop 3-column layout */}
      <div className="hidden lg:flex w-full h-full">
        {/* Sidebar */}
        <div className="w-[260px] flex-shrink-0 h-full border-r border-[#E5E5E5] dark:border-[#333]">
          <Sidebar />
        </div>

        {/* Note List */}
        <div className="w-[340px] flex-shrink-0 h-full border-r border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-[#1e1e1e]">
          <NoteList />
        </div>

        {/* Editor */}
        <div className="flex-1 h-full bg-white dark:bg-[#1e1e1e] overflow-hidden">
          <Outlet />
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex w-full h-full">
        {mobilePanel === 'sidebar' && (
          <div className="w-full h-full">
            <Sidebar />
          </div>
        )}
        {mobilePanel === 'list' && (
          <div className="w-full h-full bg-white dark:bg-[#1e1e1e]">
            <NoteList />
          </div>
        )}
        {mobilePanel === 'editor' && (
          <div className="w-full h-full bg-white dark:bg-[#1e1e1e] overflow-hidden">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
}

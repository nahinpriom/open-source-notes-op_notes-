import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { AppLayout } from '@/components/AppLayout';
import { AuthScreen } from '@/components/AuthScreen';
import { NoteEditor } from '@/components/NoteEditor';
import { SettingsPage } from '@/components/SettingsPage';
import { Toaster } from '@/components/Toaster';

function App() {
  // Use selectors to prevent re-renders on unrelated state changes
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);
  const isReady = useStore((state) => state._hasHydrated);
  const loadNotes = useStore((state) => state.loadNotes);
  const loadTags = useStore((state) => state.loadTags);
  const loadSettings = useStore((state) => state.loadSettings);
  
  useTheme();

  // Load data once after hydration if authenticated
  useEffect(() => {
    if (isReady && isAuthenticated && user) {
      loadNotes();
      loadTags();
      loadSettings();
    }
  }, [isReady, isAuthenticated, user]); // load functions are stable, no need in deps

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#1c1c1c]">
        <div className="w-8 h-8 border-2 border-[#086dd6]/30 border-t-[#086dd6] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <AuthScreen />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<NoteEditor />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
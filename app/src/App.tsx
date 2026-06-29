import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/hooks/useTheme';
import { AppLayout } from '@/components/AppLayout';
import { AuthScreen } from '@/components/AuthScreen';
import { NoteEditor } from '@/components/NoteEditor';
import { SettingsPage } from '@/components/SettingsPage';
import { Toaster } from '@/components/Toaster';

function App() {
  const { isAuthenticated, user, loadNotes, loadTags, loadSettings } = useStore();
  const [isReady, setIsReady] = useState(false);
  useTheme();

  useEffect(() => {
    // Wait for zustand persist rehydration
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotes();
      loadTags();
      loadSettings();
    }
  }, [isAuthenticated, user, loadNotes, loadTags, loadSettings]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-[#F2F2F2] dark:bg-[#1a1a1a]">
        <div className="w-8 h-8 border-2 border-[#E06B4D]/30 border-t-[#E06B4D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
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

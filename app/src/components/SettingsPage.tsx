import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  User,
  Shield,
  Palette,
  Type,
  Download,
  Upload,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Lock,
  Fingerprint,
  Clock,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

type SettingsTab = 'account' | 'security' | 'appearance' | 'editor' | 'data';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, settings, updateSettings, logout, exportData, importData } = useStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'data', label: 'Data', icon: Download },
  ];

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opnotes-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await importData(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = () => {
    localStorage.clear();
    indexedDB.deleteDatabase('OPNotesDB');
    logout();
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e1e1e] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5E5E5] dark:border-[#333]">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#333] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B6B6B] dark:text-[#999]" />
        </button>
        <h1 className="text-lg font-semibold text-[#1A1A1A] dark:text-white">Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-48 border-r border-[#E5E5E5] dark:border-[#333] py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                activeTab === tab.id
                  ? 'text-[#E06B4D] bg-[#E06B4D]/5 dark:bg-[#E06B4D]/10'
                  : 'text-[#6B6B6B] dark:text-[#999] hover:bg-[#F2F2F2] dark:hover:bg-[#333]'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          {activeTab === 'account' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                Account Information
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <label className="block text-xs text-[#A3A3A3] dark:text-[#666] mb-1">
                    Display Name
                  </label>
                  <p className="text-sm text-[#1A1A1A] dark:text-white">
                    {user?.displayName || 'Not set'}
                  </p>
                </div>

                <div className="p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <label className="block text-xs text-[#A3A3A3] dark:text-[#666] mb-1">
                    Email
                  </label>
                  <p className="text-sm text-[#1A1A1A] dark:text-white">{user?.email}</p>
                </div>

                <div className="p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <label className="block text-xs text-[#A3A3A3] dark:text-[#666] mb-1">
                    Account Created
                  </label>
                  <p className="text-sm text-[#1A1A1A] dark:text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E5E5] dark:border-[#333]">
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm text-[#DC2626] border border-[#DC2626] rounded-lg hover:bg-[#DC2626]/5 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                Security Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-[#6B6B6B] dark:text-[#999]" />
                    <div>
                      <p className="text-sm text-[#1A1A1A] dark:text-white">Passcode Lock</p>
                      <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                        Require passcode to open app
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ passcodeLock: !settings.passcodeLock })
                    }
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors',
                      settings.passcodeLock ? 'bg-[#E06B4D]' : 'bg-[#E5E5E5] dark:bg-[#555]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                        settings.passcodeLock ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Fingerprint className="w-4 h-4 text-[#6B6B6B] dark:text-[#999]" />
                    <div>
                      <p className="text-sm text-[#1A1A1A] dark:text-white">
                        Biometric Unlock
                      </p>
                      <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                        Use fingerprint or face recognition
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ biometricUnlock: !settings.biometricUnlock })
                    }
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors',
                      settings.biometricUnlock ? 'bg-[#E06B4D]' : 'bg-[#E5E5E5] dark:bg-[#555]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                        settings.biometricUnlock ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#6B6B6B] dark:text-[#999]" />
                    <div>
                      <p className="text-sm text-[#1A1A1A] dark:text-white">Auto-Lock Timeout</p>
                      <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                        Lock app after period of inactivity
                      </p>
                    </div>
                  </div>
                  <select
                    value={settings.autoLockTimeout}
                    onChange={(e) =>
                      updateSettings({ autoLockTimeout: parseInt(e.target.value) })
                    }
                    className="px-2 py-1 bg-white dark:bg-[#333] border border-[#E5E5E5] dark:border-[#555] rounded text-sm text-[#1A1A1A] dark:text-white"
                  >
                    <option value={0}>Never</option>
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#E06B4D]/5 dark:bg-[#E06B4D]/10 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#E06B4D] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                      End-to-End Encryption
                    </p>
                    <p className="text-xs text-[#6B6B6B] dark:text-[#999] mt-1">
                      All your notes are encrypted locally using AES-256-GCM before being
                      stored. Your password is hashed with SHA-256 and never leaves your
                      device.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                Appearance
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#1A1A1A] dark:text-white mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light' as const, label: 'Light', icon: Sun },
                      { value: 'dark' as const, label: 'Dark', icon: Moon },
                      { value: 'system' as const, label: 'System', icon: Monitor },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => updateSettings({ theme: theme.value })}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                          settings.theme === theme.value
                            ? 'border-[#E06B4D] bg-[#E06B4D]/5 dark:bg-[#E06B4D]/10'
                            : 'border-[#E5E5E5] dark:border-[#333] hover:border-[#A3A3A3]'
                        )}
                      >
                        <theme.icon
                          className={cn(
                            'w-6 h-6',
                            settings.theme === theme.value
                              ? 'text-[#E06B4D]'
                              : 'text-[#6B6B6B] dark:text-[#999]'
                          )}
                        />
                        <span className="text-xs text-[#1A1A1A] dark:text-white">
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                Editor Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div>
                    <p className="text-sm text-[#1A1A1A] dark:text-white">Font Size</p>
                    <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                      Editor font size in pixels
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateSettings({
                          editorFontSize: Math.max(12, settings.editorFontSize - 1),
                        })
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#333] border border-[#E5E5E5] dark:border-[#555] text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2]"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm text-[#1A1A1A] dark:text-white">
                      {settings.editorFontSize}
                    </span>
                    <button
                      onClick={() =>
                        updateSettings({
                          editorFontSize: Math.min(24, settings.editorFontSize + 1),
                        })
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-[#333] border border-[#E5E5E5] dark:border-[#555] text-[#1A1A1A] dark:text-white hover:bg-[#F2F2F2]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div>
                    <p className="text-sm text-[#1A1A1A] dark:text-white">Font Family</p>
                    <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                      Choose your preferred font
                    </p>
                  </div>
                  <select
                    value={settings.editorFontFamily}
                    onChange={(e) =>
                      updateSettings({
                        editorFontFamily: e.target.value as 'inter' | 'mono' | 'serif',
                      })
                    }
                    className="px-3 py-1.5 bg-white dark:bg-[#333] border border-[#E5E5E5] dark:border-[#555] rounded-lg text-sm text-[#1A1A1A] dark:text-white"
                  >
                    <option value="inter">Inter (Sans-serif)</option>
                    <option value="mono">Monospace</option>
                    <option value="serif">Serif</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div>
                    <p className="text-sm text-[#1A1A1A] dark:text-white">Show Word Count</p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ showWordCount: !settings.showWordCount })
                    }
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors',
                      settings.showWordCount ? 'bg-[#E06B4D]' : 'bg-[#E5E5E5] dark:bg-[#555]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                        settings.showWordCount ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div>
                    <p className="text-sm text-[#1A1A1A] dark:text-white">Spell Check</p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings({ spellCheck: !settings.spellCheck })
                    }
                    className={cn(
                      'w-10 h-6 rounded-full transition-colors',
                      settings.spellCheck ? 'bg-[#E06B4D]' : 'bg-[#E5E5E5] dark:bg-[#555]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 bg-white rounded-full shadow-sm transition-transform',
                        settings.spellCheck ? 'translate-x-5' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div>
                    <p className="text-sm text-[#1A1A1A] dark:text-white">Auto-save Interval</p>
                    <p className="text-xs text-[#A3A3A3] dark:text-[#666]">
                      Delay before auto-saving (ms)
                    </p>
                  </div>
                  <select
                    value={settings.autoSaveInterval}
                    onChange={(e) =>
                      updateSettings({ autoSaveInterval: parseInt(e.target.value) })
                    }
                    className="px-3 py-1.5 bg-white dark:bg-[#333] border border-[#E5E5E5] dark:border-[#555] rounded-lg text-sm text-[#1A1A1A] dark:text-white"
                  >
                    <option value={500}>500ms</option>
                    <option value={1000}>1s</option>
                    <option value={2000}>2s</option>
                    <option value={5000}>5s</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6 max-w-lg">
              <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                Data Management
              </h2>

              <div className="space-y-4">
                {/* Export */}
                <div className="p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                        Export Data
                      </p>
                      <p className="text-xs text-[#6B6B6B] dark:text-[#999] mt-1 mb-3">
                        Download all your notes, tags, and settings as a JSON file.
                      </p>
                      <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Export to JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Import */}
                <div className="p-4 bg-[#F2F2F2] dark:bg-[#252525] rounded-lg">
                  <div className="flex items-start gap-3">
                    <Upload className="w-5 h-5 text-[#2563EB] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A] dark:text-white">
                        Import Data
                      </p>
                      <p className="text-xs text-[#6B6B6B] dark:text-[#999] mt-1 mb-3">
                        Import notes from a previously exported JSON file.
                      </p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Import from JSON
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-4 bg-[#DC2626]/5 dark:bg-[#DC2626]/10 rounded-lg border border-[#DC2626]/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#DC2626]">Danger Zone</p>
                      <p className="text-xs text-[#6B6B6B] dark:text-[#999] mt-1 mb-3">
                        Once you delete all data, there is no going back. Please be certain.
                      </p>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="px-4 py-2 border border-[#DC2626] text-[#DC2626] rounded-lg text-sm font-medium hover:bg-[#DC2626]/5 transition-colors"
                        >
                          Delete All Data
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-[#DC2626]">
                            Are you sure? This will permanently delete all your notes and
                            settings.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={handleDeleteAllData}
                              className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Yes, Delete Everything
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="px-4 py-2 border border-[#E5E5E5] dark:border-[#555] text-[#6B6B6B] dark:text-[#999] rounded-lg text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

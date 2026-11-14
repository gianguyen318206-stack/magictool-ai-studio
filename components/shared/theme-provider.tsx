'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface AppSettings {
  theme: Theme;
  reducedMotion: boolean;
  displayName: string;
  supportMagicModel: string;
}

interface SettingsContextType extends AppSettings {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setReducedMotion: (val: boolean) => void;
  setDisplayName: (name: string) => void;
  setSupportMagicModel: (model: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  reducedMotion: false,
  displayName: 'Nhà Sáng Tạo',
  supportMagicModel: 'ag/gemini-4-argon',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('magictool_settings_v2');
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('magictool_settings_v2', JSON.stringify(settings));
    } catch {
      // ignore
    }

    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [settings, mounted]);

  const setTheme = (theme: Theme) => setSettings((s) => ({ ...s, theme }));
  const toggleTheme = () => setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  const setReducedMotion = (reducedMotion: boolean) => setSettings((s) => ({ ...s, reducedMotion }));
  const setDisplayName = (displayName: string) => setSettings((s) => ({ ...s, displayName }));
  const setSupportMagicModel = (supportMagicModel: string) =>
    setSettings((s) => ({ ...s, supportMagicModel }));

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setTheme,
        toggleTheme,
        setReducedMotion,
        setDisplayName,
        setSupportMagicModel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within a SettingsProvider');
  }
  return context;
}

export const useTheme = useAppSettings;

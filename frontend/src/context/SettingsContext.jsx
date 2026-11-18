import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, REFRESH_OPTIONS } from '../utils/constants.js';

const SETTINGS_STORAGE_KEY = 'campuswatt.settings.v1';
const SettingsContext = createContext(null);

// Cleaning
function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function cleanSettings(raw = {}) {
  const refreshSeconds = Number(raw.refreshSeconds);
  return {
    tariff: clampNumber(Number(raw.tariff), 0.01, 10, DEFAULT_SETTINGS.tariff),
    thresholdMultiplier: clampNumber(Number(raw.thresholdMultiplier), 0.5, 2, DEFAULT_SETTINGS.thresholdMultiplier),
    refreshSeconds: REFRESH_OPTIONS.includes(refreshSeconds) ? refreshSeconds : DEFAULT_SETTINGS.refreshSeconds,
  };
}

// Storage
function loadSettings() {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    return cleanSettings(JSON.parse(stored));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    return;
  }
}

// Provider
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = useCallback((changes) => {
    setSettings((previous) => {
      const next = cleanSettings({ ...previous, ...changes });
      saveSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    saveSettings({ ...DEFAULT_SETTINGS });
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  const value = useMemo(() => {
    const isDefault = Object.keys(DEFAULT_SETTINGS).every((key) => settings[key] === DEFAULT_SETTINGS[key]);
    return { ...settings, settings, updateSettings, resetSettings, isDefault };
  }, [settings, updateSettings, resetSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>');
  return context;
}

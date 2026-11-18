import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'campuswatt.theme';
const ThemeContext = createContext(null);

// Storage
function loadSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light') return 'light';
    return 'dark';
  } catch {
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}

function applyThemeToPage(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeColorTag = document.querySelector('meta[name="theme-color"]');
  if (themeColorTag) {
    const pageColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim();
    themeColorTag.setAttribute('content', pageColor);
  }
}

// Provider
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(loadSavedTheme);

  useEffect(() => {
    applyThemeToPage(theme);
    saveTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

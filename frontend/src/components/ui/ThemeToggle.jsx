import { Moon, Sun } from 'lucide-react';
import { Icon } from './Icon.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" onClick={toggleTheme} className="icon-button" aria-label={label} title={label}>
      <Icon icon={isDark ? Sun : Moon} />
    </button>
  );
}

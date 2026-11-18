import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

// Token names
const TOKEN_NAMES = {
  surface: '--bg-surface',
  elevated: '--bg-elevated',
  grid: '--border-subtle',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  brandSecondary: '--brand-secondary',
  optimal: '--status-optimal',
  moderate: '--status-moderate',
  critical: '--status-critical',
  criticalText: '--status-critical-text',
  seriesOther: '--series-other',
  series1: '--series-1',
  series2: '--series-2',
  series3: '--series-3',
  series4: '--series-4',
  series5: '--series-5',
};

// Read tokens
function readChartColors() {
  const styles = getComputedStyle(document.documentElement);
  const colors = {};
  Object.entries(TOKEN_NAMES).forEach(([name, cssVariable]) => {
    colors[name] = styles.getPropertyValue(cssVariable).trim();
  });
  return colors;
}

export function useChartColors() {
  const { theme } = useTheme();
  const [colors, setColors] = useState(readChartColors);

  useEffect(() => {
    setColors(readChartColors());
  }, [theme]);

  return colors;
}

export function resolveSeriesColor(colorVar, colors) {
  const match = colorVar.match(/--series-(\d)/);
  if (!match) return colors.seriesOther;
  return colors[`series${match[1]}`] || colors.seriesOther;
}

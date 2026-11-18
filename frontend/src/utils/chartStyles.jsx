export function getAxisProps(colors) {
  return {
    tick: { fill: colors.textSecondary, fontSize: 11 },
    tickLine: false,
    axisLine: false,
  };
}

export function getGridProps(colors) {
  return { stroke: colors.grid, vertical: false };
}

export function getAxisLabel(colors, text) {
  return { value: text, angle: -90, position: 'insideLeft', offset: 18, fill: colors.textSecondary, fontSize: 11 };
}

export function getLegendFormatter(colors) {
  return function formatLegendLabel(value) {
    return <span style={{ color: colors.textSecondary }}>{value}</span>;
  };
}

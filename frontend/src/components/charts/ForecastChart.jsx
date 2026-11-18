import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useChartColors } from '../../hooks/useChartColors.js';
import { getAxisLabel, getAxisProps, getGridProps, getLegendFormatter } from '../../utils/chartStyles.jsx';
import { formatHour, formatNumber } from '../../utils/formatters.js';

// Helpers
function findLastActualPoint(points) {
  const reversed = [...points].reverse();
  return reversed.find((point) => point.actual !== null);
}

export function ForecastChart({ points, height = 300 }) {
  const colors = useChartColors();
  const lastActual = findLastActualPoint(points);
  const lastPoint = points[points.length - 1];

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid {...getGridProps(colors)} />

          {lastActual && lastPoint && (
            <ReferenceArea
              x1={lastActual.timestamp}
              x2={lastPoint.timestamp}
              fill={colors.brandSecondary}
              fillOpacity={0.08}
              ifOverflow="extendDomain"
              label={{ value: 'Forecast', position: 'insideTopRight', fill: colors.textSecondary, fontSize: 11, fontWeight: 600 }}
            />
          )}
          {lastActual && (
            <ReferenceLine x={lastActual.timestamp} stroke={colors.textMuted} strokeDasharray="3 3" label={{ value: 'Now (UAE)', position: 'insideTopLeft', fill: colors.textSecondary, fontSize: 11 }} />
          )}

          <XAxis dataKey="timestamp" tickFormatter={formatHour} minTickGap={28} {...getAxisProps(colors)} />
          <YAxis {...getAxisProps(colors)} width={52} tickFormatter={(value) => formatNumber(value)} label={getAxisLabel(colors, 'kWh')} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.textMuted, strokeDasharray: '3 3' }} />
          <Legend iconType="plainline" iconSize={18} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={getLegendFormatter(colors)} />

          <Area type="monotone" dataKey="actual" name="Actual" stroke={colors.brandSecondary} strokeWidth={2} fill={colors.brandSecondary} fillOpacity={0.12} connectNulls={false} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="forecast" name="Forecast" stroke={colors.brandSecondary} strokeWidth={2} strokeDasharray="6 5" dot={false} connectNulls isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

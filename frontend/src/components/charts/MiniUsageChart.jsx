import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useChartColors } from '../../hooks/useChartColors.js';

export function MiniUsageChart({ data, dataKey, color, threshold, height = 96 }) {
  const colors = useChartColors();

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <YAxis hide domain={[0, (max) => Math.max(max, threshold || 0) * 1.08]} />
          {threshold ? <ReferenceLine y={threshold} stroke={colors.critical} strokeDasharray="4 3" strokeWidth={1} /> : null}
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.grid }} />
          <Area type="monotone" dataKey={dataKey} name="Usage" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

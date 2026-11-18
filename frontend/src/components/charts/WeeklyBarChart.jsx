import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useChartColors, resolveSeriesColor } from '../../hooks/useChartColors.js';
import { buildingColorVar } from '../../utils/constants.js';
import { getAxisProps, getGridProps, getLegendFormatter } from '../../utils/chartStyles.jsx';
import { formatNumber } from '../../utils/formatters.js';

function formatThousands(value) {
  return `${formatNumber(value / 1000, 1)}k`;
}

export function WeeklyBarChart({ data, height = 300 }) {
  const colors = useChartColors();
  const rows = data.map((item) => ({ ...item, label: item.code }));
  const allCodes = rows.map((row) => row.code);
  const findName = (code) => rows.find((row) => row.label === code)?.name || code;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid {...getGridProps(colors)} />
          <XAxis dataKey="label" {...getAxisProps(colors)} />
          <YAxis {...getAxisProps(colors)} width={52} tickFormatter={formatThousands} />
          <Tooltip
            cursor={{ fill: colors.elevated }}
            content={<ChartTooltip labelFormatter={findName} valueFormatter={(value) => `${formatNumber(value)} kWh`} />}
          />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={getLegendFormatter(colors)}
            payload={[
              { value: 'This week (building color)', type: 'square', color: colors.textSecondary, id: 'current' },
              { value: 'Previous week', type: 'square', color: colors.seriesOther, id: 'previous' },
            ]}
          />
          <Bar dataKey="totalKwh" name="This week" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.buildingId} fill={resolveSeriesColor(buildingColorVar(row.code, allCodes), colors)} />
            ))}
          </Bar>
          <Bar dataKey="previousKwh" name="Previous week" fill={colors.seriesOther} fillOpacity={0.45} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './ChartTooltip.jsx';
import { useChartColors, resolveSeriesColor } from '../../hooks/useChartColors.js';
import { buildingColorVar } from '../../utils/constants.js';
import { getAxisLabel, getAxisProps, getGridProps, getLegendFormatter } from '../../utils/chartStyles.jsx';
import { formatHour, formatNumber } from '../../utils/formatters.js';

// Helpers
function getVisibleBuildings(buildings, selected) {
  if (selected === 'all') return buildings;
  return buildings.filter((building) => building.id === selected);
}

function getLineColor(building, allCodes, colors, isSingle) {
  if (isSingle) return colors.brandSecondary;
  return resolveSeriesColor(buildingColorVar(building.code, allCodes), colors);
}

export function BuildingUsageChart({ data, buildings, selected = 'all', height = 300 }) {
  const colors = useChartColors();
  const visibleBuildings = getVisibleBuildings(buildings, selected);
  const singleBuilding = visibleBuildings.length === 1 ? visibleBuildings[0] : null;
  const allCodes = buildings.map((building) => building.code);
  const limit = singleBuilding?.thresholdKwhPerHour || 0;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid {...getGridProps(colors)} />
          <XAxis dataKey="timestamp" tickFormatter={formatHour} minTickGap={28} {...getAxisProps(colors)} />
          <YAxis
            {...getAxisProps(colors)}
            width={52}
            tickFormatter={(value) => formatNumber(value)}
            domain={[0, (max) => Math.ceil(Math.max(max, limit) * 1.1)]}
            label={getAxisLabel(colors, 'kWh')}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.textMuted, strokeDasharray: '3 3' }} />
          {visibleBuildings.length > 1 && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={getLegendFormatter(colors)} />
          )}
          {singleBuilding && (
            <ReferenceLine
              y={singleBuilding.thresholdKwhPerHour}
              stroke={colors.critical}
              strokeDasharray="6 4"
              label={{ value: `Limit ${formatNumber(singleBuilding.thresholdKwhPerHour, 1)} kWh/h`, position: 'insideTopRight', fill: colors.criticalText, fontSize: 11 }}
            />
          )}
          {visibleBuildings.map((building) => (
            <Line
              key={building.id}
              type="monotone"
              dataKey={building.id}
              name={building.name}
              stroke={getLineColor(building, allCodes, colors, Boolean(singleBuilding))}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: colors.surface }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

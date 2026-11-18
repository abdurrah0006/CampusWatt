import { Skeleton } from './Skeleton.jsx';

const BAR_HEIGHTS = [38, 52, 45, 70, 62, 80, 74, 58, 66, 84, 77, 60, 48, 55, 69, 73, 50, 42];

export function ChartSkeleton({ height = 280 }) {
  return (
    <div className="flex items-end gap-2 px-1" style={{ height }} role="status" aria-label="Loading chart">
      {BAR_HEIGHTS.map((barHeight, index) => (
        <Skeleton key={index} className="flex-1 rounded-sm" style={{ height: `${barHeight}%` }} />
      ))}
    </div>
  );
}

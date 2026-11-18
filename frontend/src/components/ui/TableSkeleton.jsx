import { Skeleton } from './Skeleton.jsx';

export function TableSkeleton({ rows = 6 }) {
  const rowIndexes = Array.from({ length: rows }, (_, index) => index);
  return (
    <div className="space-y-2 px-5 pb-5" role="status" aria-label="Loading table">
      {rowIndexes.map((index) => <Skeleton key={index} className="h-12 w-full" />)}
    </div>
  );
}

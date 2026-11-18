import { Skeleton } from './Skeleton.jsx';

export function CardSkeleton({ lines = 3, className = '' }) {
  const lineIndexes = Array.from({ length: lines }, (_, index) => index);
  return (
    <div className={`card space-y-3 p-5 ${className}`} role="status" aria-label="Loading">
      <Skeleton className="h-4 w-1/3" />
      {lineIndexes.map((index) => (
        <Skeleton key={index} className={`h-3 ${index % 2 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

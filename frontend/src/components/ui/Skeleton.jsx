export function Skeleton({ className = '', style }) {
  return <div className={`animate-pulse rounded-md bg-elevated ${className}`} style={style} aria-hidden="true" />;
}

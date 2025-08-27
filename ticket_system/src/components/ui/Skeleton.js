export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-neutral-200 ${className}`} />
  )
}

export function SkeletonText({ lines = 1, className = '' }) {
  const arr = Array.from({ length: lines })
  return (
    <div className={className}>
      {arr.map((_, i) => (
        <div key={i} className={`animate-pulse bg-neutral-200 h-[0.9rem] ${i === lines - 1 ? 'w-2/3' : 'w-full'} rounded mb-2`} />
      ))}
    </div>
  )
}

export default function Spinner({ size = 20, className = '' }) {
  const border = Math.max(2, Math.round(size / 10))
  const style = { width: size, height: size, borderWidth: border }
  return (
    <span
      className={`inline-block animate-spin rounded-full border-gray-300 border-t-gray-700 align-middle ${className}`}
      style={style}
      aria-label="loading"
      role="status"
    />
  )
}

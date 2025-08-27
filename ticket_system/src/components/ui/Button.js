import Link from 'next/link'

export default function Button({ children, className = '', as, href, ...props }) {
  const common = `inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-medium bg-black text-white hover:opacity-90 disabled:opacity-50 ${className}`

  if (href || as === 'a') {
    // Prefer Next.js Link when href provided
    return (
      <Link href={href || '#'} className={common} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={common} {...props}>
      {children}
    </button>
  )
}

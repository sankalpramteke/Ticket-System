export default function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 dark:bg-black dark:border-neutral-700 ${className}`} {...props}>
      {children}
    </Tag>
  )
}

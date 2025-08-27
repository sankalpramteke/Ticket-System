export default function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`border rounded-md px-3 py-2 text-base w-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-black/10 dark:bg-white dark:text-black dark:border-neutral-600 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

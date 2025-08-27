import dynamic from 'next/dynamic'
const AdminPageClient = dynamic(() => import('./AdminPageClient'), { ssr: false })

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default function Page() {
  return <AdminPageClient />
}

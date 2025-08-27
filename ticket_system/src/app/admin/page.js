import dynamic from 'next/dynamic'
import { Suspense } from 'react'
const AdminPageClient = dynamic(() => import('./AdminPageClient'), { ssr: false })

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <AdminPageClient />
    </Suspense>
  )
}

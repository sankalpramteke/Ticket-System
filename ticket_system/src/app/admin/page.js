import { Suspense } from 'react'
import AdminPageClient from './AdminPageClient'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function Page() {
  return (
    <Suspense fallback={<div className="text-gray-600">Loading...</div>}>
      <AdminPageClient />
    </Suspense>
  )
}

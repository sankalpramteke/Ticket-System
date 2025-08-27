'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { apiFetch, getToken, clearToken } from '@/lib/clientAuth'

export default function Header() {
  const [user, setUser] = useState(null)
  const [authTick, setAuthTick] = useState(0)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function navLinkClass(href) {
    const active = pathname === href
    return (
      (active
        ? 'bg-black text-white border-black'
        : 'bg-white text-black border-neutral-300 hover:bg-neutral-100')
      + ' px-2 py-1 rounded-md border transition-colors'
    )
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      const token = getToken()
      if (!token) { setUser(null); return }
      try {
        const { user } = await apiFetch('/api/auth/me')
        if (mounted) setUser(user)
      } catch {
        if (mounted) setUser(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [authTick])

  useEffect(() => {
    function onAuthChanged() { setAuthTick(t => t + 1) }
    window.addEventListener('auth-changed', onAuthChanged)
    window.addEventListener('focus', onAuthChanged)
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged)
      window.removeEventListener('focus', onAuthChanged)
    }
  }, [])

  // Enforce light theme on mount (remove any persisted dark mode)
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark')
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('theme')
      }
    } catch {}
  }, [])

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-4 py-3 text-base text-black">
        <div className="flex items-center justify-between h-12 md:h-14">
          <Link href="/" className="font-semibold text-lg md:text-2xl leading-none">Campus Tickets</Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {!user && (
                <Link href="/login" className={navLinkClass('/login')}>Login</Link>
              )}
              {user && (
                <>
                  {user.role === 'reporter' && (
                    <>
                      <Link href="/tickets/new" className={navLinkClass('/tickets/new')}>New Ticket</Link>
                      <Link href="/tickets/mine" className={navLinkClass('/tickets/mine')}>My Tickets</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link href="/admin" className={navLinkClass('/admin')}>Admin Dashboard</Link>
                  )}
                  {user.role === 'technician' && (
                    <Link href="/tech" className={navLinkClass('/tech')}>My Assignments</Link>
                  )}
                  <span className="text-gray-600 text-sm">Hi, {user.name}</span>
                  <button onClick={() => { clearToken(); location.href = '/' }} className="h-9 px-3 border rounded-md text-black border-neutral-300 hover:bg-neutral-100">Logout</button>
                </>
              )}
            </div>
            <button onClick={()=>setOpen(o=>!o)} aria-label="Toggle menu" className="sm:hidden inline-flex items-center justify-center h-9 px-3 border rounded-md border-neutral-300">Menu</button>
          </div>
        </div>
        {open && (
          <div className="sm:hidden mt-3 grid gap-3 bg-white border border-neutral-300 rounded-xl p-3 shadow-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {!user && (
                <Link href="/login" className={navLinkClass('/login')}>Login</Link>
              )}
              {user && (
                <>
                  {user.role === 'reporter' && (
                    <>
                      <Link href="/tickets/new" className={navLinkClass('/tickets/new')}>New Ticket</Link>
                      <Link href="/tickets/mine" className={navLinkClass('/tickets/mine')}>My Tickets</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                    <Link href="/admin" className={navLinkClass('/admin')}>Admin Dashboard</Link>
                  )}
                  {user.role === 'technician' && (
                    <Link href="/tech" className={navLinkClass('/tech')}>My Assignments</Link>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user && <span className="text-gray-700">Hi, {user.name}</span>}
              {user && (
                <button onClick={() => { clearToken(); location.href = '/' }} className="h-9 px-3 border rounded-md text-black border-neutral-300 hover:bg-neutral-100">Logout</button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

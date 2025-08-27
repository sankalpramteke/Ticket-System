'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, saveToken } from '@/lib/clientAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // or 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const res = await apiFetch(path, { method: 'POST', body })
      saveToken(res.token)
      router.push('/tickets/mine')
    } catch (err) {
      setError(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white border rounded-xl p-8">
        <h1 className="text-3xl font-semibold mb-6">{mode === 'login' ? 'Login' : 'Register'}</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <div>
              <label className="block text-base mb-1.5">Name</label>
              <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" />
            </div>
          )}
          <div>
            <label className="block text-base mb-1.5">Email</label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@college.edu" />
          </div>
          <div>
            <label className="block text-base mb-1.5">Password</label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-red-600 text-base">{error}</p>}
          <Button disabled={loading} type="submit">
            {loading ? (<><Spinner size={16} /> <span className="ml-2">Please wait...</span></>) : (mode === 'login' ? 'Login' : 'Create account')}
          </Button>
        </form>
        <div className="mt-4 text-base">
          {mode === 'login' ? (
            <button onClick={()=>setMode('register')} className="underline">New user? Register</button>
          ) : (
            <button onClick={()=>setMode('login')} className="underline">Already have an account? Login</button>
          )}
        </div>
      </div>
    </div>
  )
}

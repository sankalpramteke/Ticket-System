'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/clientAuth'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const categories = ['AC','Computer','Electrical','Plumbing','Network','Software','Hardware','Furniture','Cleaning','Carpentry','Painting','Security','Printer','Internet','Laboratory','Classroom AV','Other']
const departments = ['DIC','CSE','Civil','Mechanical','AI','AIML','MBA','Electrical','Eloctronics','ETC']

export default function NewTicketPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title:'', description:'', category:'Electrical', room:'', department:'DIC' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiFetch('/api/tickets', { method: 'POST', body: form })
      router.push('/tickets/mine')
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Ticket</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white border rounded-xl p-4 sm:p-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <Input name="title" value={form.title} onChange={onChange} placeholder="What is the issue?" required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Description</label>
          <Textarea name="description" rows={4} value={form.description} onChange={onChange} placeholder="desribe the problem." required />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <Select name="category" value={form.category} onChange={onChange}>
              {categories.map(c=> <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Room</label>
            <Input name="room" value={form.room} onChange={onChange} placeholder=" e.g. D-02, E-05" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department</label>
            <Select name="department" value={form.department} onChange={onChange}>
              {departments.map(d=> <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button disabled={loading} type="submit">
          {loading ? (<><Spinner size={16} /> <span className="ml-2">Submitting...</span></>) : 'Create Ticket'}
        </Button>
      </form>
    </div>
  )
}

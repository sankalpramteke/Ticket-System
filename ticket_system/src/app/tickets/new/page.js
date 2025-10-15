'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/clientAuth'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

const categories = ['Application','Hardware','Network','Operating System']
const subcategoriesMap = {
  Application: [
    'Mail','Antivirus','PDF Editor','MS Office','HRMS Portal','Teams','Spectrum','Tally ERP',
    'Designing Application','Website Access','Digital Signature','Webex','Email & Support'
  ],
  Hardware: [
    'Data Card','Printer','Switch','Desktop','Connector Crimp','LCD/Projector','Interactive Board',
    'Laptop','Tablet','Barcode Scanner','Server','Router','Scanner Problem','Printer Toner',
    'Mouse/Keyboard','Access Point','CCTV','HDD','CMOS','Motherboard','Hardware Maintenance'
  ],
  Network: [
    'Internet','IP Configuration','Wireless Network','Switch Config','Firewall User','Cable Laying',
    'Certificate/FW','Network Troubleshoot','Site Visit','Link Issue','Bandwidth'
  ],
  'Operating System': [
    'OS Installation','OS Repair','Linux','Mac','Windows Error','Windows Update'
  ]
}
const departments = ['DIC','CSE','Civil','Mechanical','AI','AIML','MBA','Electrical','Electronics','ETC']

export default function NewTicketPage() {
  const router = useRouter()
  const [form, setForm] = useState({ description:'', category:'', subCategory:'', issuerName:'', room:'', department:'DIC' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const onCategoryChange = (e) => {
    const category = e.target.value
    setForm(f => ({ ...f, category, subCategory: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const title = form.description?.trim().slice(0, 100) || 'Ticket'
      const body = { ...form, title }
      await apiFetch('/api/tickets', { method: 'POST', body })
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
          <label className="block text-sm text-gray-600 mb-1">Name <span className="text-red-600">*</span></label>
          <Input name="issuerName" value={form.issuerName} onChange={onChange} placeholder="Your full name" required autoFocus />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category <span className="text-red-600">*</span></label>
            <Select name="category" value={form.category} onChange={onCategoryChange} required>
              <option value="" disabled>Select category</option>
              {categories.map(c=> <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Sub-Category <span className="text-red-600">*</span></label>
            <Select name="subCategory" value={form.subCategory} onChange={onChange} required disabled={!form.category}>
              <option value="" disabled>Select sub-category</option>
              {(subcategoriesMap[form.category] || ['General']).map(sc => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Description <span className="text-red-600">*</span></label>
          <Textarea name="description" rows={4} value={form.description} onChange={onChange} placeholder="Describe the problem" required />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Room/Lab <span className="text-red-600">*</span></label>
            <Input name="room" value={form.room} onChange={onChange} placeholder=" e.g. D-02, E-05" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Department <span className="text-red-600">*</span></label>
            <Select name="department" value={form.department} onChange={onChange} required>
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


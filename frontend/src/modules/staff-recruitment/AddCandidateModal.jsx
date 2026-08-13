import { useState } from 'react'
import { Modal, useToast } from '../../shared/components'
import { useAddCandidateMutation } from './api'

export function AddCandidateModal({ recruitmentId, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', qualifications: '', experience: '' })
  const [addCandidate, { isLoading }] = useAddCandidateMutation()
  const { push } = useToast()

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await addCandidate({ recruitmentId, ...form }).unwrap()
      push(`Candidate "${form.name}" added`)
      onClose()
    } catch (err) {
      push(err.data?.message ?? 'Could not add candidate', { tone: 'danger' })
    }
  }

  return (
    <Modal title="Add Candidate" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="candidate-name">
            Name
          </label>
          <input id="candidate-name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="candidate-email">
            Email
          </label>
          <input id="candidate-email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="candidate-phone">
            Phone
          </label>
          <input id="candidate-phone" className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="candidate-experience">
            Experience
          </label>
          <input id="candidate-experience" className="input" value={form.experience} onChange={(e) => set('experience', e.target.value)} />
        </div>
        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

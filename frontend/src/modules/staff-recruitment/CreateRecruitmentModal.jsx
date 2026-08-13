import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal, useToast } from '../../shared/components'
import { useCreateRecruitmentMutation } from './api'

export function CreateRecruitmentModal({ onClose }) {
  const [role, setRole] = useState('')
  const [createRecruitment, { isLoading }] = useCreateRecruitmentMutation()
  const { push } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const recruitment = await createRecruitment({ role }).unwrap()
      push(`Recruitment "${role}" created`)
      onClose()
      navigate(recruitment.id)
    } catch (err) {
      push(err.data?.message ?? 'Could not create recruitment', { tone: 'danger' })
    }
  }

  return (
    <Modal title="Create Recruitment" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="recruitment-role">
            Role
          </label>
          <input id="recruitment-role" className="input" value={role} onChange={(e) => setRole(e.target.value)} required autoFocus />
        </div>
        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

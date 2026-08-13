import { useState } from 'react'
import { Modal, useToast } from '../../shared/components'
import { useInviteStaffMutation } from './api'

export function InviteStaffModal({ onClose }) {
  const [accountId, setAccountId] = useState('')
  const [inviteStaff, { isLoading }] = useInviteStaffMutation()
  const { push } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await inviteStaff({ accountId }).unwrap()
      push('Invitation sent')
      onClose()
    } catch (err) {
      push(err.data?.message ?? 'Could not send invitation', { tone: 'danger' })
    }
  }

  return (
    <Modal title="Invite Staff" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="account-id">
            Account ID
          </label>
          <input
            id="account-id"
            className="input"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Inviting…' : 'Invite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

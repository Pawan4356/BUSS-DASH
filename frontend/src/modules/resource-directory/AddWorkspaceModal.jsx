import { useState } from 'react'
import { Modal, useToast } from '../../shared/components'
import { useCreateWorkspaceMutation } from './api'

export function AddWorkspaceModal({ onClose }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [createWorkspace, { isLoading }] = useCreateWorkspaceMutation()
  const { push } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createWorkspace({ name, type: type || undefined }).unwrap()
      push(`Workspace "${name}" created`)
      onClose()
    } catch (err) {
      push(err.data?.message ?? 'Could not create workspace', { tone: 'danger' })
    }
  }

  return (
    <Modal title="Add Workspace" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="workspace-name">
            Name
          </label>
          <input id="workspace-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="workspace-type">
            Type
          </label>
          <input id="workspace-type" className="input" value={type} onChange={(e) => setType(e.target.value)} />
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

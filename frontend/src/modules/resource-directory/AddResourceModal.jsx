import { useState } from 'react'
import { Modal, useToast } from '../../shared/components'
import { RESOURCE_CATEGORY_PRESETS } from '../../shared/ui-tags'
import { useCreateResourceMutation } from './api'

export function AddResourceModal({ onClose }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [category, setCategory] = useState('')
  const [createResource, { isLoading }] = useCreateResourceMutation()
  const { push } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createResource({ name, quantity: Number(quantity), category: category || undefined }).unwrap()
      push(quantity > 1 ? `${quantity} resources created` : `Resource "${name}" created`)
      onClose()
    } catch (err) {
      push(err.data?.message ?? 'Could not create resource', { tone: 'danger' })
    }
  }

  return (
    <Modal title="Add Resource" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="resource-name">
            Name
          </label>
          <input id="resource-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="resource-quantity">
            Quantity
          </label>
          <input
            id="resource-quantity"
            type="number"
            min={1}
            className="input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="resource-category">
            Category
          </label>
          <input id="resource-category" className="input" list="resource-category-presets" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="resource-category-presets">
            {RESOURCE_CATEGORY_PRESETS.map((preset) => (
              <option key={preset} value={preset} />
            ))}
          </datalist>
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

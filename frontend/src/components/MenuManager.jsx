import { useState } from 'react'
import { motion } from 'framer-motion'
import './MenuManager.css'

const initialForm = {
  name: '',
  category: 'coffee',
  price: '',
  description: '',
  image_url: '',
}

const MenuManager = ({ products, onAddProduct, onRemoveProduct, busy }) => {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState('')
  const [statusType, setStatusType] = useState('idle')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setStatusType('loading')
      setStatus('Adding item...')
      await onAddProduct(form)
      setForm(initialForm)
      setStatusType('success')
      setStatus('Item added to the menu.')
    } catch (error) {
      setStatusType('error')
      setStatus(error.message || 'Unable to add item.')
    }
  }

  const handleRemove = async (id) => {
    try {
      setStatusType('loading')
      setStatus('Removing item...')
      await onRemoveProduct(id)
      setStatusType('success')
      setStatus('Item removed from the menu.')
    } catch (error) {
      setStatusType('error')
      setStatus(error.message || 'Unable to remove item.')
    }
  }

  return (
    <section className="manager">
      <div className="manager__head">
        <div>
          <span className="manager__eyebrow">Menu Manager</span>
          <h3>Add or remove coffee and snacks in real time</h3>
        </div>
      </div>

      <form className="manager__form" onSubmit={handleSubmit}>
        <input name="name" placeholder="Item name" value={form.name} onChange={handleChange} required />
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="coffee">Coffee</option>
          <option value="snack">Snack</option>
        </select>
        <input name="price" type="number" min="0.01" step="0.01" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input name="image_url" placeholder="Image URL (optional)" value={form.image_url} onChange={handleChange} />
        <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.98 }}>
          Add Item
        </motion.button>
      </form>

      {status ? <p className={`manager__status manager__status--${statusType}`}>{status}</p> : null}

      <div className="manager__list">
        {products.map((product) => (
          <div key={product.id} className="manager__item">
            <div>
              <strong>{product.name}</strong>
              <span>{product.category} - ${Number(product.price).toFixed(2)}</span>
            </div>
            <button type="button" onClick={() => handleRemove(product.id)} disabled={busy}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default MenuManager


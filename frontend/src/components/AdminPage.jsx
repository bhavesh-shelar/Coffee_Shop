import { useEffect, useState } from 'react'
import axios from 'axios'
import MenuManager from './MenuManager.jsx'
import './MenuManager.css'

const AdminPage = () => {
  const [products, setProducts] = useState([])
  const [busy, setBusy] = useState(false)

  const loadProducts = async () => {
    try {
      const response = await axios.get('/api/products')
      setProducts(response.data || [])
    } catch (err) {
      console.error('Unable to load products:', err)
      setProducts([])
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const handleAddProduct = async (product) => {
    setBusy(true)
    try {
      await axios.post('/api/products', product)
      await loadProducts()
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveProduct = async (id) => {
    setBusy(true)
    try {
      await axios.delete(`/api/products/${id}`)
      await loadProducts()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="menu-manager">
      <MenuManager products={products} onAddProduct={handleAddProduct} onRemoveProduct={handleRemoveProduct} busy={busy} />
    </div>
  )
}

export default AdminPage

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MenuManager from './MenuManager.jsx'
import './MenuManager.css'

const AdminPage = () => {
  const [status, setStatus] = useState({ loaded: false, data: null, error: null })
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('all')
  const [busy, setBusy] = useState(false)

  const loadHealth = async () => {
    setStatus({ loaded: false, data: null, error: null })
    try {
      const response = await axios.get('/api/health')
      setStatus({ loaded: true, data: response.data, error: null })
    } catch (err) {
      setStatus({ loaded: true, data: null, error: err?.message || 'Unable to load health' })
    }
  }

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
    loadHealth()
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

  const filteredProducts = useMemo(() => {
    if (category === 'all') return products
    return products.filter((item) => item.category === category)
  }, [category, products])

  return (
    <div className="menu-manager">
      <h2>Admin Dashboard</h2>
      <p>Control and configure the menu directly from the admin view.</p>

      <div className="menu-manager__section">
        <button className="btn" type="button" onClick={loadHealth}>
          Refresh Health Check
        </button>
        <button className="btn" type="button" onClick={loadProducts}>
          Refresh Products
        </button>
      </div>

      <div className="menu-manager__section" style={{ marginBottom: '1rem' }}>
        <strong>Product filter:</strong>
        <button className="btn" type="button" onClick={() => setCategory('all')}>
          All
        </button>
        <button className="btn" type="button" onClick={() => setCategory('coffee')}>
          Coffee
        </button>
        <button className="btn" type="button" onClick={() => setCategory('snack')}>
          Snack
        </button>
      </div>

      <div className="menu-manager__section">
        {status.loaded ? (
          status.error ? (
            <div className="menu-manager__error">Health API error: {status.error}</div>
          ) : (
            <pre className="menu-manager__pre">{JSON.stringify(status.data, null, 2)}</pre>
          )
        ) : (
          <div>Loading status...</div>
        )}
      </div>

      <div className="menu-manager__section" style={{ marginTop: '2rem' }}>
        <h3>Manage Products (Coffee/Snacks)</h3>
        <MenuManager
          products={filteredProducts}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
          busy={busy}
        />
      </div>
    </div>
  )
}

export default AdminPage

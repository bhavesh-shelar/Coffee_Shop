import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import Cart from './components/Cart.jsx'
import CoffeePage from './components/CoffeePage.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './components/HomePage.jsx'
import Nav from './components/Nav.jsx'
import SnackPage from './components/SnackPage.jsx'
import AdminPage from './components/AdminPage.jsx'
import './App.css'

const mockProducts = [
  { id: 1, name: 'Espresso', category: 'coffee', price: 2.5, description: 'Strong shot espresso with a rich crema finish.', image_url: 'https://th.bing.com/th/id/OIP.cQYK3Iza-CP0kFA2UsjIWQHaE8?w=250&h=180&c=7&r=0&o=7&pid=1.7&rm=3' },
  { id: 2, name: 'Latte', category: 'coffee', price: 4, description: 'Smooth creamy latte with velvety steamed milk.', image_url: 'https://images.unsplash.com/photo-1572448895856-6e157307fc69?w=400&h=300&fit=crop' },
  { id: 3, name: 'Cappuccino', category: 'coffee', price: 3.75, description: 'Balanced espresso, milk, and cloud-soft foam.', image_url: 'https://images.unsplash.com/photo-1509043759401-51ee732cec44?w=400&h=300&fit=crop' },
  { id: 4, name: 'Americano', category: 'coffee', price: 2.75, description: 'Bold Americano brewed for a clean finish.', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
  { id: 5, name: 'Mocha', category: 'coffee', price: 4.5, description: 'Rich chocolate mocha with espresso depth.', image_url: 'https://images.unsplash.com/photo-1534623084325-16e7e19ee3eb?w=400&h=300&fit=crop' },
  { id: 6, name: 'Flat White', category: 'coffee', price: 4.25, description: 'Velvety flat white with silky microfoam.', image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop' },
  { id: 7, name: 'Chocolate Chip Cookies', category: 'snack', price: 1.5, description: 'Warm chocolate cookies with gooey centers.', image_url: 'https://images.unsplash.com/photo-1561843191-70c806aa6999?w=400&h=300&fit=crop' },
  { id: 8, name: 'Blueberry Muffin', category: 'snack', price: 2.75, description: 'Fresh blueberry muffin baked every morning.', image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop' },
  { id: 9, name: 'Ham Sandwich', category: 'snack', price: 5, description: 'Toasted ham sandwich on artisan bread.', image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
  { id: 10, name: 'Croissant', category: 'snack', price: 3, description: 'Flaky golden croissant with buttery layers.', image_url: 'https://images.unsplash.com/photo-1507646225500-1c0a81f43554?w=400&h=300&fit=crop' },
  { id: 11, name: 'Donut', category: 'snack', price: 2.25, description: 'Glazed sprinkle donut with a soft crumb.', image_url: 'https://images.unsplash.com/photo-1579898828006-1df72e47efa6?w=400&h=300&fit=crop' },
]

const pageMeta = {
  home: {
    eyebrow: 'Freshly Brewed Experience',
    title: 'Coffee crafted for slow mornings and quick cravings.',
    subtitle: 'Browse premium coffee, bakery favorites, and an animated cart that stays responsive even when the backend is offline.',
  },
  coffee: {
    eyebrow: 'Barista Specials',
    title: 'Signature coffee menu with creamy classics and bold roasts.',
    subtitle: 'Explore the full coffee lineup, search instantly, and add drinks to your cart with smooth card motion.',
  },
  snack: {
    eyebrow: 'Bakery Counter',
    title: 'Snack pairings that make every cup better.',
    subtitle: 'From cookies to croissants, every snack card stays interactive, searchable, and ready to order.',
  },
  admin: {
    eyebrow: 'Manager Tools',
    title: 'Admin Dashboard & Health Monitoring',
    subtitle: 'Refresh backend health checks, view database mode, and manage menu data from one place.',
  },
}

const validPages = new Set(['home', 'coffee', 'snack', 'admin'])

const getPageFromHash = () => {
  if (typeof window === 'undefined') {
    return 'home'
  }
  const hashPage = window.location.hash.replace('#', '').trim().toLowerCase()
  return validPages.has(hashPage) ? hashPage : 'home'
}

const pageTransition = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.35, ease: 'easeOut' },
}

const normalizeProduct = (product) => ({
  ...product,
  id: Number(product.id),
  category: product.category === 'snack' ? 'snack' : 'coffee',
  name: String(product.name || ''),
  price: Number(product.price),
  description: String(product.description || ''),
  image_url: String(product.image_url || ''),
})

const normalizeProducts = (list) =>
  Array.isArray(list)
    ? list
        .map(normalizeProduct)
        .filter((product) => product.id > 0 && product.name && Number.isFinite(product.price) && product.price > 0)
    : []

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiMode, setApiMode] = useState('loading')
  const [menuBusy, setMenuBusy] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({ name: '', message: '' })
  const [feedbackStatus, setFeedbackStatus] = useState('')
  const [feedbackItems, setFeedbackItems] = useState([
    { id: 1, name: 'Priya', message: 'Loved the cappuccino. Please add sugar-free options too.' },
    { id: 2, name: 'Aman', message: 'Delivery was fast and coffee arrived hot. Great service!' },
  ])

  useEffect(() => {
    const onHashChange = () => {
      setCurrentPage(getPageFromHash())
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/products')
        const apiProducts = normalizeProducts(response.data)
        setProducts(apiProducts.length > 0 ? apiProducts : mockProducts)
        setApiMode('connected')
      } catch (error) {
        console.error('Error fetching products:', error)
        setProducts(normalizeProducts(mockProducts))
        setApiMode('fallback')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    let rafId = null
    let latestX = 0
    let latestY = 0

    const commitParallax = () => {
      root.style.setProperty('--parallax-x', latestX.toFixed(4))
      root.style.setProperty('--parallax-y', latestY.toFixed(4))
      rafId = null
    }

    const handlePointerMove = (event) => {
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      latestX = Math.max(-1, Math.min(1, (event.clientX - centerX) / centerX))
      latestY = Math.max(-1, Math.min(1, (event.clientY - centerY) / centerY))

      if (!rafId) {
        rafId = window.requestAnimationFrame(commitParallax)
      }
    }

    const resetParallax = () => {
      latestX = 0
      latestY = 0
      if (!rafId) {
        rafId = window.requestAnimationFrame(commitParallax)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('blur', resetParallax)
    window.addEventListener('pointerleave', resetParallax)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('blur', resetParallax)
      window.removeEventListener('pointerleave', resetParallax)
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      root.style.setProperty('--parallax-x', '0')
      root.style.setProperty('--parallax-y', '0')
    }
  }, [])

  const currentMeta = pageMeta[currentPage]
  const menuCount = products.length

  const handlePageChange = (nextPage) => {
    if (!validPages.has(nextPage)) {
      return
    }

    setCurrentPage(nextPage)
    if (typeof window === 'undefined') {
      return
    }

    if (nextPage === 'home') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      return
    }

    window.location.hash = nextPage
  }

  const addProduct = async (rawProduct) => {
    const payload = {
      ...rawProduct,
      price: Number(rawProduct.price),
    }

    setMenuBusy(true)
    try {
      const response = await axios.post('/api/products', payload)
      const created = normalizeProduct(response.data)
      setProducts((current) => [...current, created])
      setApiMode('connected')
    } catch (error) {
      const status = error?.response?.status
      const shouldFallbackToLocal = !error.response || status === 404 || status === 405

      if (!shouldFallbackToLocal) {
        throw new Error(error?.response?.data?.error || 'Unable to add product.')
      }

      // Fallback for old backend instances without /api/products support.
      setProducts((current) => {
        const nextId = current.reduce((maxId, item) => Math.max(maxId, Number(item.id) || 0), 0) + 1
        return [...current, normalizeProduct({ id: nextId, ...payload })]
      })
      setApiMode('fallback')
    } finally {
      setMenuBusy(false)
    }
  }

  const removeProduct = async (id) => {
    const productId = Number(id)

    setMenuBusy(true)
    try {
      await axios.delete(`/api/products/${productId}`)
      setProducts((current) => current.filter((item) => item.id !== productId))
      setApiMode('connected')
    } catch (error) {
      const status = error?.response?.status
      const shouldFallbackToLocal = !error.response || status === 404 || status === 405

      if (!shouldFallbackToLocal) {
        throw new Error(error?.response?.data?.error || 'Unable to remove product.')
      }

      // Fallback for old backend instances without DELETE /api/products/:id.
      setProducts((current) => current.filter((item) => item.id !== productId))
      setApiMode('fallback')
    } finally {
      setMenuBusy(false)
    }
  }

  const content = useMemo(() => {
    if (currentPage === 'admin') {
      return <AdminPage />
    }

    if (currentPage === 'coffee') {
      return <CoffeePage products={products} />
    }

    if (currentPage === 'snack') {
      return <SnackPage products={products} />
    }

    return <HomePage products={products} />
  }, [currentPage, products])

  const handleFeedbackChange = (event) => {
    const { name, value } = event.target
    setFeedbackForm((current) => ({ ...current, [name]: value }))
  }

  const handleFeedbackSubmit = (event) => {
    event.preventDefault()
    const name = String(feedbackForm.name || '').trim()
    const message = String(feedbackForm.message || '').trim()

    if (!name || !message) {
      setFeedbackStatus('Please enter your name and feedback message.')
      return
    }

    setFeedbackItems((current) => [
      { id: Date.now(), name, message },
      ...current.slice(0, 3),
    ])
    setFeedbackForm({ name: '', message: '' })
    setFeedbackStatus('Thank you. Your feedback has been submitted.')
  }

  return (
    <div className="app-shell">
      <div className="app-background app-background-one" />
      <div className="app-background app-background-two" />
      <div className="app-grid" />
      <div className="floating-cups" aria-hidden="true">
        <div className="floating-cup floating-cup--one">
          <span className="floating-steam floating-steam--one" />
          <span className="floating-steam floating-steam--two" />
          <span className="floating-steam floating-steam--three" />
          <span className="floating-cup__body" />
          <span className="floating-cup__handle" />
          <span className="floating-cup__saucer" />
        </div>
        <div className="floating-cup floating-cup--two">
          <span className="floating-steam floating-steam--one" />
          <span className="floating-steam floating-steam--two" />
          <span className="floating-steam floating-steam--three" />
          <span className="floating-cup__body" />
          <span className="floating-cup__handle" />
          <span className="floating-cup__saucer" />
        </div>
        <div className="floating-cup floating-cup--three">
          <span className="floating-steam floating-steam--one" />
          <span className="floating-steam floating-steam--two" />
          <span className="floating-steam floating-steam--three" />
          <span className="floating-cup__body" />
          <span className="floating-cup__handle" />
          <span className="floating-cup__saucer" />
        </div>
        <div className="floating-cup floating-cup--four">
          <span className="floating-steam floating-steam--one" />
          <span className="floating-steam floating-steam--two" />
          <span className="floating-steam floating-steam--three" />
          <span className="floating-cup__body" />
          <span className="floating-cup__handle" />
          <span className="floating-cup__saucer" />
        </div>
      </div>

      <Nav currentPage={currentPage} onPageChange={handlePageChange} />

      <main className="app-main">
        <section className="app-content">
          <motion.header
            className="hero-card"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="hero-copy">
              <span className="hero-eyebrow">{currentMeta.eyebrow}</span>
              <h1>{currentMeta.title}</h1>
              <p>{currentMeta.subtitle}</p>
            </div>

            <motion.div
              className="hero-badges"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <div className="hero-badge">
                <span>{menuCount || 12}</span>
                <small>Menu picks</small>
              </div>
              <div className="hero-badge">
                <span>Live</span>
                <small>Cart updates</small>
              </div>
              <div className="hero-badge">
                <span>{apiMode === 'connected' ? 'API' : 'Demo'}</span>
                <small>{apiMode === 'connected' ? 'Backend online' : 'Offline-safe mode'}</small>
              </div>
            </motion.div>
          </motion.header>

          {currentPage === 'coffee' ? (
            <motion.section
              className="coffee-feature"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div className="coffee-feature__circle">
                <img
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&h=900&fit=crop"
                  alt="Signature Arabica Coffee Beans"
                />
                <div className="coffee-feature__overlay">
                  <p>Signature Arabica</p>
                  <strong>Coffee Beans</strong>
                </div>
              </div>

              <div className="coffee-feature__banner">
                <h3>Cold Brew at Home</h3>
                <p>Hot Brew - Ready in 5 Minutes</p>
              </div>
            </motion.section>
          ) : null}

          {loading ? (
            <motion.section className="loading-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="loading-cup">
                <span className="steam steam-one" />
                <span className="steam steam-two" />
                <span className="steam steam-three" />
              </div>
              <h2>Brewing the menu</h2>
              <p>Loading products and preparing the animated storefront.</p>
            </motion.section>
          ) : (
            <AnimatePresence mode="wait">
              <motion.section key={currentPage} className="page-shell" {...pageTransition}>
                {content}
              </motion.section>
            </AnimatePresence>
          )}
        </section>

        <aside className="app-sidebar">
          <Cart />
          <section className="sidebar-showcase">
            <article className="sidebar-showcase__card">
              <p className="sidebar-showcase__eyebrow">Brew Of The Day</p>
              <h3>Caramel Cinnamon Latte</h3>
              <p>Freshly pulled espresso, steamed milk, caramel drizzle, and cinnamon foam.</p>
              <strong>Rs 189</strong>
            </article>

            <article className="sidebar-showcase__card">
              <p className="sidebar-showcase__eyebrow">Cafe Timings</p>
              <p>Mon - Fri: 8:00 AM to 10:00 PM</p>
              <p>Sat - Sun: 9:00 AM to 11:00 PM</p>
            </article>

            <article className="sidebar-showcase__card">
              <p className="sidebar-showcase__eyebrow">Quick Delivery</p>
              <p>Average delivery in 20-30 minutes with live order updates.</p>
            </article>

            <article className="sidebar-showcase__card sidebar-feedback">
              <p className="sidebar-showcase__eyebrow">Customer Query</p>
              <h3>Feedback Corner</h3>
              <form className="sidebar-feedback__form" onSubmit={handleFeedbackSubmit}>
                <input
                  name="name"
                  value={feedbackForm.name}
                  onChange={handleFeedbackChange}
                  placeholder="Your name"
                />
                <textarea
                  name="message"
                  value={feedbackForm.message}
                  onChange={handleFeedbackChange}
                  placeholder="Write your feedback or query"
                  rows={3}
                />
                <button type="submit">Send Feedback</button>
              </form>
              {feedbackStatus ? <p className="sidebar-feedback__status">{feedbackStatus}</p> : null}

              <div className="sidebar-feedback__list">
                {feedbackItems.map((item) => (
                  <div key={item.id} className="sidebar-feedback__item">
                    <strong>{item.name}</strong>
                    <p>{item.message}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </aside>
      </main>

      <Footer />
    </div>
  )
}

export default App

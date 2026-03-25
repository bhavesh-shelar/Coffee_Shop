import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import ProductCard from './ProductCard.jsx'
import './ProductList.css'

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
}

const ProductGrid = ({ products }) => (
  <motion.div className="product-grid" variants={sectionVariants} initial="hidden" animate="show">
    {products.map((product) => (
      <motion.div key={product.id} variants={cardVariants}>
        <ProductCard product={product} />
      </motion.div>
    ))}
  </motion.div>
)

const ProductSection = ({ title, products, accent }) => {
  if (products.length === 0) {
    return null
  }

  return (
    <section className="menu-section">
      <div className="menu-section__title-row">
        <h3>{title}</h3>
        <span className={`menu-section__accent menu-section__accent--${accent}`} />
      </div>
      <ProductGrid products={products} />
    </section>
  )
}

const ProductList = ({ products, title, description, groupByCategory = true }) => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const availableFilters = ['all', ...new Set(products.map((product) => product.category))]

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesFilter = activeFilter === 'all' || product.category === activeFilter
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, products, searchTerm])

  const coffees = filteredProducts.filter((product) => product.category === 'coffee')
  const snacks = filteredProducts.filter((product) => product.category === 'snack')

  return (
    <div className="menu-layout">
      <div className="menu-layout__header">
        <div>
          <span className="menu-layout__eyebrow">Interactive Menu</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="menu-filter">
          {availableFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeFilter === filter ? 'is-active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="search-panel">
        <label className="search-panel__label" htmlFor="menu-search">
          Find your next order
        </label>

        <div className="search-panel__field">
          <span className="search-panel__icon">Search</span>
          <input
            id="menu-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Type espresso, muffin, mocha..."
          />
          {searchTerm ? (
            <button type="button" onClick={() => setSearchTerm('')}>
              Clear
            </button>
          ) : null}
        </div>

        <p className="search-panel__hint">
          {filteredProducts.length} matches in this section. Filters and search update instantly.
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="menu-empty">No matching items right now.</div>
      ) : groupByCategory ? (
        <div className="menu-stack">
          <ProductSection title="Coffee" products={coffees} accent="coffee" />
          <ProductSection title="Snacks" products={snacks} accent="snack" />
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  )
}

export default ProductList

import { motion } from 'framer-motion'

const menuItems = [
  { id: 'home', label: 'Home', icon: 'Home' },
  { id: 'coffee', label: 'Coffee', icon: 'Brew' },
  { id: 'snack', label: 'Snacks', icon: 'Bake' },
]

const Nav = ({ currentPage, onPageChange }) => {
  return (
    <motion.nav
      className="top-nav"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      {menuItems.map((item) => {
        const isActive = currentPage === item.id

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.id)}
            className={`top-nav__item ${isActive ? 'is-active' : ''}`}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="top-nav__icon">{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        )
      })}
    </motion.nav>
  )
}

export default Nav

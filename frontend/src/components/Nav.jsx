import { motion } from 'framer-motion'

const menuItems = [
  { id: 'home', target: 'home', label: 'Home', icon: '⌂' },
  { id: 'brew', target: 'coffee', label: 'BREW', icon: '☕' },
  { id: 'coffee', target: 'coffee', label: 'Coffee', icon: '●' },
  { id: 'bake', target: 'snack', label: 'BAKE', icon: '◐' },
  { id: 'snacks', target: 'snack', label: 'Snacks', icon: '◍' },
]

const Nav = ({ currentPage, onPageChange }) => {
  return (
    <motion.nav
      className="top-nav"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
    >
      {menuItems.map((item) => {
        const isActive = currentPage === item.target

        return (
          <motion.button
            key={item.id}
            type="button"
            onClick={() => onPageChange(item.target)}
            className={`top-nav__item ${isActive ? 'is-active' : ''}`}
            whileHover={{ y: -1 }}
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

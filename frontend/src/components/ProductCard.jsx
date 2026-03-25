import { motion } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import './ProductCard.css'

const LOCAL_PRODUCT_IMAGES = {
  Espresso: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800',
  Latte: 'https://images.pexels.com/photos/1036444/pexels-photo-1036444.jpeg?auto=compress&cs=tinysrgb&w=800',
  Cappuccino: 'https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg?auto=compress&cs=tinysrgb&w=800',
  Americano: 'https://images.pexels.com/photos/1251175/pexels-photo-1251175.jpeg?auto=compress&cs=tinysrgb&w=800',
  Mocha: 'https://images.pexels.com/photos/1233528/pexels-photo-1233528.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Flat White': 'https://images.pexels.com/photos/6205509/pexels-photo-6205509.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Chocolate Chip Cookies': 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Blueberry Muffin': 'https://images.pexels.com/photos/1657343/pexels-photo-1657343.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Ham Sandwich': 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=800',
  Croissant: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=800',
  Donut: 'https://images.pexels.com/photos/4686960/pexels-photo-4686960.jpeg?auto=compress&cs=tinysrgb&w=800',
}

const DEFAULT_IMAGE_BY_CATEGORY = {
  coffee: '/images/coffee-default.svg',
  snack: '/images/snack-default.svg',
}

const ProductCard = ({ product }) => {
  const { addToCart, deleteItem, cart } = useCart()
  const safePrice = Number(product.price || 0)

  const fallbackImage = DEFAULT_IMAGE_BY_CATEGORY[product.category] || DEFAULT_IMAGE_BY_CATEGORY.coffee
  const preferredImage = product.image_url || LOCAL_PRODUCT_IMAGES[product.name] || fallbackImage
  const quantity = cart.filter((item) => item.id === product.id).length

  return (
    <motion.article
      className="product-card"
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <div className="product-card__media">
        <img
          src={preferredImage}
          alt={product.name}
          onError={(event) => {
            if (event.currentTarget.src.includes(fallbackImage)) {
              return
            }
            event.currentTarget.src = fallbackImage
          }}
        />
        <span className={`product-card__tag product-card__tag--${product.category}`}>{product.category}</span>
      </div>

      <div className="product-card__body">
        <div className="product-card__heading">
          <h3>{product.name}</h3>
          <strong>${safePrice.toFixed(2)}</strong>
        </div>
        <p>{product.description}</p>
        <p>{quantity > 0 ? `${quantity} in cart` : 'Ready to add to your order'}</p>

        <div className="product-card__actions">
          <motion.button type="button" className="product-card__button product-card__button--primary" onClick={() => addToCart(product)} whileTap={{ scale: 0.96 }}>
            Add to cart
          </motion.button>
          <motion.button type="button" className="product-card__button product-card__button--ghost" onClick={() => deleteItem(product)} whileTap={{ scale: 0.96 }} disabled={quantity === 0}>
            Remove
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}

export default ProductCard

import { createContext, useContext, useEffect, useReducer } from 'react'

const CartContext = createContext()
const STORAGE_KEY = 'coffee-shop-cart'

const createInitialState = () => {
  if (typeof window === 'undefined') {
    return { cart: [], total: 0 }
  }

  try {
    const storedCart = window.localStorage.getItem(STORAGE_KEY)
    if (!storedCart) {
      return { cart: [], total: 0 }
    }

    const parsedCart = JSON.parse(storedCart)
    const cart = Array.isArray(parsedCart.cart) ? parsedCart.cart : []
    const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0)

    return { cart, total }
  } catch (error) {
    console.error('Unable to restore cart from storage:', error)
    return { cart: [], total: 0 }
  }
}

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const safeItem = {
        ...action.payload,
        price: Number(action.payload?.price || 0),
      }

      return {
        ...state,
        cart: [...state.cart, safeItem],
        total: Number((state.total + safeItem.price).toFixed(2)),
      }
    }
    case 'DELETE_ITEM': {
      const itemIndex = state.cart.findIndex((item) => item.id === action.payload.id)
      if (itemIndex === -1) {
        return state
      }

      const itemToDelete = state.cart[itemIndex]
      return {
        ...state,
        cart: state.cart.filter((_, index) => index !== itemIndex),
        total: Number(Math.max(0, state.total - Number(itemToDelete.price || 0)).toFixed(2)),
      }
    }
    case 'CLEAR_CART':
      return { cart: [], total: 0 }
    default:
      return state
  }
}

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, undefined, createInitialState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart: cart.cart }))
  }, [cart])

  const addToCart = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product })
  }

  const deleteItem = (product) => {
    dispatch({ type: 'DELETE_ITEM', payload: product })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider
      value={{
        cart: cart.cart,
        total: cart.total,
        addToCart,
        deleteItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

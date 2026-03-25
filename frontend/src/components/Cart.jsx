import axios from 'axios'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'
import './Cart.css'

const Cart = () => {
  const { cart, total, clearCart, deleteItem } = useCart()
  const [checkoutState, setCheckoutState] = useState({ status: 'idle', message: '' })
  const [paymentState, setPaymentState] = useState({
    open: false,
    sessionId: '',
    upiUrl: '',
    qrUrl: '',
    amount: 0,
    payeeName: '',
    upiVpa: '',
    upiRef: '',
    confirming: false,
    error: '',
  })

  const startUpiCheckout = async () => {
    if (cart.length === 0) {
      return
    }

    try {
      setCheckoutState({ status: 'loading', message: 'Preparing secure UPI payment...' })
      const response = await axios.post('/api/payments/upi/init', { items: cart, total })
      setPaymentState({
        open: true,
        sessionId: response.data?.payment_session_id || '',
        upiUrl: response.data?.upi_url || '',
        qrUrl: response.data?.qr_url || '',
        amount: Number(response.data?.amount || total),
        payeeName: response.data?.payee_name || 'Coffee Shop',
        upiVpa: response.data?.upi_vpa || '',
        upiRef: response.data?.upi_transaction_ref || '',
        confirming: false,
        error: '',
      })
      setCheckoutState({ status: 'idle', message: 'UPI checkout opened. Complete payment to place order.' })
    } catch (error) {
      console.error('UPI payment init failed:', error)
      setCheckoutState({
        status: 'error',
        message: error.response?.data?.error || 'Unable to start UPI payment right now. Please try again.',
      })
    }
  }

  const openUpiApp = () => {
    if (!paymentState.upiUrl) {
      return
    }
    window.location.href = paymentState.upiUrl
  }

  const closePaymentModal = () => {
    if (paymentState.confirming) {
      return
    }
    setPaymentState((current) => ({ ...current, open: false, error: '' }))
  }

  const confirmUpiPayment = async () => {
    if (!paymentState.sessionId) {
      setPaymentState((current) => ({ ...current, error: 'Missing payment session. Please start checkout again.' }))
      return
    }

    try {
      setPaymentState((current) => ({ ...current, confirming: true, error: '' }))
      const response = await axios.post('/api/payments/upi/confirm', {
        payment_session_id: paymentState.sessionId,
        upi_transaction_ref: paymentState.upiRef,
      })
      const orderId = response.data?.id ? `#${response.data.id}` : 'received'
      clearCart()
      setPaymentState({
        open: false,
        sessionId: '',
        upiUrl: '',
        qrUrl: '',
        amount: 0,
        payeeName: '',
        upiVpa: '',
        upiRef: '',
        confirming: false,
        error: '',
      })
      setCheckoutState({ status: 'success', message: `Payment successful. Order ${orderId} is confirmed.` })
    } catch (error) {
      console.error('UPI payment confirm failed:', error)
      setPaymentState((current) => ({
        ...current,
        confirming: false,
        error: error.response?.data?.error || 'Unable to confirm payment. Please try again.',
      }))
    }
  }

  return (
    <>
      <motion.div
        className="cart-panel"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="cart-panel__header">
          <div>
            <p className="cart-panel__eyebrow">Live Cart</p>
            <h2>Order Summary</h2>
          </div>
          <span className="cart-panel__count">{cart.length} items</span>
        </div>

        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              key="empty"
              className="cart-panel__empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span className="cart-panel__empty-orb" />
              <p>Add a drink or snack to see your total update instantly.</p>
            </motion.div>
          ) : (
            <motion.div key="items" className="cart-panel__items" layout>
              {cart.map((item, index) => (
                <motion.div
                  key={`${item.id}-${index}`}
                  className="cart-item"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.22, delay: index * 0.03 }}
                  layout
                >
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.category}</span>
                  </div>
                  <div className="cart-item__actions">
                    <em>${Number(item.price || 0).toFixed(2)}</em>
                    <button type="button" onClick={() => deleteItem(item)}>
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="cart-panel__total">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>

        {checkoutState.message ? (
          <p className={`cart-panel__status cart-panel__status--${checkoutState.status}`}>{checkoutState.message}</p>
        ) : null}

        <motion.button
          type="button"
          onClick={startUpiCheckout}
          disabled={cart.length === 0 || checkoutState.status === 'loading'}
          className="cart-panel__checkout"
          whileHover={cart.length > 0 ? { scale: 1.01 } : {}}
          whileTap={cart.length > 0 ? { scale: 0.99 } : {}}
        >
          {checkoutState.status === 'loading' ? 'Opening UPI...' : 'Pay with UPI'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {paymentState.open ? (
          <motion.div className="upi-modal__backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="upi-modal"
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 18 }}
            >
              <h3>UPI Payment</h3>
              <p className="upi-modal__amount">Amount: Rs {paymentState.amount.toFixed(2)}</p>
              <p className="upi-modal__meta">Payee: {paymentState.payeeName}</p>
              <p className="upi-modal__meta">UPI ID: {paymentState.upiVpa}</p>

              {paymentState.qrUrl ? <img src={paymentState.qrUrl} alt="UPI QR Code" className="upi-modal__qr" /> : null}

              <label htmlFor="upi-ref-input" className="upi-modal__label">
                UPI Ref / UTR Number
              </label>
              <input
                id="upi-ref-input"
                type="text"
                value={paymentState.upiRef}
                onChange={(event) => setPaymentState((current) => ({ ...current, upiRef: event.target.value }))}
                placeholder="Enter UPI reference after payment"
              />

              {paymentState.error ? <p className="cart-panel__status cart-panel__status--error">{paymentState.error}</p> : null}

              <div className="upi-modal__actions">
                <button type="button" className="upi-modal__open-btn" onClick={openUpiApp}>
                  Open UPI App
                </button>
                <button type="button" className="upi-modal__confirm-btn" onClick={confirmUpiPayment} disabled={paymentState.confirming}>
                  {paymentState.confirming ? 'Confirming...' : 'I Have Paid'}
                </button>
                <button type="button" className="upi-modal__cancel-btn" onClick={closePaymentModal} disabled={paymentState.confirming}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default Cart

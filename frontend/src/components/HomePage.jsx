import MenuManager from './MenuManager.jsx'
import ProductList from './ProductList.jsx'

const HomePage = ({ products, onAddProduct, onRemoveProduct, menuBusy }) => {
  return (
    <>
      <MenuManager products={products} onAddProduct={onAddProduct} onRemoveProduct={onRemoveProduct} busy={menuBusy} />
      <ProductList products={products} title="Full Menu" description="Everything available right now, grouped by coffee and snacks." />
    </>
  )
}

export default HomePage

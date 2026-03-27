import ProductList from './ProductList.jsx'

const HomePage = ({ products }) => {
  return (
    <>
      <ProductList products={products} title="Full Menu" description="Everything available right now, grouped by coffee and snacks." />
    </>
  )
}

export default HomePage

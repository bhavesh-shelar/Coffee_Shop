import ProductList from './ProductList.jsx'

const SnackPage = ({ products }) => {
  const snackProducts = products.filter((product) => product.category === 'snack')

  return (
    <>
      <ProductList
        products={snackProducts}
        title="Snacks Menu"
        description="Fresh bakes and quick bites designed to pair perfectly with your cup."
        groupByCategory={false}
      />
    </>
  )
}

export default SnackPage

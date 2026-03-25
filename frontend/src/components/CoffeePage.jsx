import ProductList from './ProductList.jsx'

const CoffeePage = ({ products }) => {
  const coffeeProducts = products.filter((product) => product.category === 'coffee')

  return (
    <>
      <ProductList
        products={coffeeProducts}
        title="Coffee Menu"
        description="Espresso-forward classics, creamy signatures, and smooth everyday favorites."
        groupByCategory={false}
      />
    </>
  )
}

export default CoffeePage

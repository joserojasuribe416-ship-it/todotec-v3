import { fetchProducts, fetchCategories, fetchBrands, fetchNecessities } from '../../lib/api'
import CatalogClient from './CatalogClient'

export default async function CatalogPage({ searchParams }) {
  const params = {
    store_only: 'true',
    ...(searchParams.category ? { category: searchParams.category } : {}),
    ...(searchParams.search   ? { search: searchParams.search }   : {}),
  }
  const [products, categories, brands, necessities] = await Promise.all([
    fetchProducts(params),
    fetchCategories(),
    fetchBrands(),
    fetchNecessities()
  ])

  return (
    <CatalogClient
      products={products}
      categories={categories}
      brands={brands}
      necessities={necessities}
      activeCategory={searchParams.category || ''}
      activeBrand={searchParams.brand || ''}
      activeNecessity={searchParams.necessity ? parseInt(searchParams.necessity) : null}
      activeSearch={searchParams.search || ''}
    />
  )
}

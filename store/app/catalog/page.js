import { fetchProducts, fetchCategories } from '../../lib/api'
import CatalogClient from './CatalogClient'

export default async function CatalogPage({ searchParams }) {
  const params = {
    store_only: 'true',
    ...(searchParams.category ? { category: searchParams.category } : {}),
    ...(searchParams.search   ? { search: searchParams.search }   : {}),
  }
  const [products, categories] = await Promise.all([fetchProducts(params), fetchCategories()])

  return (
    <CatalogClient
      products={products}
      categories={categories}
      activeCategory={searchParams.category || ''}
      activeSearch={searchParams.search || ''}
    />
  )
}

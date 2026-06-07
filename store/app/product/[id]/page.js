import { fetchProduct, getImageUrl } from '../../../lib/api'
import ProductDetail from './ProductDetail'
import { notFound } from 'next/navigation'

export default async function ProductPage({ params }) {
  const product = await fetchProduct(params.id)
  if (!product) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <ProductDetail product={product} />
    </div>
  )
}

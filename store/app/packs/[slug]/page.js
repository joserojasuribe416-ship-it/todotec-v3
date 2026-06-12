import { notFound } from 'next/navigation'
import { fetchPack } from '../../../lib/api'
import PackDetail from './PackDetail'

export default async function PackPage({ params }) {
  const pack = await fetchPack(params.slug)
  if (!pack) notFound()
  return <PackDetail pack={pack} />
}

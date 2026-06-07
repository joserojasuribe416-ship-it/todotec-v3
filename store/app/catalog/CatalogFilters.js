'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

export default function CatalogFilters({ categories, activeCategory, activeSearch }) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(activeSearch || '')

  const navigate = (params) => {
    const qs = new URLSearchParams()
    if (params.search) qs.set('search', params.search)
    if (params.category) qs.set('category', params.category)
    router.push(`${pathname}?${qs.toString()}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    navigate({ search, category: activeCategory })
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearch}>
        <label className="block text-sm font-bold text-secondary mb-2">Buscar</label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nombre del producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); navigate({ category: activeCategory }) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={14} />
            </button>
          )}
        </div>
        <button type="submit" className="w-full mt-2 bg-secondary text-white py-2 rounded-xl text-sm font-semibold hover:bg-secondary-light transition-colors">
          Buscar
        </button>
      </form>

      {/* Categories */}
      <div>
        <label className="block text-sm font-bold text-secondary mb-2">Categoría</label>
        <div className="space-y-1">
          <button
            onClick={() => navigate({ search })}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!activeCategory ? 'bg-secondary text-white font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            Todas las categorías
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => navigate({ search, category: cat })}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${activeCategory === cat ? 'bg-primary text-secondary font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { IconSearch, IconLoader2, IconAlertCircle, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { getDesigns, getDesignsBatch } from '../api/n3d'
import DesignCard from '../components/DesignCard'

// how many designs to pull from API total
const TOTAL_DESIGNS = 50

// 4x4 grid looks good on most screens
const PAGE_SIZE = 16


export default function DesignLibrary() {
  const [allDesigns, setAllDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)

  // grab all designs on first load
  // we do client side pagination after this so no more api calls needed
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true)
        setError(null)

        const listData = await getDesigns({ limit: TOTAL_DESIGNS, page: 1 })
        const slugs = listData.data?.map(d => d.slug) || []

        if (slugs.length === 0) {
          setAllDesigns([])
          return
        }

        // batch endpoint caps at 20, gotta chunk it
        const designs = []
        for (let i = 0; i < slugs.length; i += 20) {
          const chunk = slugs.slice(i, i + 20)
          const batchData = await getDesignsBatch(chunk, 'US')
          designs.push(...(batchData.data || []))
        }

        setAllDesigns(designs)
      } catch (err) {
        console.error('Failed to fetch designs:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDesigns()
  }, [])


  // filter based on search box + category buttons
  const filteredDesigns = useMemo(() => {
    return allDesigns.filter(design => {
      // search by title or pokemon name
      const matchesSearch =
        design.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.pokemon?.name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || design.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [allDesigns, searchQuery, categoryFilter])

  // pagination math
  const totalPages = Math.ceil(filteredDesigns.length / PAGE_SIZE)

  const paginatedDesigns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredDesigns.slice(start, start + PAGE_SIZE)
  }, [filteredDesigns, page])

  // go back to pg 1 when search/filter changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery, categoryFilter])


  // loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <IconLoader2 size={32} className="animate-spin text-[var(--accent)] mb-3" />
          <p className="text-[var(--text-secondary)]">Loading designs...</p>
        </div>
      </div>
    )
  }

  // error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <IconAlertCircle size={32} className="text-red-500 mb-3" />
          <p className="text-[var(--text-secondary)] mb-1">Failed to load designs</p>
          <p className="text-xs text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* header w/ search and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Design Library</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Page {page} of {totalPages}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* search input */}
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                pl-9 pr-3 py-2 text-sm rounded border border-[var(--border-color)]
                bg-[var(--bg-secondary)] text-[var(--text-primary)]
                placeholder-[var(--text-secondary)] w-48
                focus:outline-none focus:border-[var(--accent)]
              "
            />
          </div>

          {/* category filter btns */}
          <div className="flex border border-[var(--border-color)] rounded overflow-hidden">
            {['all', 'character', 'standard'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`
                  px-3 py-2 text-sm capitalize
                  ${categoryFilter === cat
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* design grid */}
      {paginatedDesigns.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          No designs found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {paginatedDesigns.map(design => (
            <DesignCard
              key={design.slug}
              design={design}
              showAddButton={false}
            />
          ))}
        </div>
      )}

      {/* pagination controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <IconChevronLeft size={16} />
          Prev
        </button>

        <span className="text-sm text-[var(--text-secondary)]">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-2 text-sm rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <IconChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { IconRefresh, IconX, IconAlertTriangle, IconExternalLink, IconLoader2, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useFilamentInventory } from '../hooks/useFilamentInventory'
import { getDesigns, getDesignsBatch } from '../api/n3d'
import DesignCard from '../components/DesignCard'

const TOTAL_DESIGNS = 50
const PAGE_SIZE = 12  // 4 cols x 3 rows


export default function FilamentCalculator() {
  const {
    inventory,
    printQueue,
    updateStock,
    checkDesignRequirements,
    addToPrintQueue,
    removeFromPrintQueue,
    resetInventory
  } = useFilamentInventory()

  const [shortageAlert, setShortageAlert] = useState(null)
  const [allDesigns, setAllDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('matte')
  const [page, setPage] = useState(1)

  // load designs once on mount, then paginate client side
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true)
        const listData = await getDesigns({ limit: TOTAL_DESIGNS, page: 1 })
        const slugs = listData.data?.map(d => d.slug) || []

        if (slugs.length > 0) {
          // api caps batch at 20 so we chunk
          const designs = []
          for (let i = 0; i < slugs.length; i += 20) {
            const chunk = slugs.slice(i, i + 20)
            const batchData = await getDesignsBatch(chunk, 'US')
            designs.push(...(batchData.data || []))
          }
          setAllDesigns(designs)
        } else {
          setAllDesigns([])
        }
      } catch (err) {
        console.error('Failed to fetch designs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDesigns()
  }, [])

  // pagination
  const totalPages = Math.ceil(allDesigns.length / PAGE_SIZE)

  const paginatedDesigns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return allDesigns.slice(start, start + PAGE_SIZE)
  }, [allDesigns, page])


  // when user clicks add, check if they have enough filament
  const handleAddDesign = (design) => {
    const { requirements, hasShortage } = checkDesignRequirements(design)
    if (hasShortage) {
      setShortageAlert({ design, requirements })
    } else {
      addToPrintQueue(design)
    }
  }

  // user clicked "add anyway" on shortage modal
  const confirmAdd = () => {
    if (shortageAlert) {
      addToPrintQueue(shortageAlert.design)
      setShortageAlert(null)
    }
  }

  // split filaments by series for the tabs
  const matteFilaments = inventory.filter(f => f.series === 'PLA Matte')
  const basicFilaments = inventory.filter(f => f.series === 'PLA Basic')


  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold mb-1">Filament Calculator</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Select desings to add to your wishlist. Each design subtracts filament from inventory. Low stock triggers a purchase prompt with affiliate links.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">

        {/* left sidebar - inventory + wishlist */}
        <div className="space-y-4">
          <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)]">
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-start justify-between">
              <div>
                <h2 className="text-sm font-medium">Filament Inventory</h2>
                <p className="text-xs text-[var(--text-secondary)]">Current amount of filament inventory in-stock</p>
              </div>
              <button
                onClick={resetInventory}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1"
              >
                <IconRefresh size={12} stroke={1.5} />
                Reset
              </button>
            </div>

            {/* matte / basic tabs */}
            <div className="flex border-b border-[var(--border-color)]">
              <button
                onClick={() => setActiveTab('matte')}
                className={`flex-1 px-4 py-2.5 text-sm ${activeTab === 'matte' ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                PLA Matte
              </button>
              <button
                onClick={() => setActiveTab('basic')}
                className={`flex-1 px-4 py-2.5 text-sm ${activeTab === 'basic' ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
              >
                PLA Basic
              </button>
            </div>

            {/* filament grid */}
            <div className="p-3 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {(activeTab === 'matte' ? matteFilaments : basicFilaments).map(f => (
                  <div
                    key={f.filament_id}
                    className={`
                      p-2 rounded border text-xs
                      ${f.stock_grams < 50 ? 'border-red-500/50 bg-red-500/10' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]'}
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-4 h-4 rounded-sm border border-black/20"
                        style={{ backgroundColor: f.hex }}
                      />
                      <span className="truncate text-[var(--text-primary)]">{f.color}</span>
                    </div>
                    <input
                      type="number"
                      value={Math.round(f.stock_grams * 10) / 10}
                      onChange={(e) => updateStock(f.filament_id, Number(e.target.value))}
                      className="
                        w-full px-2 py-1 rounded text-right
                        bg-[var(--bg-primary)] border border-[var(--border-color)]
                        text-[var(--text-primary)] text-xs
                        focus:outline-none focus:border-[var(--accent)]
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                      "
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* wishlist panel - only shows when theres items */}
          {printQueue.length > 0 && (
            <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)]">
              <div className="px-4 py-3 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-medium">Wishlist ({printQueue.length})</h2>
                <p className="text-xs text-[var(--text-secondary)]">Eac design below will subtract the exact amount of filament required from each print</p>
              </div>

              <div className="p-3 space-y-2">
                {printQueue.map((design, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded bg-[var(--bg-tertiary)]"
                  >
                    <div className="w-8 h-8 rounded bg-[var(--bg-primary)] overflow-hidden">
                      <img src={design.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {design.quantity > 1 && <span className="text-[var(--accent)] mr-1">×{design.quantity}</span>}
                        {design.title}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {((design.total_weight_grams || 0) * (design.quantity || 1)).toFixed(1)}g total
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromPrintQueue(idx)}
                      className="p-1 text-[var(--text-secondary)] hover:text-red-400"
                    >
                      <IconX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


        {/* right side - design grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">Add to Wishlist</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconChevronLeft size={16} />
              </button>
              <span className="text-xs text-[var(--text-secondary)]">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-1.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 size={24} className="animate-spin text-[var(--accent)]" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {paginatedDesigns.map(design => (
                <DesignCard
                  key={design.slug}
                  design={design}
                  onAdd={handleAddDesign}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>


      {/* shortage warning modal */}
      {shortageAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg max-w-sm w-full border border-[var(--border-color)]">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
              <IconAlertTriangle size={18} className="text-amber-500" />
              <span className="font-medium">Insufficient Stock</span>
            </div>

            <div className="p-4">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Missing filament for <strong className="text-[var(--text-primary)]">{shortageAlert.design.title}</strong>:
              </p>

              <div className="space-y-2 mb-4">
                {shortageAlert.requirements.filter(r => r.shortage > 0).map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: req.hex || '#666' }}
                      />
                      <span className="text-sm">{req.color}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-red-400">-{req.shortage.toFixed(1)}g</div>
                      {req.product_url && (
                        <a
                          href={req.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5"
                        >
                          Buy <IconExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShortageAlert(null)}
                  className="flex-1 px-3 py-2 text-sm rounded border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAdd}
                  className="flex-1 px-3 py-2 text-sm rounded bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Add Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

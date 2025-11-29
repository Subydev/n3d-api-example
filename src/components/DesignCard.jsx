import { IconClock, IconScale, IconPlus } from '@tabler/icons-react'
import { useImageCache } from '../hooks/useImageCache'
import FilamentSwatch from './FilamentSwatch'
import { getFilamentHex } from '../utils/filamentColors'

export default function DesignCard({ design, onAdd, showAddButton = true, compact = false }) {
  const { title, image_url, print_time, total_weight_grams, pokemon, filaments } = design
  const { src, loading } = useImageCache(image_url, title)

  return (
    <div className="border border-[var(--border-color)] rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
      <div className="aspect-[4/3] bg-[var(--bg-tertiary)] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
          </div>
        ) : (
          <img
            src={src}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {pokemon && (
          <span className="absolute top-2 right-2 text-xs bg-black/60 px-2 py-0.5 rounded">
            #{pokemon.pokedex_number}
          </span>
        )}
      </div>

      <div className={compact ? "p-3" : "p-4"}>
        <h3 className={`font-medium ${compact ? 'text-sm' : 'mb-1'}`}>{title}</h3>

        {compact ? (
          /* Compact mode: just swatches */
          filaments?.length > 0 && (
            <div className="flex flex-wrap gap-1 my-2">
              {filaments.map((filament, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 rounded-full border border-black/20"
                  style={{ backgroundColor: getFilamentHex(filament.filament_id) }}
                  title={filament.color}
                />
              ))}
            </div>
          )
        ) : (
          /* Full mode: all details */
          <>
            {pokemon?.types && (
              <div className="flex gap-1 mb-3">
                {pokemon.types.map(type => (
                  <span
                    key={type}
                    className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                  >
                    {type}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mb-3">
              <span className="flex items-center gap-1">
                <IconClock size={14} stroke={1.5} />
                {print_time}
              </span>
              <span className="flex items-center gap-1">
                <IconScale size={14} stroke={1.5} />
                {total_weight_grams}g
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {filaments?.map((filament, idx) => (
                <FilamentSwatch key={idx} filament={filament} size="sm" />
              ))}
            </div>
          </>
        )}

        {showAddButton && (
          <button
            onClick={() => onAdd?.(design)}
            className={`
              w-full py-2 px-3 text-sm rounded border border-[var(--border-color)]
              bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:text-[var(--accent)]
              transition-colors flex items-center justify-center gap-1.5
            `}
          >
            <IconPlus size={16} stroke={1.5} />
            Add to Wishlist
          </button>
        )}
      </div>
    </div>
  )
}

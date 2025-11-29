import { getFilamentHex } from '../utils/filamentColors'

export default function FilamentSwatch({ filament, size = 'md', showWeight = true }) {
  const { color, filament_id, weight_grams } = filament
  const hex = getFilamentHex(filament_id)

  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  }

  return (
    <div className="relative group">
      <div
        className={`${sizes[size]} rounded-full border border-[var(--border-color)]`}
        style={{ backgroundColor: hex }}
        title={`${color}${weight_grams ? ` • ${weight_grams}g` : ''}`}
      />
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1
        bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-xs
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
        whitespace-nowrap z-10
      ">
        <div className="text-[var(--text-primary)]">{color}</div>
        {showWeight && weight_grams && (
          <div className="text-[var(--text-secondary)]">{weight_grams}g</div>
        )}
      </div>
    </div>
  )
}

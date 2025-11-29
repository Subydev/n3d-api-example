import filaments from '../data/filaments.json'

// the api doesnt return hex colors for filaments, just the id
// so we gotta look it up from our local data file

const hexMap = new Map()

filaments.pla_matte.forEach(f => hexMap.set(f.filament_id, f.hex))
filaments.pla_basic.forEach(f => hexMap.set(f.filament_id, f.hex))


// get hex color by filament id, fallback to gray if not found
export function getFilamentHex(filamentId) {
  return hexMap.get(filamentId) || '#666'
}

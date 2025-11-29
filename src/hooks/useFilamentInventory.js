import { useState, useCallback, useEffect } from 'react'
import defaultFilaments from '../data/filaments.json'

const STORAGE_KEY = 'n3d_filament_inventory'

// Console log styling for storage ops
const logStorage = (action, target, details = '') => {
  console.log(
    `%cStorage %c${action} %c${target}${details ? ` %c${details}` : ''}`,
    'color: #206bc4; font-weight: bold',
    'color: #2fb344',
    'color: #f59e0b',
    details ? 'color: #666' : ''
  )
}

// Flatten the filament data with series info
const getDefaultInventory = () => {
  const inventory = []

  defaultFilaments.pla_matte.forEach(f => {
    inventory.push({ ...f, series: 'PLA Matte' })
  })

  defaultFilaments.pla_basic.forEach(f => {
    inventory.push({ ...f, series: 'PLA Basic' })
  })

  return inventory
}

export function useFilamentInventory() {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      logStorage('Load', 'localStorage', `${parsed.length} filaments`)
      return parsed
    }
    logStorage('Init', 'localStorage', 'using defaults')
    return getDefaultInventory()
  })

  const [printQueue, setPrintQueue] = useState(() => {
    const saved = sessionStorage.getItem('n3d_print_queue')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length > 0) {
        logStorage('Load', 'sessionStorage', `${parsed.length} wishlist items`)
      }
      return parsed
    }
    return []
  })

  // Persist inventory changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory))
  }, [inventory])

  // Update stock for a filament by ID
  const updateStock = useCallback((filamentId, newStock) => {
    setInventory(prev =>
      prev.map(f =>
        f.filament_id === filamentId
          ? { ...f, stock_grams: Math.max(0, newStock) }
          : f
      )
    )
  }, [])

  // Check requirements for a design
  const checkDesignRequirements = useCallback((design) => {
    const requirements = []
    let hasShortage = false

    for (const filament of design.filaments || []) {
      // Match by filament_id if available, otherwise by color name
      const inventoryItem = inventory.find(i =>
        i.filament_id === filament.filament_id ||
        i.color.toLowerCase() === filament.color?.toLowerCase()
      )

      const available = inventoryItem?.stock_grams || 0
      const needed = filament.weight_grams || 0
      const shortage = Math.max(0, needed - available)

      requirements.push({
        filament_id: filament.filament_id || inventoryItem?.filament_id,
        color: filament.color,
        hex: filament.hex || inventoryItem?.hex,
        needed,
        available,
        shortage,
        product_url: filament.product_url
      })

      if (shortage > 0) hasShortage = true
    }

    return { requirements, hasShortage }
  }, [inventory])

  // Add desihn to print queue (or increment quantity if already exists)
  const addToPrintQueue = useCallback((design) => {
    const { requirements } = checkDesignRequirements(design)

    // Subtract from inventory
    setInventory(prev =>
      prev.map(f => {
        const req = requirements.find(r => r.filament_id === f.filament_id)
        if (req) {
          return { ...f, stock_grams: Math.max(0, f.stock_grams - req.needed) }
        }
        return f
      })
    )

    // Check if design already in queue
    const existingIndex = printQueue.findIndex(d => d.slug === design.slug)
    let newQueue

    if (existingIndex >= 0) {
      // Increment quantity
      newQueue = printQueue.map((d, i) =>
        i === existingIndex ? { ...d, quantity: (d.quantity || 1) + 1 } : d
      )
    } else {
      // Add new with quantity 1
      newQueue = [...printQueue, { ...design, quantity: 1, addedAt: Date.now() }]
    }

    setPrintQueue(newQueue)
    sessionStorage.setItem('n3d_print_queue', JSON.stringify(newQueue))
    logStorage('Save', 'sessionStorage', `${newQueue.length} wishlist items`)

    return { requirements }
  }, [inventory, printQueue, checkDesignRequirements])

  // Remove from print queue (decrement quantity, remove when 0)
  const removeFromPrintQueue = useCallback((index) => {
    const design = printQueue[index]
    if (!design) return

    // restore inventory for one unit
    setInventory(prev =>
      prev.map(f => {
        const filament = design.filaments?.find(
          fil => fil.filament_id === f.filament_id ||
                 fil.color?.toLowerCase() === f.color.toLowerCase()
        )
        if (filament) {
          return { ...f, stock_grams: f.stock_grams + (filament.weight_grams || 0) }
        }
        return f
      })
    )

    let newQueue
    const currentQty = design.quantity || 1

    if (currentQty > 1) {
      // Decrement 
      newQueue = printQueue.map((d, i) =>
        i === index ? { ...d, quantity: currentQty - 1 } : d
      )
    } else {
      // get rid of entirely
      newQueue = printQueue.filter((_, i) => i !== index)
    }

    setPrintQueue(newQueue)
    sessionStorage.setItem('n3d_print_queue', JSON.stringify(newQueue))
    logStorage('Update', 'sessionStorage', `${newQueue.length} wishlist items`)
  }, [printQueue])

  // Reset to defaults
  const resetInventory = useCallback(() => {
    const defaults = getDefaultInventory()
    setInventory(defaults)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    setPrintQueue([])
    sessionStorage.removeItem('n3d_print_queue')
    logStorage('Reset', 'localStorage + sessionStorage', 'cleared')
  }, [])

  return {
    inventory,
    printQueue,
    updateStock,
    checkDesignRequirements,
    addToPrintQueue,
    removeFromPrintQueue,
    resetInventory
  }
}

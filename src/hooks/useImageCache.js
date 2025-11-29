import { useState, useEffect, useCallback } from 'react'

const CACHE_PREFIX = 'n3d_img_'
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Image caching hook using IndexedDB for persistent storage
 * Falls back to in-memory cache if IndexedDB unavailable
 */

let db = null
const memoryCache = new Map()

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db)

    const request = indexedDB.open('n3d_image_cache', 1)

    request.onerror = () => {
      console.warn('IndexedDB unavailable, using memory cache')
      resolve(null)
    }

    request.onsuccess = (e) => {
      db = e.target.result
      resolve(db)
    }

    request.onupgradeneeded = (e) => {
      const database = e.target.result
      if (!database.objectStoreNames.contains('images')) {
        database.createObjectStore('images', { keyPath: 'url' })
      }
    }
  })
}

// Check if cached image is still valid
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_EXPIRY_MS
}

// Get cached image from IndexedDB or memory
const getCachedImage = async (url) => {
  // Check memory first
  const memCached = memoryCache.get(url)
  if (memCached && isCacheValid(memCached.timestamp)) {
    return memCached.blob
  }

  // Try IndexedDB
  const database = await initDB()
  if (!database) return null

  return new Promise((resolve) => {
    const tx = database.transaction('images', 'readonly')
    const store = tx.objectStore('images')
    const request = store.get(url)

    request.onsuccess = () => {
      const result = request.result
      if (result && isCacheValid(result.timestamp)) {
        // Update memory cache
        memoryCache.set(url, result)
        resolve(result.blob)
      } else {
        resolve(null)
      }
    }

    request.onerror = () => resolve(null)
  })
}

// Cache image to IndexedDB and memory
const cacheImage = async (url, blob) => {
  const cacheEntry = { url, blob, timestamp: Date.now() }

  // Always update memory cache
  memoryCache.set(url, cacheEntry)

  // Try IndexedDB
  const database = await initDB()
  if (!database) return

  const tx = database.transaction('images', 'readwrite')
  const store = tx.objectStore('images')
  store.put(cacheEntry)
}

// Clear expired cache entries
const clearExpiredCache = async () => {
  const database = await initDB()
  if (!database) {
    // Clear memory cache
    for (const [url, entry] of memoryCache) {
      if (!isCacheValid(entry.timestamp)) {
        memoryCache.delete(url)
      }
    }
    return
  }

  const tx = database.transaction('images', 'readwrite')
  const store = tx.objectStore('images')
  const request = store.openCursor()

  request.onsuccess = (e) => {
    const cursor = e.target.result
    if (cursor) {
      if (!isCacheValid(cursor.value.timestamp)) {
        cursor.delete()
        memoryCache.delete(cursor.value.url)
      }
      cursor.continue()
    }
  }
}

// Track failed images to log once at end
const failedImages = []
let logTimeout = null
let cachedCount = 0
let fetchedCount = 0

const logFailedImages = () => {
  if (failedImages.length > 0) {
    console.group('%cImage Load Failures', 'color: #f59e0b; font-weight: bold')
    console.table(failedImages.map(({ label, url, error }) => ({
      'Design': label || '(unknown)',
      'URL': url,
      'Error': error
    })))
    console.groupEnd()
    failedImages.length = 0
  }
}

let statsTimeout = null

const logCacheStats = () => {
  if (cachedCount > 0 || fetchedCount > 0) {
    console.log(`%cImages: %c${cachedCount} cached %c${fetchedCount} fetched`,
      'color: #206bc4; font-weight: bold',
      'color: #2fb344',
      'color: #f59e0b'
    )
    cachedCount = 0
    fetchedCount = 0
  }
}

const scheduleStatsLog = () => {
  clearTimeout(statsTimeout)
  statsTimeout = setTimeout(logCacheStats, 500)
}

/**
 * Hook to load and cache images
 * @param {string} url - Image URL to load
 * @param {string} label - Label for error logging (e.g., design title)
 */
export function useImageCache(url, label = null) {
  const [src, setSrc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!url) {
      setLoading(false)
      setError('No URL provided')
      if (label) {
        failedImages.push({ label, url: '(none)', error: 'No image URL in API response' })
        clearTimeout(logTimeout)
        logTimeout = setTimeout(logFailedImages, 500)
      }
      return
    }

    let cancelled = false

    const loadImage = async () => {
      setLoading(true)
      setError(null)

      // Check cache first
      const cached = await getCachedImage(url)
      if (cached && !cancelled) {
        const objectUrl = URL.createObjectURL(cached)
        setSrc(objectUrl)
        setFromCache(true)
        setLoading(false)
        cachedCount++
        scheduleStatsLog()
        return
      }

      // Fetch and cache
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()

        if (!cancelled) {
          await cacheImage(url, blob)
          const objectUrl = URL.createObjectURL(blob)
          setSrc(objectUrl)
          setFromCache(false)
          setLoading(false)
          fetchedCount++
          scheduleStatsLog()
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err.message || 'Network error'
          setError(errorMsg)

          // Track for grouped logging
          failedImages.push({ label, url, error: errorMsg })
          clearTimeout(logTimeout)
          logTimeout = setTimeout(logFailedImages, 500)

          // Fallback to direct URL (browser might handle it)
          setSrc(url)
          setFromCache(false)
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      cancelled = true
      if (src && src.startsWith('blob:')) {
        URL.revokeObjectURL(src)
      }
    }
  }, [url, label])

  return { src, loading, fromCache, error }
}

// Initialize and clean cache on load
initDB().then(() => clearExpiredCache())

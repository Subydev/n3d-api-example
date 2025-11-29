/**
 * N3D API example
 * https://n3dmelbourne.com/resources/docs/designs-api
 */

// proxy handles CORS - vite in dev, vercel rewrites in prod
const API_BASE = '/api/v1'

const getApiKey = () => import.meta.env.VITE_N3D_API_KEY


// included console logs for debugging
const logApi = (method, endpoint, details = '') => {
  console.log(
    `%cAPI %c${method} %c${endpoint}${details ? ` %c${details}` : ''}`,
    'color: #206bc4; font-weight: bold',
    'color: #f59e0b',
    'color: #888',
    details ? 'color: #666' : ''
  )
}


// get a paginated list of designs - returns basic info only
export async function getDesigns({ page = 1, limit = 50, category, query } = {}) {
  const params = new URLSearchParams({ page, limit })
  if (category) params.set('category', category)
  if (query) params.set('query', query)

  logApi('GET', '/designs', `page=${page} limit=${limit}`)

  const response = await fetch(`${API_BASE}/designs?${params}`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// batch fetch multiple designs
// max 20 slugs per request
export async function getDesignsBatch(slugs, locale = 'US') {
  logApi('POST', '/designs/batch', `${slugs.length} slugs`)

  const response = await fetch(`${API_BASE}/designs/batch`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slugs, locale })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

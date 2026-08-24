const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const TOKEN_KEY = 'xuetuxing-merchant-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = token => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const getMerchantWebSocketBaseUrl = () => {
  const base = API_BASE.replace(/\/api\/v1\/?$/, '')
  const origin = base.startsWith('http') ? base : window.location.origin
  return origin.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/api/v1'
}

const getApiOrigin = () => {
  const base = API_BASE.replace(/\/api\/v1\/?$/, '')
  return base.startsWith('http') ? base : window.location.origin
}

export const resolveMerchantAssetUrl = url => {
  if (!url) return ''
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  if (url.includes('/api/v1/public/assets/')) return url.startsWith('http') ? url : `${getApiOrigin()}${url}`
  if (/^https?:\/\/[^/]+\.obs\./.test(url)) {
    return `${getApiOrigin()}/api/v1/public/assets/proxy?url=${encodeURIComponent(url)}`
  }
  if (url.startsWith('http')) return url
  return `${getApiOrigin()}${url.startsWith('/') ? '' : '/'}${url}`
}

export const resolveMerchantAssetThumbUrl = url => {
  const resolved = resolveMerchantAssetUrl(url)
  if (!resolved) return ''
  return resolved
    .replace(/\/api\/v1\/public\/assets\/(\d+)\/file(\?.*)?$/, '/api/v1/public/assets/$1/thumb$2')
    .replace(/\/api\/v1\/public\/assets\/object\/(.+)$/, '/api/v1/public/assets/object-thumb/$1')
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) headers['Content-Type'] = 'application/json'
  if (!options.skipAuth && getToken()) headers.Authorization = `Bearer ${getToken()}`
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `请求失败：${response.status}`)
  }
  return response.status === 204 ? null : response.json()
}

export const merchantApi = {
  login: payload => request('/merchant/login', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  getSliderCaptcha: () => request(`/auth/slider-captcha?_t=${Date.now()}`, { skipAuth: true }),
  verifySliderCaptcha: payload => request('/auth/slider-captcha/verify', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  apply: payload => request('/merchant/apply', { method: 'POST', body: JSON.stringify(payload), skipAuth: true }),
  me: () => request('/merchant/me'),
  logout: () => request('/merchant/logout', { method: 'POST' }),
  getStudyProducts: () => request('/merchant/study/products'),
  createStudyProduct: product => request('/merchant/study/products', { method: 'POST', body: JSON.stringify(product) }),
  updateStudyProduct: (id, product) => request(`/merchant/study/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  setStudyProductStatus: (id, enabled) => request(`/merchant/study/products/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  getTravelRoutes: () => request('/merchant/travel/routes'),
  getTravelRouteReviews: () => request('/merchant/travel/route-reviews'),
  createTravelRoute: route => request('/merchant/travel/routes', { method: 'POST', body: JSON.stringify(route) }),
  updateTravelRoute: route => request(`/merchant/travel/routes/${route.id}`, { method: 'PUT', body: JSON.stringify(route) }),
  setTravelRouteStatus: (id, enabled) => request(`/merchant/travel/routes/${id}/status?enabled=${enabled}`, { method: 'PATCH' }),
  getStudyOrders: () => request('/merchant/study/orders'),
  getSupportConversations: () => request('/support/merchant/conversations'),
  getSupportMessages: id => request(`/support/merchant/conversations/${id}/messages`),
  uploadSupportImage: (conversationId, file) => {
    const body = new FormData()
    body.append('conversation_id', conversationId)
    body.append('role', 'merchant')
    body.append('file', file)
    return request('/support/upload', { method: 'POST', body })
  },
}

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Global loading overlay (anti-double-click) ────────────────────────
// Sólo cuenta mutaciones (POST/PUT/PATCH/DELETE), no GETs.
const MUTATIONS = new Set(['post', 'put', 'patch', 'delete'])
let _pending = 0
const _emit = () => window.dispatchEvent(new CustomEvent('api:loading', { detail: _pending }))

api.interceptors.request.use(config => {
  if (MUTATIONS.has(config.method)) { _pending++; _emit() }
  return config
})
api.interceptors.response.use(
  res => {
    if (MUTATIONS.has(res.config?.method)) { _pending = Math.max(0, _pending - 1); _emit() }
    return res
  },
  err => {
    if (MUTATIONS.has(err.config?.method)) { _pending = Math.max(0, _pending - 1); _emit() }
    // Token expirado / inválido → redirigir al login
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('admin_token')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Config ────────────────────────────────────────────────────────────
// ── Compresión de imágenes en el navegador ────────────────────────────
// Las fotos de celular pesan 3-8 MB; comprimirlas antes de subir hace la
// subida ~20x más rápida. Máx 1600px, JPEG 82%. Si el resultado no es más
// liviano (o el archivo ya es pequeño), se sube el original.
const compressImage = (file, maxDim = 1600, quality = 0.82) => new Promise((resolve) => {
  if (!file?.type?.startsWith('image/') || file.type === 'image/gif' || file.size < 300 * 1024) return resolve(file)
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    URL.revokeObjectURL(url)
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (blob && blob.size < file.size) {
        resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }))
      } else resolve(file)
    }, 'image/jpeg', quality)
  }
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
  img.src = url
})

export const getConfig = () => api.get('/config').then(r => r.data)
export const updateConfig = (data) => api.put('/config', data).then(r => r.data)
export const uploadLogo = (file) => {
  const fd = new FormData(); fd.append('file', file)
  return api.post('/config/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}

// ── Dashboard ─────────────────────────────────────────────────────────
export const getDashboard = () => api.get('/dashboard').then(r => r.data)

// ── Suppliers ─────────────────────────────────────────────────────────
export const getSuppliers = (search) => api.get('/suppliers', { params: { search } }).then(r => r.data)
export const getSupplier = (id) => api.get(`/suppliers/${id}`).then(r => r.data)
export const createSupplier = (data) => api.post('/suppliers', data).then(r => r.data)
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data).then(r => r.data)
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`).then(r => r.data)

// ── Products ──────────────────────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params }).then(r => r.data)
export const getProduct = (id) => api.get(`/products/${id}`).then(r => r.data)
export const createProduct = (data) => api.post('/products', data).then(r => r.data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data)
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data)
export const addVariant = (productId, data) => api.post(`/products/${productId}/variants`, data).then(r => r.data)
export const getCategories = () => api.get('/products/categories').then(r => r.data)
export const getBrands = () => api.get('/brands').then(r => r.data)
export const uploadProductImage = async (productId, file) => {
  const fd = new FormData(); fd.append('file', await compressImage(file))
  return api.post(`/products/${productId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const deleteProductImage = (imageId) => api.delete(`/products/images/${imageId}`).then(r => r.data)
export const uploadVariantImage = async (variantId, file) => {
  const fd = new FormData(); fd.append('file', await compressImage(file))
  return api.post(`/products/variants/${variantId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const deleteVariantImage = (variantId) => api.delete(`/products/variants/${variantId}/image`).then(r => r.data)

// ── Purchases ─────────────────────────────────────────────────────────
export const getPurchases = () => api.get('/purchases').then(r => r.data)
export const getPurchase = (id) => api.get(`/purchases/${id}`).then(r => r.data)
export const createPurchase = (data) => api.post('/purchases', data).then(r => r.data)
export const rectifyPurchase = (id, data) => api.patch(`/purchases/${id}/rectify`, data).then(r => r.data)
export const deletePurchase = (id) => api.delete(`/purchases/${id}`).then(r => r.data)

// ── Sales ─────────────────────────────────────────────────────────────
export const getSales = () => api.get('/sales').then(r => r.data)
export const getSale = (id) => api.get(`/sales/${id}`).then(r => r.data)
export const createSale = (data) => api.post('/sales', data).then(r => r.data)
export const deleteSale = (id) => api.delete(`/sales/${id}`).then(r => r.data)

// ── Accounting ────────────────────────────────────────────────────────
export const getEntries = () => api.get('/accounting/entries').then(r => r.data)
export const getCapital = () => api.get('/accounting/capital').then(r => r.data)
export const addCapital = (data) => api.post('/accounting/capital', data).then(r => r.data)
export const deleteCapital = (id) => api.delete(`/accounting/capital/${id}`).then(r => r.data)
export const getIncomeStatement = () => api.get('/accounting/income-statement').then(r => r.data)
export const getBalanceSheet = () => api.get('/accounting/balance-sheet').then(r => r.data)

// ── Appearance ────────────────────────────────────────────────────────
export const getAnnouncement = () => api.get('/appearance/announcement').then(r => r.data)
export const updateAnnouncement = (text) => api.put('/appearance/announcement', { announcement_text: text }).then(r => r.data)
export const getBannersAll = () => api.get('/appearance/banners/all').then(r => r.data)
export const getBannersActive = () => api.get('/appearance/banners').then(r => r.data)
export const updateBanner = (id, data) => api.put(`/appearance/banners/${id}`, data).then(r => r.data)
export const uploadBannerImage = async (id, file) => {
  const fd = new FormData(); fd.append('file', await compressImage(file, 2000))
  return api.post(`/appearance/banners/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const deleteBannerImage = (id) => api.delete(`/appearance/banners/${id}/image`).then(r => r.data)
export const getSections = () => api.get('/appearance/sections').then(r => r.data)
export const updateSection = (key, data) => api.put(`/appearance/sections/${key}`, data).then(r => r.data)

// ── Cobranzas ─────────────────────────────────────────────────────────
export const getPayables = () => api.get('/cobranzas/payables').then(r => r.data)
export const payPurchase = (id, data) => api.post(`/cobranzas/payables/${id}/pay`, data).then(r => r.data)
export const getReceivables = () => api.get('/cobranzas/receivables').then(r => r.data)
export const collectSale = (id, data) => api.post(`/cobranzas/receivables/${id}/collect`, data).then(r => r.data)

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default api

// ── Config ────────────────────────────────────────────────────────────
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
export const getCategories = () => api.get('/products/categories').then(r => r.data)
export const uploadProductImage = (productId, file) => {
  const fd = new FormData(); fd.append('file', file)
  return api.post(`/products/${productId}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const deleteProductImage = (imageId) => api.delete(`/products/images/${imageId}`).then(r => r.data)
export const uploadVariantImage = (variantId, file) => {
  const fd = new FormData(); fd.append('file', file)
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

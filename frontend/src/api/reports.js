import api from './client'

export const reportsApi = {
  list: () => api.get('/reports').then((r) => r.data),
  get: (id) => api.get(`/reports/${id}`).then((r) => r.data),
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post('/reports/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  delete: (id) => api.delete(`/reports/${id}`).then((r) => r.data),
  reprocess: (id) => api.post(`/reports/${id}/reprocess`).then((r) => r.data),
}

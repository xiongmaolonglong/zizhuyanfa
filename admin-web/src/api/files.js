import api from './index'

// ===== 文件上传 =====
export const uploadFile = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const uploadFiles = (files) => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  return api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
